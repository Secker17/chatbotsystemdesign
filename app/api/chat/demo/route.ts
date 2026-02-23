import { NextRequest, NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const GREETINGS = ['hello', 'hi', 'hey', 'hei', 'hallo', 'good morning', 'good afternoon']
const HELP_WORDS = ['help', 'support', 'assist', 'question']
const PRICE_WORDS = ['pricing', 'cost', 'price', 'plan', 'subscribe', 'payment', 'pay']
const FEATURE_WORDS = ['feature', 'what can', 'what do', 'capability', 'offer', 'functionality']
const AVATAR_WORDS = ['avatar', 'glass orb', 'orb', 'animation', 'particle']
const DEMO_WORDS = ['demo', 'test', 'try', 'example']
const INTEGRATE_WORDS = ['integrate', 'install', 'setup', 'embed', 'script', 'widget', 'code']
const AI_WORDS = ['ai', 'artificial', 'intelligent', 'smart', 'machine learning', 'gpt']
const THANKS_WORDS = ['thank', 'thanks', 'appreciate', 'great', 'awesome', 'perfect']

function matchesAny(message: string, words: string[]): boolean {
  return words.some(w => message.includes(w))
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    const lower = message.toLowerCase().trim()

    let response: string

    if (matchesAny(lower, GREETINGS)) {
      const greetings = [
        'Hello! Welcome to VintraStudio. How can I help you today?',
        'Hey there! Great to have you here. What would you like to know about our chatbot platform?',
        'Hi! I\'m the Vintra assistant. Ask me anything about features, pricing, or integration.',
      ]
      response = greetings[Math.floor(Math.random() * greetings.length)]
    } else if (matchesAny(lower, THANKS_WORDS)) {
      response = 'You\'re welcome! Let me know if there\'s anything else I can help with.'
    } else if (matchesAny(lower, PRICE_WORDS)) {
      response = 'We offer three plans:\n\n- **Starter** (Free) - 1 chatbot, 100 conversations/month\n- **Pro** ($29/mo) - 5 chatbots, 2,000 conversations, analytics\n- **Business** ($99/mo) - Unlimited chatbots, 10,000 conversations, API access\n\nAll plans include AI-powered responses and our Glass Orb Avatar technology.'
    } else if (matchesAny(lower, FEATURE_WORDS)) {
      response = 'VintraStudio includes:\n\n- Real-time chat with typing indicators\n- AI-powered responses\n- Glass Orb animated avatars\n- Quick reply suggestions\n- Message reactions\n- Full brand customization\n- Analytics dashboard\n- One-line integration script\n\nWant to know more about any specific feature?'
    } else if (matchesAny(lower, AVATAR_WORDS)) {
      response = 'Our Glass Orb Avatar is a unique animated component built with canvas particle physics. It changes colors based on state (idle, typing, responding), responds to mouse interactions, and supports multiple themes including a festive Christmas skin. Click on the chat button orb to see it in action!'
    } else if (matchesAny(lower, DEMO_WORDS)) {
      response = 'You\'re using the demo right now! Try these things:\n\n- Send messages to see the animated typing indicator\n- Hover over bot messages to see reaction buttons\n- Click the quick reply chips for preset questions\n- Notice the smooth open/close animations\n\nVisit our Demo page for the full avatar showcase.'
    } else if (matchesAny(lower, INTEGRATE_WORDS)) {
      response = 'Integration is incredibly simple. Just add one script tag to your HTML:\n\n```html\n<script src="YOUR_DOMAIN/api/widget.js" data-chatbot-id="YOUR_ID" async></script>\n```\n\nIt works with any website, framework, or CMS. The script is under 30KB gzipped and loads asynchronously so it won\'t slow your site down.'
    } else if (matchesAny(lower, AI_WORDS)) {
      response = 'Our AI system provides intelligent, context-aware responses to your customers. It can handle common questions, provide product information, and escalate to human agents when needed. All plans include AI capabilities, with more advanced models available on higher tiers.'
    } else if (matchesAny(lower, HELP_WORDS)) {
      response = 'I\'m here to help! Here\'s what I can tell you about:\n\n- Features and capabilities\n- Pricing and plans\n- Integration and setup\n- Glass Orb avatars\n- AI assistant features\n\nJust ask about any of these topics!'
    } else {
      const fallbacks = [
        `Thanks for your message! I can help you with questions about our features, pricing, integration, or the Glass Orb avatar system. What interests you?`,
        `I'd love to help you learn more about VintraStudio. Try asking about our pricing plans, features, or how to integrate the widget into your site.`,
        `Great question! While this is a demo with preset responses, the real VintraStudio chatbot uses AI to provide detailed, context-aware answers. Want to hear about our features or pricing?`,
      ]
      response = fallbacks[Math.floor(Math.random() * fallbacks.length)]
    }

    // Add a slight delay to simulate realistic response time
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 800))

    return NextResponse.json({ 
      response,
      timestamp: new Date().toISOString()
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Chat demo API error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}
