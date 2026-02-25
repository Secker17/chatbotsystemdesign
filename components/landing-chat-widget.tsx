'use client'

import { useEffect, useState } from 'react'
import ChatInterface from '@/components/chat-interface'

interface LandingConfig {
  enabled: boolean
  chatbot_id: string | null
  config: {
    widget_title: string
    welcome_message: string
    primary_color: string
    position: string
    avatar_url: string | null
    show_branding: boolean
    placeholder_text: string
    ai_enabled: boolean
    quick_replies: string[]
    greeting_message: string
    greeting_subtext: string
  } | null
}

export function LandingChatWidget() {
  const [landingConfig, setLandingConfig] = useState<LandingConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch('/api/chat/landing-config')
        if (res.ok) {
          const data: LandingConfig = await res.json()
          setLandingConfig(data)
        }
      } catch (err) {
        console.error('Failed to fetch landing config:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [])

  // Don't render anything while loading or if widget is disabled
  if (loading) return null
  if (!landingConfig?.enabled || !landingConfig.config) {
    // Fallback to demo mode if no config is set up yet
    return (
      <ChatInterface
        chatbotId="demo-chatbot"
        primaryColor="hsl(45, 100%, 60%)"
        avatarStyle="glass-orb"
        position="bottom-right"
      />
    )
  }

  const cfg = landingConfig.config

  return (
    <ChatInterface
      chatbotId={landingConfig.chatbot_id || 'demo-chatbot'}
      primaryColor={cfg.primary_color}
      avatarStyle="glass-orb"
      position={cfg.position as 'bottom-right' | 'bottom-left'}
      widgetTitle={cfg.widget_title}
      welcomeMessage={cfg.welcome_message}
      placeholderText={cfg.placeholder_text}
      showBranding={cfg.show_branding}
      quickReplies={cfg.quick_replies}
      greetingMessage={cfg.greeting_message}
      greetingSubtext={cfg.greeting_subtext}
    />
  )
}
