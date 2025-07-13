#!/bin/bash

echo "🤖 Quick Local AI Setup for Bolt Development"
echo "============================================="
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local with mock model configuration..."
    cat > .env.local << EOF
# Development environment variables
VITE_DISABLE_AUTH=1
VITE_LOG_LEVEL=debug

# Local AI Model Configuration
VITE_DEV_MODEL_PROVIDER=mock
VITE_FORCE_LOCAL_MODEL=true
EOF
    echo "✅ .env.local created!"
else
    echo "📝 .env.local already exists"
fi

echo ""
echo "🎉 Setup complete! You can now:"
echo "1. Run 'pnpm dev' to start development"
echo "2. Test features without API keys using mock responses"
echo ""
echo "💡 To use real local AI:"
echo "1. Install Ollama: https://ollama.ai"
echo "2. Run: ollama serve && ollama pull llama3.2"
echo "3. Change VITE_DEV_MODEL_PROVIDER=ollama in .env.local"
echo ""
echo "📖 See LOCAL_AI_SETUP.md for detailed instructions"
