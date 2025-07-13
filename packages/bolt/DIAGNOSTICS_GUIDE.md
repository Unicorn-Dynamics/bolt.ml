# 🧪 System Diagnostics Feature

The diagnostics feature has been successfully integrated into Bolt.ml! You can now test all aspects of your local development environment with a comprehensive health check system.

## 🚀 How to Access

1. **Header Button**: Look for the activity icon (📊) in the top right header next to the StackBlitz button
2. **Click to Open**: This opens the System Diagnostics modal

## 🔬 Available Tests

The diagnostics system includes 8 comprehensive test categories:

### Core System Tests
- **Authentication**: Verifies auth bypass and development mode
- **Environment Variables**: Checks .env.local configuration  
- **API Key Configuration**: Tests external provider setup

### AI System Tests
- **AI Personas**: Validates persona system and prompt generation
- **Model Selection**: Tests AI model auto-detection logic
- **Mock Model**: Ensures development mode AI responses work
- **Ollama Integration**: Checks local Ollama server availability

### Development Tools
- **WebContainer**: Tests container initialization and functionality

## 🎯 How to Use

### Run All Tests
- Click **"🧪 Run All Tests"** for complete system health check
- Best for initial setup verification

### Run Selected Tests  
1. Check individual tests you want to run
2. Click **"🧪 Run Selected Tests"**
3. Perfect for focused debugging

### Test Results
- **✅ Green**: Test passed successfully
- **❌ Red**: Test failed - needs attention
- **⚠️ Yellow**: Warning - might need configuration
- **🔄 Blue**: Test currently running

## 💡 Recommended Testing Flow

1. **First Time Setup**: Run all tests to establish baseline
2. **Environment Issues**: Run Environment test first  
3. **AI Problems**: Focus on Mock Model, Ollama, and Model Selection
4. **Development Issues**: Check Authentication and WebContainer

## 🔧 Common Results

### Expected for Development
- ✅ Authentication (VITE_DISABLE_AUTH=1)
- ✅ Environment Variables 
- ✅ Mock Model
- ✅ AI Personas

### May Show Warnings
- ⚠️ Ollama Integration (normal if not installed)
- ⚠️ API Key Configuration (normal in dev mode)

## 🛠️ Troubleshooting

### If Tests Fail
1. Check the detailed error message in expanded test results
2. Verify your `.env.local` file configuration
3. Ensure required dependencies are installed
4. Check if services like Ollama are running (if you're using them)

### Environment Setup
Make sure your `.env.local` includes:
```
VITE_DISABLE_AUTH=1
VITE_DEV_MODEL_PROVIDER=auto
VITE_FORCE_LOCAL_MODEL=true
OLLAMA_MODEL=qwen2.5:3b
```

## ✨ What This Enables

With the diagnostics system, you now have:
- **Self-service debugging** - identify issues yourself
- **Environment validation** - ensure proper setup
- **Feature verification** - confirm everything works
- **Development confidence** - know your setup is correct

The diagnostics feature completes your local development ecosystem! 🎉
