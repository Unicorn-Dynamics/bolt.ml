import React, { useState } from 'react';

interface DiagnosticTest {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  message?: string;
  duration?: number;
}

interface DiagnosticResult {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  tests: DiagnosticTest[];
}

interface DiagnosticsProps {
  isOpen: boolean;
  onClose: () => void;
}

const allTests: DiagnosticTest[] = [
  {
    id: 'auth',
    name: 'Authentication',
    description: 'Check authentication system and development mode',
    status: 'pending',
  },
  {
    id: 'personas',
    name: 'AI Personas', 
    description: 'Verify persona system and prompt generation',
    status: 'pending',
  },
  {
    id: 'models',
    name: 'Model Selection',
    description: 'Test AI model selection and auto-detection',
    status: 'pending',
  },
  {
    id: 'ollama',
    name: 'Ollama Integration',
    description: 'Check local Ollama server availability',
    status: 'pending',
  },
  {
    id: 'mock',
    name: 'Mock Model',
    description: 'Test mock AI model for development',
    status: 'pending',
  },
  {
    id: 'api_key',
    name: 'API Key Configuration',
    description: 'Verify API key setup for external providers',
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
    name: 'WebContainer',
    description: 'Test WebContainer initialization and functionality',
    status: 'pending',
  },
];

const getStatusIcon = (status: DiagnosticTest['status']) => {
  switch (status) {
    case 'passed': {
      return '✅';
    }
    case 'failed': {
      return '❌';
    }
    case 'warning': {
      return '⚠️';
    }
    case 'running': {
      return '🔄';
    }
    default: {
      return '⏳';
    }
  }
};

const getStatusColor = (status: DiagnosticTest['status']) => {
  switch (status) {
    case 'passed': {
      return 'text-green-600';
    }
    case 'failed': {
      return 'text-red-600';
    }
    case 'warning': {
      return 'text-yellow-600';
    }
    case 'running': {
      return 'text-blue-600';
    }
    default: {
      return 'text-gray-500';
    }
  }
};

export function Diagnostics({ isOpen, onClose }: DiagnosticsProps) {
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  const toggleTest = (testId: string) => {
    setSelectedTests((prev) => (prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]));
  };

  const runTests = async (tests: string[]) => {
    setIsRunning(true);
    setResult(null);

    try {
      const response = await fetch('/api/diagnostics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tests }),
      });

      if (!response.ok) {
        throw new Error('Failed to run diagnostics');
      }

      const diagnosticResult = (await response.json()) as DiagnosticResult;
      setResult(diagnosticResult);
    } catch (error) {
      console.error('Diagnostics failed:', error);
      setResult({
        timestamp: new Date().toISOString(),
        totalTests: tests.length,
        passed: 0,
        failed: tests.length,
        warnings: 0,
        tests: tests.map((testId) => ({
          id: testId,
          name: allTests.find((t) => t.id === testId)?.name || testId,
          description: allTests.find((t) => t.id === testId)?.description || '',
          status: 'failed' as const,
          message: 'Failed to run test',
        })),
      });
    } finally {
      setIsRunning(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">System Diagnostics</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            ✕
          </button>
        </div>

        <div className="flex h-full">
          <div className="w-1/3 border-r border-gray-200 p-4 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Available Tests</h3>
            <div className="space-y-2">
              {allTests.map((test) => (
                <label key={test.id} className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedTests.includes(test.id)}
                    onChange={() => toggleTest(test.id)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                      {test.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{test.description}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-6 space-y-2">
              <button
                onClick={() => runTests(selectedTests)}
                disabled={isRunning || selectedTests.length === 0}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isRunning ? '🔄 Running Tests...' : '🧪 Run Selected Tests'}
              </button>
              <button
                onClick={() => setSelectedTests(allTests.map((t) => t.id))}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={() => runTests(allTests.map((t) => t.id))}
                disabled={isRunning}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isRunning ? '🔄 Running All...' : '🧪 Run All Tests'}
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {result ? (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Test Results</h3>
                  <div className="text-sm text-gray-600">{new Date(result.timestamp).toLocaleString()}</div>
                  <div className="mt-2 flex space-x-4 text-sm">
                    <span className="text-green-600">✅ {result.passed} Passed</span>
                    <span className="text-red-600">❌ {result.failed} Failed</span>
                    <span className="text-yellow-600">⚠️ {result.warnings} Warnings</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {result.tests.map((test) => (
                    <TestResult key={test.id} test={test} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-8">
                <div className="text-4xl mb-4">🧪</div>
                <h3 className="text-lg font-medium mb-2">System Health Check</h3>
                <p className="text-sm mb-4">Select tests from the left panel and click Run to begin diagnostics.</p>
                <ul className="text-xs text-left space-y-1 max-w-md mx-auto">
                  <li>• Run <strong>All Tests</strong> for a complete system health check</li>
                  <li>• Use <strong>Selected Tests</strong> to focus on specific areas</li>
                  <li>• Check <strong>Environment</strong> test first if having issues</li>
                  <li>• <strong>Mock Model</strong> test ensures development mode works</li>
                  <li>• <strong>Ollama</strong> warnings are normal if you haven't set it up</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TestResult({ test }: { test: DiagnosticTest }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-lg">{getStatusIcon(test.status)}</span>
            <div>
              <div className="font-medium text-gray-900">{test.name}</div>
              <div className="text-sm text-gray-500">{test.description}</div>
            </div>
            {test.duration && <span className="text-xs text-gray-500">{test.duration}ms</span>}
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${getStatusColor(test.status)}`}>
              {test.status.toUpperCase()}
            </span>
            <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="text-sm text-gray-600 mt-2">
            <strong>Test ID:</strong> {test.id}
          </div>
          {test.message && <div className="mt-2 text-sm text-gray-700">{test.message}</div>}
        </div>
      )}
    </div>
  );
}
