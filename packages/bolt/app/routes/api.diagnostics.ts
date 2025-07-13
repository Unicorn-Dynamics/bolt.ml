import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { actionWithAuth } from '~/lib/.server/auth';
import { getDevModel, isOllamaAvailable } from '~/lib/.server/llm/model';
import { getOllamaModels } from '~/lib/.server/llm/ollama-model';
import { getAPIKey } from '~/lib/.server/llm/api-key';
import { getAvailablePersonas } from '~/lib/.server/llm/prompts';
import type { Session } from '~/lib/.server/sessions';

export interface DiagnosticTest {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  message?: string;
  details?: Record<string, any>;
  duration?: number;
}

export interface DiagnosticResult {
  timestamp: string;
  tests: DiagnosticTest[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

export async function action(args: ActionFunctionArgs) {
  return actionWithAuth(args, diagnosticsAction);
}

async function diagnosticsAction({ context, request }: ActionFunctionArgs, session: Session) {
  const { testIds } = await request.json<{ testIds?: string[] }>();

  const tests: DiagnosticTest[] = [
    {
      id: 'auth',
      name: 'Authentication System',
      description: 'Check if auth bypass is working correctly',
      status: 'pending',
    },
    {
      id: 'personas',
      name: 'Persona System',
      description: 'Verify persona configuration and availability',
      status: 'pending',
    },
    {
      id: 'models',
      name: 'AI Model Configuration',
      description: 'Test local and remote model availability',
      status: 'pending',
    },
    {
      id: 'ollama',
      name: 'Ollama Integration',
      description: 'Check Ollama server and models',
      status: 'pending',
    },
    {
      id: 'mock',
      name: 'Mock Model',
      description: 'Test mock model responses',
      status: 'pending',
    },
    {
      id: 'api_key',
      name: 'API Key Configuration',
      description: 'Verify Anthropic API key setup',
      status: 'pending',
    },
    {
      id: 'environment',
      name: 'Environment Variables',
      description: 'Check development environment configuration',
      status: 'pending',
    },
    {
      id: 'webcontainer',
      name: 'WebContainer Features',
      description: 'Test file system and terminal capabilities',
      status: 'pending',
    },
  ];

  // filter tests if specific ones requested
  const testsToRun = testIds ? tests.filter((t) => testIds.includes(t.id)) : tests;

  // run each test
  for (const test of testsToRun) {
    const startTime = Date.now();
    test.status = 'running';

    try {
      switch (test.id) {
        case 'auth': {
          await testAuthentication(test, session);
          break;
        }
        case 'personas': {
          await testPersonas(test);
          break;
        }
        case 'models': {
          await testModels(test, context.cloudflare.env);
          break;
        }
        case 'ollama': {
          await testOllama(test);
          break;
        }
        case 'mock': {
          await testMockModel(test);
          break;
        }
        case 'api_key': {
          await testApiKey(test, context.cloudflare.env);
          break;
        }
        case 'environment': {
          await testEnvironment(test);
          break;
        }
        case 'webcontainer': {
          await testWebContainer(test);
          break;
        }
        default: {
          test.status = 'failed';
          test.message = 'Unknown test';
        }
      }
    } catch (error) {
      test.status = 'failed';
      test.message = error instanceof Error ? error.message : 'Unknown error';
      test.details = { error: String(error) };
    }

    test.duration = Date.now() - startTime;
  }

  const result: DiagnosticResult = {
    timestamp: new Date().toISOString(),
    tests: testsToRun,
    summary: {
      total: testsToRun.length,
      passed: testsToRun.filter((t) => t.status === 'passed').length,
      failed: testsToRun.filter((t) => t.status === 'failed').length,
      warnings: testsToRun.filter((t) => t.status === 'warning').length,
    },
  };

  return json(result);
}

async function testAuthentication(test: DiagnosticTest, session: Session) {
  const isDev = import.meta.env.DEV;
  const authDisabled = import.meta.env.VITE_DISABLE_AUTH;

  if (isDev && authDisabled) {
    test.status = 'passed';
    test.message = 'Authentication bypass enabled for development';
    test.details = { session: session ? 'Present' : 'Bypassed', isDev, authDisabled };
  } else if (!session) {
    test.status = 'failed';
    test.message = 'No session found and auth not disabled';
    test.details = { isDev, authDisabled };
  } else {
    test.status = 'passed';
    test.message = 'Authentication working correctly';
    test.details = { session: 'Valid', isDev, authDisabled };
  }
}

async function testPersonas(test: DiagnosticTest) {
  try {
    const personas = getAvailablePersonas();

    if (personas.length === 0) {
      test.status = 'failed';
      test.message = 'No personas available';
    } else {
      test.status = 'passed';
      test.message = `${personas.length} personas available`;
      test.details = {
        count: personas.length,
        personas: personas.map((p) => ({ id: p.id, name: p.name })),
      };
    }
  } catch (error) {
    test.status = 'failed';
    test.message = 'Failed to load personas';
    test.details = { error: String(error) };
  }
}

async function testModels(test: DiagnosticTest, env: Env) {
  try {
    const forceLocal = process.env.VITE_FORCE_LOCAL_MODEL === 'true';
    const provider = process.env.VITE_DEV_MODEL_PROVIDER || 'auto';

    test.details = {
      provider,
      forceLocal,
      environment: import.meta.env.DEV ? 'development' : 'production',
    };

    if (forceLocal || import.meta.env.DEV) {
      try {
        await getDevModel();
        test.status = 'passed';
        test.message = `Local model configured (${provider})`;
        test.details.model = 'Available';
      } catch (error) {
        test.status = 'warning';
        test.message = 'Local model unavailable, may fall back to API';
        test.details.error = String(error);
      }
    } else {
      const apiKey = getAPIKey(env);

      if (apiKey) {
        test.status = 'passed';
        test.message = 'API model configured';
        test.details.apiKey = 'Present';
      } else {
        test.status = 'failed';
        test.message = 'No API key and local models not configured';
      }
    }
  } catch (error) {
    test.status = 'failed';
    test.message = 'Model configuration error';
    test.details = { error: String(error) };
  }
}

async function testOllama(test: DiagnosticTest) {
  try {
    const baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const isAvailable = await isOllamaAvailable(baseURL);

    if (isAvailable) {
      const models = await getOllamaModels(baseURL);
      test.status = 'passed';
      test.message = `Ollama running with ${models.length} models`;
      test.details = {
        baseURL,
        models,
        configured_model: process.env.OLLAMA_MODEL || 'llama3.2',
      };
    } else {
      test.status = 'warning';
      test.message = 'Ollama not running (this is optional)';
      test.details = {
        baseURL,
        suggestion: 'Run: ollama serve',
      };
    }
  } catch (error) {
    test.status = 'warning';
    test.message = 'Ollama check failed (this is optional)';
    test.details = { error: String(error) };
  }
}

async function testMockModel(test: DiagnosticTest) {
  try {
    const { createMockModel } = await import('~/lib/.server/llm/mock-model');
    const mockModel = createMockModel({ delay: 100 });

    const result = await mockModel.generate('Test prompt');

    if (result.text && result.text.length > 0) {
      test.status = 'passed';
      test.message = 'Mock model working correctly';
      test.details = {
        responseLength: result.text.length,
        usage: result.usage,
      };
    } else {
      test.status = 'failed';
      test.message = 'Mock model returned empty response';
    }
  } catch (error) {
    test.status = 'failed';
    test.message = 'Mock model error';
    test.details = { error: String(error) };
  }
}

async function testApiKey(test: DiagnosticTest, env: Env) {
  try {
    const apiKey = getAPIKey(env);

    if (apiKey) {
      test.status = 'passed';
      test.message = 'API key configured';
      test.details = {
        source: env.ANTHROPIC_API_KEY ? 'Environment' : 'Cloudflare',
        length: apiKey.length,
        preview: `${apiKey.slice(0, 10)}...${apiKey.slice(-4)}`,
      };
    } else {
      const forceLocal = process.env.VITE_FORCE_LOCAL_MODEL === 'true';

      if (forceLocal) {
        test.status = 'warning';
        test.message = 'No API key (local models forced)';
        test.details = { forceLocal };
      } else {
        test.status = 'failed';
        test.message = 'No API key configured';
        test.details = { suggestion: 'Set ANTHROPIC_API_KEY in .env.local' };
      }
    }
  } catch (error) {
    test.status = 'failed';
    test.message = 'API key check failed';
    test.details = { error: String(error) };
  }
}

async function testEnvironment(test: DiagnosticTest) {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    VITE_DISABLE_AUTH: process.env.VITE_DISABLE_AUTH,
    VITE_DEV_MODEL_PROVIDER: process.env.VITE_DEV_MODEL_PROVIDER,
    VITE_FORCE_LOCAL_MODEL: process.env.VITE_FORCE_LOCAL_MODEL,
    VITE_LOG_LEVEL: process.env.VITE_LOG_LEVEL,
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
    OLLAMA_MODEL: process.env.OLLAMA_MODEL,
  };

  const issues = [];

  if (!envVars.VITE_DISABLE_AUTH && import.meta.env.DEV) {
    issues.push('Auth not disabled in development');
  }

  if (!envVars.VITE_DEV_MODEL_PROVIDER) {
    issues.push('No model provider configured');
  }

  test.details = { envVars, issues };

  if (issues.length === 0) {
    test.status = 'passed';
    test.message = 'Environment properly configured';
  } else {
    test.status = 'warning';
    test.message = `${issues.length} configuration issues`;
  }
}

async function testWebContainer(test: DiagnosticTest) {
  try {
    // test basic capabilities that would be available in WebContainer
    const capabilities = {
      fetch: typeof fetch !== 'undefined',
      fileSystem: typeof process !== 'undefined',
      console: typeof console !== 'undefined',
      timers: typeof setTimeout !== 'undefined',
    };

    const available = Object.values(capabilities).filter(Boolean).length;
    const total = Object.keys(capabilities).length;

    test.status = available === total ? 'passed' : 'warning';
    test.message = `${available}/${total} WebContainer capabilities available`;
    test.details = capabilities;
  } catch (error) {
    test.status = 'failed';
    test.message = 'WebContainer check failed';
    test.details = { error: String(error) };
  }
}
