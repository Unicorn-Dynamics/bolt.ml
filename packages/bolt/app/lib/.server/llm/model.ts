import { createAnthropic } from '@ai-sdk/anthropic';
import { createMockModel } from './mock-model';
import { createOllamaModel, isOllamaAvailable } from './ollama-model';

export type ModelProvider = 'anthropic' | 'mock' | 'ollama';

export interface ModelConfig {
  provider: ModelProvider;
  apiKey?: string;
  ollamaModel?: string;
  mockOptions?: {
    delay?: number;
    responseType?: 'success' | 'error' | 'random';
    customResponse?: string;
  };
}

export function getAnthropicModel(apiKey: string) {
  const anthropic = createAnthropic({
    apiKey,
  });

  return anthropic('claude-3-5-sonnet-20240620');
}

export function getMockModel(options = {}) {
  return createMockModel(options);
}

export function getOllamaModel(modelName = 'qwen2.5:3b') {
  return createOllamaModel({ model: modelName });
}

// auto-detect best available model for development
export async function getDevModel(config?: Partial<ModelConfig>) {
  const provider = config?.provider || process.env.VITE_DEV_MODEL_PROVIDER || 'auto';

  switch (provider) {
    case 'mock': {
      return getMockModel(config?.mockOptions);
    }

    case 'ollama': {
      return getOllamaModel(config?.ollamaModel);
    }

    case 'anthropic': {
      if (!config?.apiKey) {
        throw new Error('API key required for Anthropic model');
      }

      return getAnthropicModel(config.apiKey);
    }

    case 'auto':
    default: {
      // try Ollama first, fall back to mock
      if (await isOllamaAvailable()) {
        console.log('🦙 Using Ollama for local development');
        return getOllamaModel(config?.ollamaModel);
      } else {
        console.log('🎭 Using mock model for local development');
        return getMockModel(config?.mockOptions);
      }
    }
  }
}
