import { useState } from 'react';
import { getAvailablePersonas, getPersona, type PersonaConfig } from '~/lib/.server/llm/prompts';

interface PersonaSelectorProps {
  currentPersona: string;
  onPersonaChange: (personaId: string) => void;
}

export function PersonaSelector({ currentPersona, onPersonaChange }: PersonaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const personas = getAvailablePersonas();
  const selectedPersona = getPersona(currentPersona);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {selectedPersona.name.charAt(0)}
        </div>
        <div className="text-left">
          <div className="font-medium text-sm">{selectedPersona.name}</div>
          <div className="text-xs text-gray-600">{selectedPersona.description}</div>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            {personas.map((persona) => (
              <PersonaOption
                key={persona.id}
                persona={persona}
                isSelected={persona.id === currentPersona}
                onSelect={() => {
                  onPersonaChange(persona.id);
                  setIsOpen(false);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface PersonaOptionProps {
  persona: PersonaConfig;
  isSelected: boolean;
  onSelect: () => void;
}

function PersonaOption({ persona, isSelected, onSelect }: PersonaOptionProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full p-3 rounded-lg text-left transition-colors ${
        isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${
            isSelected ? 'bg-blue-500' : 'bg-gray-400'
          }`}
        >
          {persona.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{persona.name}</div>
          <div className="text-xs text-gray-600 mb-2">{persona.description}</div>
          {persona.capabilities && persona.capabilities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {persona.capabilities.slice(0, 3).map((capability) => (
                <span key={capability} className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-600">
                  {capability}
                </span>
              ))}
              {persona.capabilities.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-600">
                  +{persona.capabilities.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
        {isSelected && (
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
    </button>
  );
}

// usage example in a chat component
export function ChatWithPersona() {
  const [currentPersona, setCurrentPersona] = useState('bolt');

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <PersonaSelector currentPersona={currentPersona} onPersonaChange={setCurrentPersona} />
      </div>
      {/* Rest of your chat UI */}
      <div className="flex-1 p-4">
        {/* Chat messages */}
        <div className="text-sm text-gray-600">
          Currently chatting with: <strong>{getPersona(currentPersona).name}</strong>
        </div>
      </div>
    </div>
  );
}
