import { NextRequest, NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function POST(request: NextRequest) {
  try {
    const { message, chatbotId } = await request.json()

    // Simple demo response logic
    let response = 'Thanks for your message! '
    
    if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
      response = 'Hello! How can I help you today? 😊'
    } else if (message.toLowerCase().includes('help')) {
      response = 'I\'m here to help! You can ask me questions about our chatbot platform, features, or pricing.'
    } else if (message.toLowerCase().includes('pricing') || message.toLowerCase().includes('cost')) {
      response = 'We offer three plans: Free (forever free), Pro ($29/month), and Enterprise (custom pricing). All plans include our Glass Orb Avatar technology! 🎨'
    } else if (message.toLowerCase().includes('avatar') || message.toLowerCase().includes('glass orb')) {
      response = 'Our Glass Orb Avatar is a unique animated avatar system with particle physics, multiple themes (including Christmas!), and interactive effects. Click on it to see the particles react!'
    } else if (message.toLowerCase().includes('demo') || message.toLowerCase().includes('test')) {
      response = 'You\'re already using the demo! Try clicking on the Glass Orb Avatar to see particle effects, or test the Christmas theme for festive animations! 🎄'
    } else if (message.toLowerCase().includes('christmas') || message.toLowerCase().includes('holiday')) {
      response = '🎄 Merry Christmas! Our Christmas skin features an animated tree, twinkling star, falling snow, and festive colors. Switch to it in the demo to see the magic!'
    } else {
      response = `I received your message: "${message}". This is a demo response. In a real implementation, I would connect to an AI service to provide more intelligent responses. Try asking about our features, pricing, or Glass Orb avatars!`
    }

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
