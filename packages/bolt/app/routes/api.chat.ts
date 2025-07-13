import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { actionWithAuth } from '~/lib/.server/auth';
import { MAX_RESPONSE_SEGMENTS, MAX_TOKENS } from '~/lib/.server/llm/constants';
import { CONTINUE_PROMPT } from '~/lib/.server/llm/prompts';
import { streamText, streamTextDev, type Messages, type StreamingOptions } from '~/lib/.server/llm/stream-text';
import SwitchableStream from '~/lib/.server/llm/switchable-stream';
import type { Session } from '~/lib/.server/sessions';
import { AnalyticsAction, AnalyticsTrackEvent, sendEventInternal } from '~/lib/analytics';

export async function action(args: ActionFunctionArgs) {
  return actionWithAuth(args, chatAction);
}

async function chatAction({ context, request }: ActionFunctionArgs, session: Session) {
  const { messages, personaId } = await request.json<{ messages: Messages; personaId?: string }>();

  const stream = new SwitchableStream();

  try {
    const options: StreamingOptions = {
      toolChoice: 'none',
      onFinish: async ({ text: content, finishReason, usage }) => {
        if (finishReason !== 'length') {
          await sendEventInternal(session, {
            action: AnalyticsAction.Track,
            payload: {
              event: AnalyticsTrackEvent.MessageComplete,
              properties: {
                usage,
                finishReason,
              },
            },
          });

          return stream.close();
        }

        if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
          throw Error('Cannot continue message: Maximum segments reached');
        }

        const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;

        console.log(`Reached max token limit (${MAX_TOKENS}): Continuing message (${switchesLeft} switches left)`);

        messages.push({ role: 'assistant', content });
        messages.push({ role: 'user', content: CONTINUE_PROMPT });

        // use local models in development
        const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development';
        const forceLocal = process.env.VITE_FORCE_LOCAL_MODEL === 'true';

        if (isDev || forceLocal) {
          const result = await streamTextDev(messages, { personaId });
          return stream.switchSource(result.pipeAISDKCompatibleStream());
        } else {
          const result = await streamText(messages, context.cloudflare.env, options);

          return stream.switchSource(result.toAIStream());
        }
      },
    };

    // use local models in development
    const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development';
    const forceLocal = process.env.VITE_FORCE_LOCAL_MODEL === 'true';

    if (isDev || forceLocal) {
      try {
        const result = await streamTextDev(messages, { personaId });
        stream.switchSource(result.pipeAISDKCompatibleStream());
      } catch (error) {
        console.error('Local model failed, trying production API:', error);

        const result = await streamText(messages, context.cloudflare.env, options);

        stream.switchSource(result.toAIStream());
      }
    } else {
      const result = await streamText(messages, context.cloudflare.env, options);

      stream.switchSource(result.toAIStream());
    }

    return new Response(stream.readable, {
      status: 200,
      headers: {
        contentType: 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.log(error);

    throw new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}
