'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, Minimize2, Maximize2 } from 'lucide-react'
import GlassOrbAvatar from './glass-orb-avatar'

interface Message {
  id: string
  content: string
  sender: 'user' | 'bot'
  timestamp: Date
}

interface ChatInterfaceProps {
  chatbotId?: string
  primaryColor?: string
  avatarStyle?: 'default' | 'glass-orb' | 'juleskin'
  position?: 'bottom-right' | 'bottom-left'
  isOpen?: boolean
  onToggle?: () => void
}

export default function ChatInterface({
  chatbotId,
  primaryColor = '#3b82f6',
  avatarStyle = 'glass-orb',
  position = 'bottom-right',
  isOpen: controlledIsOpen,
  onToggle,
}: ChatInterfaceProps) {
  const [isInternalOpen, setIsInternalOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isBotTyping, setIsBotTyping] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : isInternalOpen

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleToggle = () => {
    if (isControlled && onToggle) {
      onToggle()
    } else {
      setIsInternalOpen(!isInternalOpen)
    }
    
    if (!isOpen) {
      setUnreadCount(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      // Simulate bot response
      setIsBotTyping(true)
      
      // Call your chat API here
      const response = await fetch('/api/chat/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          chatbotId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response || 'Thanks for your message! I\'ll get back to you soon.',
          sender: 'bot',
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, botMessage])
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
      setIsBotTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 flex flex-col items-end`}>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={handleToggle}
          className="relative h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform"
          style={{ backgroundColor: primaryColor }}
        >
          {avatarStyle === 'glass-orb' ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <GlassOrbAvatar
                sender="bot"
                isTyping={isBotTyping}
                size={56}
                skin="default"
                className="scale-90"
                style={{}}
              />
            </div>
          ) : (
            <Send className="h-6 w-6 text-white" />
          )}
          
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="w-96 shadow-2xl border-0">
          {/* Header */}
          <CardHeader 
            className="pb-3 flex flex-row items-center justify-between space-y-0"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-3">
              {avatarStyle === 'glass-orb' && (
                <GlassOrbAvatar
                  sender="bot"
                  isTyping={isBotTyping}
                  size={32}
                  skin="default"
                  style={{}}
                  className=""
                />
              )}
              <CardTitle className="text-white text-lg">Chat Support</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggle}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                ×
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              {/* Messages */}
              <CardContent className="p-4 h-96 overflow-y-auto">
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <p>Hi there! 👋</p>
                      <p>How can I help you today?</p>
                    </div>
                  )}
                  
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          message.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {isBotTyping && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Typing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isTyping}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    size="icon"
                  >
                    {isTyping ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  )
}
