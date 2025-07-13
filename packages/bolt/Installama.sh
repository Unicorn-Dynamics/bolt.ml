# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start and pull a fast model
ollama serve
ollama pull qwen2.5:3b  # Very fast
# or
ollama pull llama3.2    # Good balance

# Update .env.local:
# VITE_DEV_MODEL_PROVIDER=ollama