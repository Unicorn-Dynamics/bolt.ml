/**
 * Ollama local model integration
 * Run: ollama serve && ollama pull llama3.2 (or any model you prefer)
 */

interface OllamaResponse {
  response?: string;
  done?: boolean;
  prompt_eval_count?: number;
  eval_count?: number;
}

interface OllamaModelsResponse {
  models?: Array<{ name: string }>;
}

export interface OllamaOptions {
  baseURL?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export function createOllamaModel(options: OllamaOptions = {}) {
  const { baseURL = 'http://localhost:11434', model = 'qwen2.5:3b', temperature = 0.7, maxTokens = 2048 } = options;

  return {
    async *textStream(prompt: string) {
      try {
        const response = await fetch(`${baseURL}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            prompt,
            stream: true,
            options: {
              temperature,
              num_predict: maxTokens,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(
            `Ollama API error: ${response.statusText} (${response.status}). ${errorText}. Make sure Ollama is running with: ollama serve`,
          );
        }

        const reader = response.body?.getReader();

        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');

          // keep the last potentially incomplete line in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line) as OllamaResponse;

                if (data.response) {
                  yield {
                    type: 'text-delta' as const,
                    textDelta: data.response,
                  };
                }

                if (data.done) {
                  yield {
                    type: 'finish' as const,
                    finishReason: 'stop' as const,
                    usage: {
                      promptTokens: data.prompt_eval_count || 0,
                      completionTokens: data.eval_count || 0,
                      totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
                    },
                  };

                  return;
                }
              } catch {
                console.warn('Failed to parse Ollama response line:', line);
              }
            }
          }
        }
      } catch (error) {
        console.error('Ollama model error:', error);
        throw error;
      }
    },

    async generate(prompt: string) {
      try {
        const response = await fetch(`${baseURL}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            prompt,
            stream: false,
            options: {
              temperature,
              num_predict: maxTokens,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = (await response.json()) as OllamaResponse;

        return {
          text: data.response || '',
          usage: {
            promptTokens: data.prompt_eval_count || 0,
            completionTokens: data.eval_count || 0,
            totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
          },
        };
      } catch (error) {
        console.error('Ollama model error:', error);
        throw error;
      }
    },
  };
}

// check if Ollama is available
export async function isOllamaAvailable(baseURL = 'http://localhost:11434'): Promise<boolean> {
  try {
    const response = await fetch(`${baseURL}/api/tags`, {
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

// get available Ollama models
export async function getOllamaModels(baseURL = 'http://localhost:11434'): Promise<string[]> {
  try {
    const response = await fetch(`${baseURL}/api/tags`);

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as OllamaModelsResponse;

    return data.models?.map((model) => model.name) || [];
  } catch {
    return [];
  }
}
