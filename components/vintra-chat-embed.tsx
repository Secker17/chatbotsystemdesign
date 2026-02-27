'use client'

/**
 * Vintra Chat Embed Component
 * 
 * Drop this directly into your project components folder, or use the page template instead.
 */

import { useEffect, useState } from 'react'

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

interface VintraChatEmbedProps {
  chatbotId: string
  apiEndpoint?: string
}

export default function VintraChatEmbed({
  chatbotId,
  apiEndpoint = 'https://chat.vintrastudio.com',
}: VintraChatEmbedProps) {
  const [config, setConfig] = useState<ChatConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<Map<string, string[]>>(new Map())
  const [currentSession, setCurrentSession] = useState<string>('')
  const [messages, setMessages] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  // Fetch config on mount
  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch(`${apiEndpoint}/api/chat/config?chatbot_id=${chatbotId}`)
        if (res.ok) {
          const data = await res.json()
          setConfig(data)
          // Create or restore session
          const sessionId = localStorage.getItem(`vintra_session_${chatbotId}`) || `session_${Date.now()}`
          setCurrentSession(sessionId)
          localStorage.setItem(`vintra_session_${chatbotId}`, sessionId)
        }
      } catch (e) {
        console.error('[Vintra] Failed to load config:', e)
      } finally {
        setLoading(false)
      }
    }
    if (chatbotId) fetchConfig()
  }, [chatbotId, apiEndpoint])

  // Fetch messages for current session
  useEffect(() => {
    if (!currentSession) return
    async function fetchMessages() {
      try {
        const res = await fetch(
          `${apiEndpoint}/api/chat/messages?session_id=${currentSession}`,
          { headers: { 'Content-Type': 'application/json' } }
        )
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages || [])
        }
      } catch (e) {
        console.error('[Vintra] Failed to load messages:', e)
      }
    }
    if (isOpen) fetchMessages()
  }, [currentSession, isOpen, apiEndpoint])

  const handleSendMessage = async () => {
    if (!input.trim() || !currentSession || !config) return
    setSending(true)
    try {
      const res = await fetch(`${apiEndpoint}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSession,
          chatbot_id: chatbotId,
          message: input,
          visitor_email: 'visitor@example.com',
        }),
      })
      if (res.ok) {
        setInput('')
        const data = await res.json()
        setMessages(prev => [...prev, data.message])
      }
    } catch (e) {
      console.error('[Vintra] Failed to send message:', e)
    } finally {
      setSending(false)
    }
  }

  if (loading) return null

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">Failed to load chat</p>
          <p className="text-xs text-muted-foreground">Check your chatbot ID and API endpoint</p>
        </div>
      </div>
    )
  }

  // Full page view when opened
  if (isOpen) {
    return (
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <div
          className="p-4 text-white flex items-center justify-between"
          style={{ backgroundColor: config.primary_color }}
        >
          <div>
            <h2 className="font-semibold">{config.widget_title}</h2>
            <p className="text-xs opacity-80">Online</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="font-semibold">{config.widget_title}</p>
              <p className="text-sm mt-1">{config.welcome_message}</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick replies */}
        {messages.length === 0 && config.quick_replies?.length > 0 && (
          <div className="px-4 py-3 border-t space-y-2">
            {config.quick_replies.map((reply, i) => (
              <button
                key={i}
                onClick={() => {
                  setInput(reply)
                  setTimeout(() => handleSendMessage(), 0)
                }}
                className="w-full text-left px-3 py-2 rounded border text-sm hover:bg-muted transition"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            placeholder={config.placeholder_text}
            className="flex-1 px-3 py-2 border rounded-lg text-sm outline-none"
          />
          <button
            onClick={handleSendMessage}
            disabled={sending || !input.trim()}
            className="px-4 py-2 rounded-lg text-white text-sm disabled:opacity-50 transition"
            style={{ backgroundColor: config.primary_color }}
          >
            Send
          </button>
        </div>

        {config.show_branding && (
          <div className="text-center py-2 border-t text-xs text-muted-foreground">
            Powered by Vintra
          </div>
        )}
      </div>
    )
  }

  // Closed state - show nothing by default
  return null
}
