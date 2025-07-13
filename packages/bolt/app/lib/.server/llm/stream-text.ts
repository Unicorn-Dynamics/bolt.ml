import { streamText as _streamText, convertToCoreMessages } from 'ai';
import { getAPIKey } from '~/lib/.server/llm/api-key';
import { getAnthropicModel, getDevModel } from '~/lib/.server/llm/model';
import { MAX_TOKENS } from './constants';
import { getSystemPrompt } from './prompts';

interface ToolResult<Name extends string, Args, Result> {
  toolCallId: string;
  toolName: Name;
  args: Args;
  result: Result;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: ToolResult<string, unknown, unknown>[];
}

export type Messages = Message[];

export type StreamingOptions = Omit<Parameters<typeof _streamText>[0], 'model'>;

// production stream text with Anthropic
export function streamText(messages: Messages, env: Env, options?: StreamingOptions) {
  return _streamText({
    model: getAnthropicModel(getAPIKey(env)),
    system: getSystemPrompt(),
    maxTokens: MAX_TOKENS,
    headers: {
      'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15',
    },
    messages: convertToCoreMessages(messages),
    ...options,
  });
}

// development stream text with local/mock models
export async function streamTextDev(messages: Messages, options?: { personaId?: string }) {
  const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development';
  const forceLocal = process.env.VITE_FORCE_LOCAL_MODEL === 'true';

  if (isDev || forceLocal) {
    try {
      const model = await getDevModel();
      const systemPrompt = getSystemPrompt(undefined, options?.personaId);

      // create a simple stream for local models
      return createLocalModelStream(model, messages, systemPrompt);
    } catch (error) {
      console.error('Dev model failed, falling back to mock:', error);

      const mockModel = await getDevModel({ provider: 'mock' });
      const systemPrompt = getSystemPrompt(undefined, options?.personaId);

      return createLocalModelStream(mockModel, messages, systemPrompt);
    }
  }

  // fallback to production in dev if no local models
  throw new Error('No API key available and local models not configured');
}

// create stream for local models that don't use the 'ai' library
async function createLocalModelStream(model: any, messages: Messages, systemPrompt: string) {
  const lastMessage = messages[messages.length - 1];
  const fullPrompt = `${systemPrompt}\n\nUser: ${lastMessage.content}`;

  return {
    async *textStream() {
      for await (const chunk of model.textStream(fullPrompt)) {
        yield chunk;
      }
    },

    // compatibility with ai library interface
    pipeAISDKCompatibleStream() {
      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of model.textStream(fullPrompt)) {
              if (chunk.type === 'text-delta') {
                controller.enqueue(`data: ${JSON.stringify({ type: 'text', data: chunk.textDelta })}\n\n`);
              } else if (chunk.type === 'finish') {
                controller.enqueue(`data: ${JSON.stringify({ type: 'finish', data: chunk })}\n\n`);
                controller.close();

                return;
              }
            }
          } catch (error) {
            controller.error(error);
          }
        },
      });
    },
  };
}
