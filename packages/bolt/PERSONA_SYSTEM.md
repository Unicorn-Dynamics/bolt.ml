# Persona System for AI Assistant

This system allows you to configure different AI assistant personalities/profiles that users can select from. Each persona has its own specialized system prompt, capabilities, and constraints.

## Overview

The persona system is built around the `PersonaConfig` interface and provides a flexible way to create specialized AI assistants for different use cases.

## Core Components

### 1. Persona Configuration (`prompts.ts`)

```typescript
interface PersonaConfig {
  id: string;              // Unique identifier
  name: string;            // Display name
  description: string;     // Brief description
  systemPrompt: string;    // AI system prompt
  capabilities?: string[]; // What this persona is good at
  constraints?: string[];  // Limitations or focus areas
  examples?: PersonaExample[]; // Example interactions
}
```

### 2. Built-in Personas

- **Bolt** - Expert software developer (default)
- **Code Tutor** - Patient teaching-focused assistant
- **System Architect** - High-level design and architecture expert

### 3. Utility Functions

```typescript
// Get a specific persona
getPersona(personaId: string): PersonaConfig

// Get all available personas
getAvailablePersonas(): PersonaConfig[]

// Check if persona exists
isValidPersona(personaId: string): boolean

// Generate system prompt for a persona
getSystemPrompt(cwd: string, personaId: string): string
```

## Usage

### Basic Usage

```typescript
import { getSystemPrompt, getPersona } from '~/lib/.server/llm/prompts';

// Get system prompt for a specific persona
const prompt = getSystemPrompt('/home/project', 'tutor');

// Get persona information for UI
const persona = getPersona('architect');
console.log(persona.name); // "System Architect"
```

### In API Routes

```typescript
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const personaId = String(formData.get('persona') || 'bolt');
  
  // Use persona-specific system prompt
  const systemPrompt = getSystemPrompt(WORK_DIR, personaId);
  
  // Send to AI API with the persona's system prompt
  const response = await aiAPI.chat({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ]
  });
  
  return json({ response });
}
```

### In UI Components

```typescript
import { PersonaSelector } from '~/components/chat/PersonaSelector';

function ChatInterface() {
  const [currentPersona, setCurrentPersona] = useState('bolt');
  
  return (
    <div>
      <PersonaSelector 
        currentPersona={currentPersona} 
        onPersonaChange={setCurrentPersona} 
      />
      {/* Rest of chat UI */}
    </div>
  );
}
```

## Adding Custom Personas

### 1. Extend the PERSONAS object

```typescript
// In prompts.ts or a separate file
export const PERSONAS = {
  // ...existing personas
  
  debugger: {
    id: 'debugger',
    name: 'Debug Specialist',
    description: 'Expert at finding and fixing bugs',
    systemPrompt: '',
    capabilities: ['debugging', 'error analysis', 'testing'],
    constraints: ['focus on bug fixes']
  }
};
```

### 2. Create a prompt function

```typescript
function getDebuggerSystemPrompt(cwd: string) {
  return \`
You are Debug Specialist, an expert at identifying and fixing bugs...

<debugging_approach>
  - Systematic debugging methodologies
  - Root cause analysis
  - Clear step-by-step explanations
</debugging_approach>

The current working directory is \\\`\${cwd}\\\`.
\`;
}
```

### 3. Update the switch statement

```typescript
switch (personaId) {
  case 'bolt': {
    persona.systemPrompt = getBoltSystemPrompt(cwd);
    break;
  }
  // Add your new persona
  case 'debugger': {
    persona.systemPrompt = getDebuggerSystemPrompt(cwd);
    break;
  }
  default: {
    persona.systemPrompt = getBoltSystemPrompt(cwd);
  }
}
```

## Best Practices

### 1. Persona Design
- Keep personas focused on specific use cases
- Provide clear capabilities and constraints
- Include relevant examples for better UX

### 2. System Prompts
- Maintain consistent structure across personas
- Include the WebContainer constraints for all personas
- Be specific about the persona's role and approach

### 3. UI/UX
- Show persona capabilities prominently
- Allow easy switching between personas
- Provide context about what each persona is good for

### 4. Extensibility
- Keep persona definitions in separate files for large sets
- Use TypeScript interfaces for type safety
- Consider loading personas from external configuration

## File Structure

```
app/lib/.server/llm/
├── prompts.ts                    # Core persona system
├── custom-personas.example.ts    # Custom persona examples
└── personas/                     # Optional: separate persona files
    ├── debugger.ts
    ├── reviewer.ts
    └── optimizer.ts

app/components/chat/
├── PersonaSelector.tsx           # UI component for persona selection
└── PersonaSelector.example.tsx   # Example implementation
```

## Integration Points

1. **Chat Interface** - Allow users to select personas before or during conversations
2. **API Routes** - Use persona-specific system prompts in AI requests
3. **Session Storage** - Remember user's preferred persona
4. **Admin Interface** - Allow admins to create/edit personas
5. **Context Awareness** - Auto-suggest personas based on user's project type

This system provides a solid foundation for creating specialized AI assistants while maintaining consistency and extensibility.
