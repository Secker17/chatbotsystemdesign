'use client'

/**
 * Vintra Chat Widget Component
 * 
 * This is an exported version of your Vintra chatbot that you can embed on your own website.
 * 
 * Installation:
 * 1. Copy this file to your project's components folder
 * 2. Import it in your layout or page: import VintraChatWidget from '@/components/vintra-chat-widget'
 * 3. Add it to your JSX: <VintraChatWidget />
 * 
 * Configuration:
 * All settings (colors, messages, position, etc.) are automatically pulled from your Vintra admin panel.
 * To change them, visit your Vintra dashboard and modify the appearance settings.
 * 
 * Your Chatbot ID: {CHATBOT_ID_PLACEHOLDER}
 */

import { useEffect, useState } from 'react'
import ChatInterface from '@/components/chat-interface'

interface ChatConfig {
  id: string
  widget_title: string
  welcome_message: string
  primary_color: string
  position: 'bottom-right' | 'bottom-left'
  avatar_url: string | null
  show_branding: boolean
  placeholder_text: string
  offline_message: string
  ai_enabled: boolean
  greeting_message: string | null
  greeting_subtext: string
  greeting_enabled: boolean
  launcher_text: string | null
  launcher_text_enabled: boolean
  quick_replies: string[]
  business_hours_enabled: boolean
  business_hours: string | null
  business_hours_timezone: string
  outside_hours_message: string
}

// Helper to extract avatar style from avatar_url
function getAvatarStyle(avatarUrl: string | null): 'glass-orb' | 'default' {
  if (avatarUrl?.startsWith('icon:')) {
    const style = avatarUrl.replace('icon:', '')
    if (style === 'glass-orb') return 'glass-orb'
  }
  return 'default'
}

interface VintraChatWidgetProps {
  /**
   * Your Vintra chatbot ID
   * Get this from your Vintra dashboard
   */
  chatbotId: string
  
  /**
   * API endpoint for fetching config
   * Default: https://chat.vintrastudio.com (change to your domain)
   */
  apiEndpoint?: string
}

export default function VintraChatWidget({
  chatbotId,
  apiEndpoint = 'https://chat.vintrastudio.com',
}: VintraChatWidgetProps) {
  const [config, setConfig] = useState<ChatConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await fetch(
          `${apiEndpoint}/api/chat/config?chatbot_id=${chatbotId}`
        )
        
        if (!response.ok) {
          throw new Error(`Failed to fetch config: ${response.status}`)
        }
        
        const data: ChatConfig = await response.json()
        setConfig(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error('[Vintra] Failed to load chat config:', message)
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    if (chatbotId) {
      fetchConfig()
    } else {
      setError('No chatbot ID provided')
      setLoading(false)
    }
  }, [chatbotId, apiEndpoint])

  // Don't render if loading or if there's an error
  if (loading) {
    return null // Silent loading - no UI shown
  }

  if (error || !config) {
    console.warn('[Vintra] Chat widget failed to load. Check your chatbot ID and API endpoint.')
    return null // Silent failure - no UI shown
  }

  return (
    <ChatInterface
      chatbotId={chatbotId}
      primaryColor={config.primary_color}
      avatarStyle={getAvatarStyle(config.avatar_url)}
      position={config.position}
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      widgetTitle={config.widget_title}
      welcomeMessage={config.welcome_message}
      placeholderText={config.placeholder_text}
      showBranding={config.show_branding}
      quickReplies={config.quick_replies}
      greetingMessage={config.greeting_message || undefined}
      greetingSubtext={config.greeting_subtext}
      greetingEnabled={config.greeting_enabled}
    />
  )
}
