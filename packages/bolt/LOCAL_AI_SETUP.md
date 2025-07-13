# Local AI Development Setup

This guide shows you how to test Bolt features locally without API keys using either mock models or real local AI models.

## Quick Start (Mock Model - Fastest)

1. **Already configured!** Your `.env.local` is set to use mock models by default.

2. **Start development:**
   ```bash
   pnpm dev
   ```

3. **That's it!** The app will use mock responses that simulate real AI behavior.

## Option 2: Real Local AI with Ollama

For more realistic testing with actual AI models:

### 1. Install Ollama
```bash
# macOS/Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Or visit https://ollama.ai for other platforms
```

### 2. Start Ollama and pull a model
```bash
# Start the Ollama server
ollama serve

# In another terminal, pull a fast model
ollama pull llama3.2  # or qwen2.5:3b for even faster responses
```

### 3. Update your configuration
In `.env.local`, change:
```bash
VITE_DEV_MODEL_PROVIDER=ollama
OLLAMA_MODEL=llama3.2
```

### 4. Restart development server
```bash
pnpm dev
```

## Configuration Options

| Provider | Speed | Setup | Quality | Use Case |
|----------|-------|-------|---------|----------|
| `mock` | ⚡ Instant | ✅ None | 🎭 Fake | UI/UX testing |
| `ollama` | 🐌 2-10s | 📦 Install | 🤖 Real AI | Feature testing |

## Environment Variables

```bash
# Model provider selection
VITE_DEV_MODEL_PROVIDER=auto  # auto, mock, ollama

# Force local models (ignore API keys)
VITE_FORCE_LOCAL_MODEL=true

# Ollama settings
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Disable authentication
VITE_DISABLE_AUTH=1
```

## Switching Between Models

You can easily switch between different setups:

### For Quick UI Testing:
```bash
VITE_DEV_MODEL_PROVIDER=mock
```

### For Feature Testing:
```bash
VITE_DEV_MODEL_PROVIDER=ollama
```

### Auto-detect (tries Ollama, falls back to mock):
```bash
VITE_DEV_MODEL_PROVIDER=auto
```

## Model Recommendations

### Fast Models (for development):
- `qwen2.5:3b` - Very fast, good quality
- `llama3.2:3b` - Fast, reliable
- `phi3.5` - Tiny but capable

### Quality Models (for testing):
- `llama3.2` - Best balance
- `qwen2.5:7b` - High quality
- `mistral-nemo` - Code-focused

### Install models:
```bash
ollama pull qwen2.5:3b  # Fast option
ollama pull llama3.2     # Default option
```

## How It Works

1. **Development Detection**: The system automatically detects if you're in development mode
2. **Model Auto-selection**: Based on `VITE_DEV_MODEL_PROVIDER`, it picks the right model
3. **Fallback Chain**: If Ollama fails, it falls back to mock models
4. **Same Interface**: All models use the same interface, so your code doesn't change

## Troubleshooting

### Ollama not working?
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not, start it
ollama serve
```

### Slow responses?
- Try a smaller model: `ollama pull qwen2.5:3b`
- Or switch to mock: `VITE_DEV_MODEL_PROVIDER=mock`

### Want to test with real API?
- Set `VITE_FORCE_LOCAL_MODEL=false`
- Add your `ANTHROPIC_API_KEY` to `.env.local`

## Benefits

✅ **No API costs** during development  
✅ **Work offline** - no internet required  
✅ **Fast iteration** - mock responses are instant  
✅ **Real testing** - Ollama provides actual AI responses  
✅ **Privacy** - all data stays local  
✅ **Easy switching** - change one environment variable  

This setup lets you develop and test all Bolt features without spending money on API calls!
