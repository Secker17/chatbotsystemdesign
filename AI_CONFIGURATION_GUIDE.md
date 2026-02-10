# AI Service Configuration Guide - xAI

## Problem
The AI service is returning a 500 error because the Vercel AI Gateway is not properly configured with xAI API keys.

## Solution Options

### Option 1: Configure Vercel AI Gateway with xAI (Recommended)
1. Go to your Vercel dashboard
2. Navigate to your project
3. Go to Settings → Environment Variables
4. Add the following environment variable:

```
XAI_API_KEY=your_xai_api_key_here
```

### Option 2: Use Direct xAI Configuration
If you're not using Vercel, create a `.env.local` file in your project root with:

```
# xAI Configuration
XAI_API_KEY=your_xai_api_key_here
```

### Option 3: Get xAI API Key
1. **xAI API Key**: Go to https://console.x.ai/
2. Sign up/login to xAI
3. Go to API Keys section
4. Create a new API key
5. Copy the key

## Quick Fix for Testing
If you want to test the AI functionality quickly:
1. Sign up at https://console.x.ai/
2. Go to API Keys section
3. Create a new API key
4. Add it to your environment variables

## Environment Variables Setup

### For Vercel Deployment:
1. Go to Project Settings → Environment Variables
2. Add: `XAI_API_KEY` with your xAI API key
3. Redeploy your application

### For Local Development:
Create a `.env.local` file:
```
XAI_API_KEY=your-xai-key-here
```

## Verification
After setting up the API key:
1. Restart your development server
2. Try the AI test feature again
3. The error should be resolved

## Current AI Models Available (xAI)
- **grok-beta** (recommended for general use)
- **grok-2-1212** (latest model)
- **grok-2-image** (for image processing)

The system will automatically fallback between xAI models if one fails.

## Model Mapping
The system maps old model names to xAI models:
- `gpt-4o-mini` → `xai/grok-beta`
- `gpt-4o` → `xai/grok-2-1212`

## Testing
Use these endpoints to test:
- Debug: `http://localhost:3000/api/chat/ai/debug`
- Test: `http://localhost:3000/api/chat/ai/test`

## Benefits of xAI
- Cost-effective compared to OpenAI
- Fast response times
- Good understanding of Norwegian and other languages
- No strict content moderation
