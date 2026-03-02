'use client'

import { useState, useEffect } from 'react'
import ChatInterface from '@/components/chat-interface'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DemoConfig {
  enabled: boolean
  chatbotId?: string
  widgetTitle?: string
  welcomeMessage?: string
  primaryColor?: string
  position?: string
  showBranding?: boolean
  placeholderText?: string
  quickReplies?: string[]
  greetingMessage?: string
  greetingSubtext?: string
}

export default function ChatDemoPage() {
  const [demoConfig, setDemoConfig] = useState<DemoConfig | null>(null)

  useEffect(() => {
    fetch('/api/chat/demo-config')
      .then(r => r.json())
      .then(data => setDemoConfig(data))
      .catch(() => setDemoConfig({ enabled: false }))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Chat Demo
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Try out the chat interface and see how it works. Click the chat button in the bottom-right corner to get started.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Live Chat Interface</CardTitle>
            <CardDescription>
              Full chat interface demonstration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Click the chat button in the bottom-right to open the chat</p>
                <p>Try sending a message to see the AI respond</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>What makes the chat interface special</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Real-time Chat</h4>
                <p className="text-sm text-muted-foreground">
                  Instant messaging with typing indicators
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">AI-Powered</h4>
                <p className="text-sm text-muted-foreground">
                  Smart responses powered by AI
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Customizable</h4>
                <p className="text-sm text-muted-foreground">
                  Custom colors and branding options
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Quick Replies</h4>
                <p className="text-sm text-muted-foreground">
                  Pre-built suggestion chips for faster interaction
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Message Reactions</h4>
                <p className="text-sm text-muted-foreground">
                  Thumbs up/down feedback on responses
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Responsive</h4>
                <p className="text-sm text-muted-foreground">
                  Works great on all devices
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ChatInterface
        chatbotId={demoConfig?.chatbotId || 'demo-chatbot'}
        primaryColor={demoConfig?.primaryColor || '#3b82f6'}
        position={(demoConfig?.position as 'bottom-right' | 'bottom-left') || 'bottom-right'}
        widgetTitle={demoConfig?.widgetTitle}
        welcomeMessage={demoConfig?.welcomeMessage}
        placeholderText={demoConfig?.placeholderText}
        showBranding={demoConfig?.showBranding}
        quickReplies={demoConfig?.quickReplies}
        greetingMessage={demoConfig?.greetingMessage}
        greetingSubtext={demoConfig?.greetingSubtext}
      />
    </div>
  )
}
