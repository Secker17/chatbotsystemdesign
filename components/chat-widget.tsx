'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ChatWidgetConfig {
  id: string
  widget_title: string
  welcome_message: string
  primary_color: string
  position: string
  avatar_url: string | null
  avatar_glyph: string | null
  show_branding: boolean
  offline_message: string
  placeholder_text: string
  launcher_text: string | null
  launcher_text_enabled: boolean
  business_hours_enabled: boolean
  business_hours: any | null
  business_hours_timezone: string | null
  outside_hours_message: string | null
  greeting_message: string | null
  greeting_subtext: string | null
  greeting_enabled: boolean
  quick_replies: string[] | null
}

export interface ChatWidgetProps {
  chatbotId?: string
  userId?: string
  workspaceId?: string
  className?: string
  style?: React.CSSProperties
  onConfigLoaded?: (config: ChatWidgetConfig) => void
  onMessageSent?: (message: string, response: string) => void
}

export default function ChatWidget({
  chatbotId,
  userId,
  workspaceId,
  className,
  style,
  onConfigLoaded,
  onMessageSent
}: ChatWidgetProps) {
  const [config, setConfig] = useState<ChatWidgetConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const widgetRef = useRef<HTMLDivElement>(null)
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  // Load configuration
  useEffect(() => {
    async function loadConfig() {
      if (!chatbotId) {
        setError('Chatbot ID is required')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/widget/config?chatbotId=${chatbotId}`)
        if (!response.ok) {
          throw new Error('Failed to load chatbot configuration')
        }
        
        const data = await response.json()
        setConfig(data.config)
        onConfigLoaded?.(data.config)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [chatbotId, onConfigLoaded])

  // Initialize widget
  useEffect(() => {
    if (!config || !widgetRef.current) return

    // Clean up previous widget
    if (scriptRef.current) {
      scriptRef.current.remove()
      scriptRef.current = null
    }

    // Create widget container
    const container = widgetRef.current
    container.innerHTML = ''

    // Create script element
    const script = document.createElement('script')
    script.src = '/api/widget'
    script.setAttribute('data-chatbot-id', chatbotId || '')
    if (userId) {
      script.setAttribute('data-user-id', userId)
    }
    script.async = true
    scriptRef.current = script

    // Inject configuration
    const configScript = document.createElement('script')
    configScript.type = 'application/json'
    configScript.setAttribute('data-widget-config', 'true')
    configScript.textContent = JSON.stringify({
      chatbotId,
      userId,
      config,
      workspaceId
    })

    container.appendChild(configScript)
    container.appendChild(script)

    return () => {
      if (scriptRef.current) {
        scriptRef.current.remove()
        scriptRef.current = null
      }
    }
  }, [config, chatbotId, userId, workspaceId])

  // Handle messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'vintra-widget-message') {
        const { message, response } = event.data
        onMessageSent?.(message, response)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onMessageSent])

  if (loading) {
    return (
      <div ref={widgetRef} className={className} style={style}>
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div ref={widgetRef} className={className} style={style}>
        <div className="flex items-center justify-center p-4 text-red-500">
          <span>Error: {error}</span>
        </div>
      </div>
    )
  }

  return (
    <div ref={widgetRef} className={className} style={style}>
      {/* Widget will be rendered here */}
    </div>
  )
}

// Export for easy usage
export function ChatWidgetWithConfig(chatbotId: string, userId?: string) {
  return function WidgetComponent(props: Omit<ChatWidgetProps, 'chatbotId' | 'userId'>) {
    return <ChatWidget {...props} chatbotId={chatbotId} userId={userId} />
  }
}

// Usage example for documentation
export function ExampleUsage() {
  return (
    <div>
      {/* Basic usage */}
      <ChatWidget chatbotId="your-chatbot-id" />
      
      {/* With user identification */}
      <ChatWidget 
        chatbotId="your-chatbot-id" 
        userId="user@example.com"
        onMessageSent={(msg, resp) => console.log('Message:', msg, 'Response:', resp)}
      />
      
      {/* Custom styling */}
      <ChatWidget 
        chatbotId="your-chatbot-id"
        className="custom-widget"
        style={{ position: 'fixed', bottom: 20, right: 20 }}
      />
    </div>
  )
}
