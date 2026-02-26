'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  X, 
  Minus,
  MessageSquare,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  ChevronDown,
} from 'lucide-react'
import GlassOrbAvatar from './glass-orb-avatar'

interface Message {
  id: string
  content: string
  sender: 'user' | 'bot'
  timestamp: Date
  reaction?: 'up' | 'down' | null
}

interface ChatInterfaceProps {
  chatbotId?: string
  primaryColor?: string
  avatarStyle?: 'default' | 'glass-orb' | 'juleskin'
  avatarGlyph?: string
  position?: 'bottom-right' | 'bottom-left'
  isOpen?: boolean
  onToggle?: () => void
  // Configurable from admin panel
  widgetTitle?: string
  welcomeMessage?: string
  placeholderText?: string
  showBranding?: boolean
  quickReplies?: string[]
  greetingMessage?: string
  greetingSubtext?: string
  greetingEnabled?: boolean
}

const DEFAULT_QUICK_REPLIES = [
  'What features do you offer?',
  'Tell me about pricing',
  'How does the AI work?',
  'Can I see a demo?',
]

export default function ChatInterface({
  chatbotId,
  primaryColor = '#3b82f6',
  avatarStyle = 'glass-orb',
  avatarGlyph = 'A',
  position = 'bottom-right',
  isOpen: controlledIsOpen,
  onToggle,
  widgetTitle = 'Chat Support',
  welcomeMessage = 'Ask me anything about our platform, features, or pricing.',
  placeholderText = 'Type your message...',
  showBranding = true,
  quickReplies,
  greetingMessage = 'Hi there!',
  greetingSubtext = 'How can I help you today?',
  greetingEnabled = true,
}: ChatInterfaceProps) {
  const activeQuickReplies = quickReplies && quickReplies.length > 0 ? quickReplies : DEFAULT_QUICK_REPLIES
  const isLiveMode = !!chatbotId && chatbotId !== 'demo-chatbot'

  const [isInternalOpen, setIsInternalOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isBotTyping, setIsBotTyping] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)
  const [showScrollDown, setShowScrollDown] = useState(false)
  const [isAnimatingOpen, setIsAnimatingOpen] = useState(false)
  const [isAnimatingClose, setIsAnimatingClose] = useState(false)
  const [showGreeting, setShowGreeting] = useState(false)
  const [greetingDismissed, setGreetingDismissed] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [lastMessageCount, setLastMessageCount] = useState(0)
  const [demoConversationId] = useState(() => `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionCreatingRef = useRef(false)

  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : isInternalOpen

  const positionClasses = {
    'bottom-right': 'bottom-2 right-2 sm:bottom-6 sm:right-6',
    'bottom-left': 'bottom-2 left-2 sm:bottom-6 sm:left-6',
  }

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Show greeting bubble after a delay
  useEffect(() => {
    if (greetingEnabled && !isOpen && !greetingDismissed && messages.length === 0) {
      const timer = setTimeout(() => setShowGreeting(true), 2000)
      return () => clearTimeout(timer)
    }
    if (isOpen || !greetingEnabled) {
      setShowGreeting(false)
    }
  }, [isOpen, greetingDismissed, messages.length, greetingEnabled])

  // Check scroll position for scroll-down button
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100)
    }
    
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Create a live session when the chat opens for the first time in live mode
  const ensureLiveSession = useCallback(async () => {
    if (!isLiveMode || sessionId || sessionCreatingRef.current) return null
    sessionCreatingRef.current = true
    try {
      const res = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatbot_id: chatbotId }),
      })
      if (res.ok) {
        const data = await res.json()
        setSessionId(data.session_id)
        return data.session_id
      }
    } catch (err) {
      console.error('Failed to create session:', err)
    } finally {
      sessionCreatingRef.current = false
    }
    return null
  }, [isLiveMode, sessionId, chatbotId])

  // Poll for new messages from admin/bot in live mode
  useEffect(() => {
    if (!isLiveMode || !sessionId) return

    const poll = async () => {
      try {
        const res = await fetch(`/api/chat/messages?session_id=${sessionId}&after=${lastMessageCount}`)
        if (res.ok) {
          const data = await res.json()
          if (data.messages && data.messages.length > 0) {
            const newMsgs: Message[] = data.messages
              .filter((m: { sender_type: string }) => m.sender_type === 'admin' || m.sender_type === 'bot')
              .map((m: { id: string; content: string; sender_type: string; created_at: string }) => ({
                id: m.id,
                content: m.content,
                sender: 'bot' as const,
                timestamp: new Date(m.created_at),
                reaction: null,
              }))
            
            if (newMsgs.length > 0) {
              setMessages(prev => {
                const existingIds = new Set(prev.map(p => p.id))
                // Also track content of AI messages shown immediately (they have temp IDs like "ai-...")
                const existingAiContent = new Set(
                  prev.filter(p => p.id.startsWith('ai-') && p.sender === 'bot').map(p => p.content)
                )
                const truly = newMsgs.filter(m => {
                  if (existingIds.has(m.id)) return false
                  // Skip if this content was already shown from an immediate AI response
                  if (m.sender === 'bot' && existingAiContent.has(m.content)) {
                    // Replace the temp AI message with the real DB message
                    return false
                  }
                  return true
                })
                // Replace temp AI messages with real DB messages (to get correct IDs)
                const updatedPrev = prev.map(p => {
                  if (p.id.startsWith('ai-') && p.sender === 'bot') {
                    const realMsg = newMsgs.find(m => m.content === p.content && m.sender === 'bot')
                    if (realMsg) return { ...p, id: realMsg.id }
                  }
                  return p
                })
                if (truly.length === 0) {
                  // Still update IDs even if no new messages
                  const idsChanged = updatedPrev.some((p, i) => p.id !== prev[i].id)
                  return idsChanged ? updatedPrev : prev
                }
                return [...updatedPrev, ...truly]
              })
              if (!isOpen) {
                setUnreadCount(prev => prev + newMsgs.length)
              }
            }
            setLastMessageCount(data.total)
          }
        }
      } catch {
        // silent
      }
    }

    pollRef.current = setInterval(poll, 2500)
    poll() // initial fetch

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [isLiveMode, sessionId, lastMessageCount, isOpen])

  const handleToggle = () => {
    if (isOpen) {
      // Close animation
      setIsAnimatingClose(true)
      setTimeout(() => {
        if (isControlled && onToggle) {
          onToggle()
        } else {
          setIsInternalOpen(false)
        }
        setIsAnimatingClose(false)
      }, 250)
    } else {
      // Open animation
      if (isControlled && onToggle) {
        onToggle()
      } else {
        setIsInternalOpen(true)
      }
      setIsAnimatingOpen(true)
      setUnreadCount(0)
      setShowGreeting(false)
      setGreetingDismissed(true)
      setTimeout(() => {
        setIsAnimatingOpen(false)
        inputRef.current?.focus()
      }, 350)
    }
  }

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim()
    if (!text || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: text,
      sender: 'user',
      timestamp: new Date(),
      reaction: null,
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)
    setIsBotTyping(true)

    try {
      if (isLiveMode) {
        // --- LIVE MODE: real DB session ---
        let sid = sessionId
        if (!sid) {
          sid = await ensureLiveSession()
        }
        if (!sid) throw new Error('Could not create session')

        // Send visitor message to DB
        const res = await fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sid,
            content: text,
            sender_type: 'visitor',
          }),
        })

        if (!res.ok) throw new Error('Failed to send message')

        // Request AI auto-reply via the correct endpoint
        try {
          const aiRes = await fetch('/api/chat/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sid, content: text }),
          })

          if (aiRes.ok) {
            const aiData = await aiRes.json()
            // If the AI returned a reply, show it immediately instead of waiting for polling
            if (aiData.reply) {
              const botMessage: Message = {
                id: `ai-${Date.now()}`,
                content: aiData.reply,
                sender: 'bot',
                timestamp: new Date(),
                reaction: null,
              }
              setMessages(prev => [...prev, botMessage])
            }
          }
          // If AI call fails or bot is not active, admin will reply manually via polling
        } catch {
          // AI endpoint failed - admin replies manually
        }
      } else {
        // --- DEMO MODE: use AI with static fallback ---
        const response = await fetch('/api/chat/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, chatbotId, conversationId: demoConversationId }),
        })

        if (response.ok) {
          const data = await response.json()
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: data.response || 'Thanks for your message! I\'ll get back to you soon.',
            sender: 'bot',
            timestamp: new Date(),
            reaction: null,
          }
          setMessages(prev => [...prev, botMessage])
          if (!isOpen) {
            setUnreadCount(prev => prev + 1)
          }
        } else {
          throw new Error('Failed to send message')
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
        reaction: null,
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
      setIsBotTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleReaction = (messageId: string, reaction: 'up' | 'down') => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, reaction: msg.reaction === reaction ? null : reaction }
          : msg
      )
    )
  }

  const handleClearChat = () => {
    setMessages([])
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 flex flex-col items-end`}>
      {/* Greeting Bubble */}
      {showGreeting && !isOpen && (
        <div 
          className="mb-3 mr-1 max-w-[260px] animate-greeting-in"
          style={{ transformOrigin: 'bottom right' }}
        >
          <div className="relative rounded-2xl bg-card border border-border/60 px-4 py-3 shadow-xl">
            <button
              onClick={() => { setShowGreeting(false); setGreetingDismissed(true) }}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
              aria-label="Dismiss greeting"
            >
              <X className="h-3 w-3" />
            </button>
            <p className="text-sm text-foreground font-medium">{greetingMessage}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{greetingSubtext}</p>
            {/* Speech bubble tail */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-card border-b border-r border-border/60 rotate-45" />
          </div>
        </div>
      )}

      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          className="group relative h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-95 animate-fab-in"
          style={{ backgroundColor: primaryColor }}
          aria-label="Open chat"
        >
          {avatarStyle === 'glass-orb' ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <GlassOrbAvatar
                sender="bot"
                isTyping={isBotTyping}
                size={56}
                skin="default"
                glyph={avatarGlyph}
              />
            </div>
          ) : (
            <MessageSquare className="h-6 w-6 text-primary-foreground mx-auto" />
          )}
          
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1.5 -right-1.5 h-5 min-w-5 rounded-full p-0 text-xs flex items-center justify-center animate-badge-pop"
            >
              {unreadCount}
            </Badge>
          )}

          {/* Pulse ring */}
          <span 
            className="absolute inset-0 rounded-full animate-ping-slow opacity-20" 
            style={{ backgroundColor: primaryColor }}
          />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={`
            w-[calc(100vw-1rem)] sm:w-[380px] max-h-[calc(100vh-6rem)] sm:max-h-[560px] flex flex-col rounded-2xl shadow-2xl border border-border/40 overflow-hidden
            bg-card backdrop-blur-xl
            ${isAnimatingOpen ? 'animate-chat-open' : ''}
            ${isAnimatingClose ? 'animate-chat-close' : ''}
          `}
          style={{ transformOrigin: 'bottom right' }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-3">
              {avatarStyle === 'glass-orb' && (
                <div className="relative h-9 w-9">
                  <GlassOrbAvatar
                    sender="bot"
                    isTyping={isBotTyping}
                    size={36}
                    skin="default"
                    glyph={avatarGlyph}
                    style={{}}
                    className=""
                  />
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold text-primary-foreground">{widgetTitle}</h3>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-primary-foreground/80">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-primary-foreground/80 hover:bg-primary-foreground/10 transition-colors"
                  title="Clear chat"
                  aria-label="Clear chat"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-primary-foreground/80 hover:bg-primary-foreground/10 transition-colors"
                aria-label={isMinimized ? 'Expand' : 'Minimize'}
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                onClick={handleToggle}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-primary-foreground/80 hover:bg-primary-foreground/10 transition-colors"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-4 py-4 min-h-0 max-h-[calc(100vh-16rem)] sm:max-h-[380px]"
              >
                <div className="flex flex-col gap-3">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 animate-fade-up">
                      <div className="relative h-16 w-16 mb-4">
                        <GlassOrbAvatar
                          sender="bot"
                          isTyping={false}
                          size={64}
                          skin="default"
                          glyph={avatarGlyph}
                          style={{}}
                          className=""
                        />
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium text-foreground">Welcome!</p>
                      </div>
                      <p className="text-xs text-muted-foreground text-center max-w-[220px]">
                        {welcomeMessage}
                      </p>
                    </div>
                  )}
                  
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-message-in`}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="group flex flex-col gap-1 max-w-[82%]">
                        <div
                          className={`
                            relative rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
                            transition-shadow duration-200
                            ${message.sender === 'user'
                              ? 'rounded-br-md text-primary-foreground'
                              : 'rounded-bl-md bg-muted text-foreground'
                            }
                          `}
                          style={message.sender === 'user' ? { backgroundColor: primaryColor } : undefined}
                        >
                          <p>{message.content}</p>
                        </div>
                        
                        {/* Timestamp & Reactions */}
                        <div className={`flex items-center gap-1.5 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[10px] text-muted-foreground/60">
                            {formatTime(message.timestamp)}
                          </span>
                          
                          {message.sender === 'bot' && (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={() => handleReaction(message.id, 'up')}
                                className={`h-5 w-5 rounded flex items-center justify-center transition-colors ${
                                  message.reaction === 'up' 
                                    ? 'text-green-500 bg-green-500/10' 
                                    : 'text-muted-foreground/50 hover:text-foreground hover:bg-muted'
                                }`}
                                aria-label="Thumbs up"
                              >
                                <ThumbsUp className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleReaction(message.id, 'down')}
                                className={`h-5 w-5 rounded flex items-center justify-center transition-colors ${
                                  message.reaction === 'down' 
                                    ? 'text-red-500 bg-red-500/10' 
                                    : 'text-muted-foreground/50 hover:text-foreground hover:bg-muted'
                                }`}
                                aria-label="Thumbs down"
                              >
                                <ThumbsDown className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Typing indicator */}
                  {isBotTyping && (
                    <div className="flex justify-start animate-message-in">
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-typing-dot-1" />
                          <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-typing-dot-2" />
                          <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-typing-dot-3" />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Scroll to bottom */}
              {showScrollDown && (
                <div className="flex justify-center -mt-10 relative z-10 pointer-events-none">
                  <button
                    onClick={() => scrollToBottom()}
                    className="pointer-events-auto h-8 w-8 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:shadow-xl transition-all animate-fade-up"
                    aria-label="Scroll to bottom"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Quick Replies */}
              {messages.length === 0 && (
                <div className="px-4 pb-2 flex flex-wrap gap-1.5 animate-fade-up" style={{ animationDelay: '200ms' }}>
                  {activeQuickReplies.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => handleSendMessage(reply)}
                      disabled={isTyping}
                      className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground 
                                 hover:border-primary/40 hover:text-foreground hover:bg-primary/5
                                 transition-all duration-200 disabled:opacity-50"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-4 py-3 border-t border-border/50 shrink-0 bg-card">
                <div className="flex items-center gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholderText}
                    disabled={isTyping}
                    className="flex-1 rounded-xl border-border/50 bg-muted/50 text-sm placeholder:text-muted-foreground/50
                               focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/30"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isTyping}
                    className="h-9 w-9 rounded-xl flex items-center justify-center text-primary-foreground
                               transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
                               hover:opacity-90 active:scale-95"
                    style={{ backgroundColor: !inputValue.trim() || isTyping ? 'hsl(var(--muted))' : primaryColor }}
                    aria-label="Send message"
                  >
                    <Send className={`h-4 w-4 ${!inputValue.trim() || isTyping ? 'text-muted-foreground' : ''}`} />
                  </button>
                </div>
                {showBranding && (
                  <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
                    Powered by Vintra
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
