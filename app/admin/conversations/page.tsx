'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, 
  Search, 
  MessageSquare, 
  Send,
  User,
  Bot,
  MoreVertical,
  Archive,
  Trash2,
  RefreshCw,
  Circle,
  Sparkles,
  UserCheck,
  ArrowLeftRight,
  Power,
  AlertTriangle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface ChatSession {
  id: string
  visitor_name: string | null
  visitor_email: string | null
  visitor_id: string
  status: string
  started_at: string
  updated_at: string
  last_message_at: string | null
  chatbot_id: string
  admin_id: string | null
  is_bot_active: boolean | null
  handoff_requested_at: string | null
  bot_messages_count: number | null
  chat_messages: ChatMessage[]
}

interface ChatMessage {
  id: string
  content: string
  sender_type: 'visitor' | 'admin' | 'bot'
  created_at: string
  is_read: boolean
  is_ai_generated: boolean | null
  metadata: Record<string, unknown> | null
}

export default function ConversationsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [chatbotIds, setChatbotIds] = useState<string[]>([])
  const [filter, setFilter] = useState<'all' | 'handoff' | 'active' | 'ai'>('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const selectedSessionRef = useRef<ChatSession | null>(null)

  // Keep ref in sync with state
  useEffect(() => {
    selectedSessionRef.current = selectedSession
  }, [selectedSession])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Initialize: get user and their chatbot IDs
  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (!user || error) {
        console.error('Auth failed in conversations:', error)
        setLoading(false)
        return
      }

      setUserId(user.id)

      // Fetch all chatbot IDs belonging to this admin
      const { data: chatbots, error: chatbotsError } = await supabase
        .from('chatbot_configs')
        .select('id')
        .eq('admin_id', user.id)

      if (chatbotsError) {
        console.error('Failed to fetch chatbots:', chatbotsError)
        setLoading(false)
        return
      }

      const ids = (chatbots || []).map(c => c.id)
      setChatbotIds(ids)
    }

    init()
  }, [])

  const loadSessions = useCallback(async (selectFirst = false) => {
    if (chatbotIds.length === 0) {
      setLoading(false)
      return
    }

    const supabase = createClient()

    const { data: sessionsData, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('id, visitor_name, visitor_email, visitor_id, status, started_at, updated_at, last_message_at, chatbot_id, admin_id, is_bot_active, handoff_requested_at, bot_messages_count')
      .in('chatbot_id', chatbotIds)
      .order('updated_at', { ascending: false })

    if (sessionsError) {
      console.error('Sessions query error:', sessionsError)
      setLoading(false)
      return
    }

    if (!sessionsData || sessionsData.length === 0) {
      setSessions([])
      setLoading(false)
      return
    }

    // Fetch messages for all sessions in a single query
    const sessionIds = sessionsData.map(s => s.id)
    const { data: messagesData, error: messagesError } = await supabase
      .from('chat_messages')
      .select('id, content, sender_type, created_at, is_read, session_id, is_ai_generated, metadata')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Messages query error:', messagesError)
    }

    // Group messages by session_id
    const messagesBySession: Record<string, ChatMessage[]> = {}
    for (const msg of (messagesData || [])) {
      if (!messagesBySession[msg.session_id]) {
        messagesBySession[msg.session_id] = []
      }
      messagesBySession[msg.session_id].push({
        id: msg.id,
        content: msg.content,
        sender_type: msg.sender_type,
        created_at: msg.created_at,
        is_read: msg.is_read,
        is_ai_generated: msg.is_ai_generated,
        metadata: msg.metadata,
      })
    }

    // Combine sessions with their messages
    const sortedData: ChatSession[] = sessionsData.map(session => ({
      ...session,
      chat_messages: messagesBySession[session.id] || [],
    }))

    setSessions(sortedData)

    // Update selected session if it exists in new data
    const current = selectedSessionRef.current
    if (current) {
      const updated = sortedData.find(s => s.id === current.id)
      if (updated) {
        setSelectedSession(updated)
      }
    } else if (selectFirst && sortedData.length > 0) {
      setSelectedSession(sortedData[0])
    }

    setLoading(false)
  }, [chatbotIds])

  // Load sessions when chatbotIds are available
  useEffect(() => {
    if (chatbotIds.length > 0) {
      loadSessions(true)
    }
  }, [chatbotIds, loadSessions])

  // Setup real-time subscription
  useEffect(() => {
    if (chatbotIds.length === 0) return

    const supabase = createClient()
    
    const channel = supabase
      .channel('admin-chat-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => { loadSessions(); scrollToBottom(); }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_sessions' },
        () => { loadSessions(); }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_sessions' },
        () => { loadSessions(); }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_sessions' },
        () => { loadSessions(); }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_messages' },
        () => { loadSessions(); }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatbotIds, loadSessions])

  // Scroll to bottom when selected session changes or new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [selectedSession?.chat_messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedSession || !userId) return
    setSending(true)

    const supabase = createClient()

    // If the admin sends a message and the bot is still active, deactivate it
    if (selectedSession.is_bot_active) {
      await supabase
        .from('chat_sessions')
        .update({ 
          is_bot_active: false,
          updated_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
          status: 'active',
        })
        .eq('id', selectedSession.id)
    }

    const { error } = await supabase.from('chat_messages').insert({
      session_id: selectedSession.id,
      admin_id: userId,
      content: newMessage,
      sender_type: 'admin',
      sender_id: userId,
    })

    if (error) {
      console.error('Send message error:', error)
    } else {
      await supabase
        .from('chat_sessions')
        .update({ 
          updated_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
          status: 'active',
        })
        .eq('id', selectedSession.id)
    }

    setNewMessage('')
    setSending(false)
  }

  const handleTakeOver = async (sessionId: string) => {
    const supabase = createClient()
    await supabase
      .from('chat_sessions')
      .update({ 
        is_bot_active: false,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    // Send a system message to let the visitor know
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      admin_id: userId,
      content: 'A human agent has joined the conversation. How can I help you?',
      sender_type: 'admin',
      sender_id: userId,
    })

    await loadSessions()
  }

  const handleReactivateBot = async (sessionId: string) => {
    const supabase = createClient()
    await supabase
      .from('chat_sessions')
      .update({ 
        is_bot_active: true,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
    await loadSessions()
  }

  const handleArchive = async (sessionId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('chat_sessions')
      .update({ status: 'closed', ended_at: new Date().toISOString(), is_bot_active: false })
      .eq('id', sessionId)
    
    if (!error) {
      await loadSessions()
    }
  }

  const handleDelete = async (sessionId: string) => {
    const supabase = createClient()
    
    if (selectedSession?.id === sessionId) {
      setSelectedSession(null)
    }
    setSessions(prev => prev.filter(s => s.id !== sessionId))

    const { error: msgError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId)

    if (msgError) {
      console.error('Failed to delete messages:', msgError)
      await loadSessions()
      return
    }
    
    const { error: sessionError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)

    if (sessionError) {
      console.error('Failed to delete session:', sessionError)
    }

    await loadSessions()
  }

  const getSessionStatusBadge = (session: ChatSession) => {
    if (session.status === 'waiting_for_human') {
      return (
        <Badge variant="destructive" className="gap-1 text-xs">
          <AlertTriangle className="h-3 w-3" />
          Handoff
        </Badge>
      )
    }
    if (session.is_bot_active) {
      return (
        <Badge variant="secondary" className="gap-1 text-xs bg-purple-500/10 text-purple-400 border-purple-500/20">
          <Sparkles className="h-3 w-3" />
          AI
        </Badge>
      )
    }
    if (session.status === 'active') {
      return <Badge variant="default" className="text-xs">Active</Badge>
    }
    return <Badge variant="secondary" className="text-xs">{session.status}</Badge>
  }

  const filteredSessions = sessions.filter((session) => {
    // Apply status filter
    if (filter === 'handoff' && session.status !== 'waiting_for_human') return false
    if (filter === 'active' && session.status !== 'active') return false
    if (filter === 'ai' && !session.is_bot_active) return false

    const searchLower = searchQuery.toLowerCase()
    if (!searchLower) return true
    return (
      session.visitor_name?.toLowerCase().includes(searchLower) ||
      session.visitor_email?.toLowerCase().includes(searchLower) ||
      session.visitor_id?.toLowerCase().includes(searchLower) ||
      session.chat_messages.some((m) => m.content.toLowerCase().includes(searchLower))
    )
  })

  const handoffCount = sessions.filter(s => s.status === 'waiting_for_human').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conversations</h1>
          <p className="text-muted-foreground">
            Manage and respond to chat conversations in real-time
          </p>
        </div>
        <div className="flex items-center gap-3">
          {handoffCount > 0 && (
            <Badge variant="destructive" className="gap-1 py-1">
              <AlertTriangle className="h-3 w-3" />
              {handoffCount} waiting for human
            </Badge>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Circle 
              className={`h-2 w-2 ${isConnected ? 'fill-green-500 text-green-500' : 'fill-yellow-500 text-yellow-500'}`} 
            />
            <span className="text-muted-foreground">
              {isConnected ? 'Live' : 'Connecting...'}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => loadSessions()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid h-[calc(100vh-220px)] gap-6 lg:grid-cols-3">
        {/* Sessions List */}
        <Card className="flex flex-col">
          <CardHeader className="space-y-3 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-1.5">
              {[
                { key: 'all' as const, label: 'All' },
                { key: 'handoff' as const, label: 'Handoff', count: handoffCount },
                { key: 'ai' as const, label: 'AI' },
                { key: 'active' as const, label: 'Active' },
              ].map(f => (
                <Button 
                  key={f.key}
                  variant={filter === f.key ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                  {f.count ? (
                    <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                      {f.count}
                    </Badge>
                  ) : null}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              {filteredSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No conversations found
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Conversations will appear here when visitors start chatting through your widget
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredSessions.map((session) => {
                    const lastMessage = session.chat_messages[session.chat_messages.length - 1]
                    const isSelected = selectedSession?.id === session.id
                    const hasNewMessages = lastMessage?.sender_type === 'visitor' && !lastMessage?.is_read
                    const isHandoff = session.status === 'waiting_for_human'
                    
                    return (
                      <button
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className={`w-full p-4 text-left transition-colors hover:bg-muted/50 ${
                          isSelected ? 'bg-muted' : ''
                        } ${isHandoff ? 'border-l-2 border-l-destructive' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {session.visitor_name?.[0]?.toUpperCase() || 'V'}
                                </AvatarFallback>
                              </Avatar>
                              {hasNewMessages && session.status !== 'closed' && (
                                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate font-medium">
                                  {session.visitor_name || 'Anonymous'}
                                </span>
                                {getSessionStatusBadge(session)}
                              </div>
                              {lastMessage && (
                                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                  {lastMessage.sender_type === 'admin' && 'You: '}
                                  {lastMessage.sender_type === 'bot' && 'AI: '}
                                  {lastMessage.content}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {new Date(session.updated_at || session.started_at).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat View */}
        <Card className="flex flex-col lg:col-span-2">
          {selectedSession ? (
            <>
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedSession.visitor_name?.[0]?.toUpperCase() || 'V'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">
                        {selectedSession.visitor_name || 'Anonymous Visitor'}
                      </CardTitle>
                      {getSessionStatusBadge(selectedSession)}
                    </div>
                    <CardDescription className="text-xs">
                      {selectedSession.visitor_email || 'No email provided'}
                      {selectedSession.bot_messages_count ? ` \u00B7 ${selectedSession.bot_messages_count} AI messages` : ''}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    {selectedSession.status === 'waiting_for_human' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="default"
                            size="sm" 
                            onClick={() => handleTakeOver(selectedSession.id)}
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Take Over
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Take over from AI and respond as a human</TooltipContent>
                      </Tooltip>
                    )}
                    {selectedSession.is_bot_active && selectedSession.status !== 'waiting_for_human' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline"
                            size="sm" 
                            onClick={() => handleTakeOver(selectedSession.id)}
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Take Over
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Disable AI and respond manually</TooltipContent>
                      </Tooltip>
                    )}
                    {!selectedSession.is_bot_active && selectedSession.status === 'active' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost"
                            size="sm" 
                            onClick={() => handleReactivateBot(selectedSession.id)}
                          >
                            <Power className="mr-2 h-4 w-4" />
                            Reactivate AI
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Let AI handle this conversation again</TooltipContent>
                      </Tooltip>
                    )}
                  </TooltipProvider>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleArchive(selectedSession.id)}>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDelete(selectedSession.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              {/* Handoff Alert Banner */}
              {selectedSession.status === 'waiting_for_human' && (
                <div className="flex items-center gap-3 border-b bg-destructive/5 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <p className="flex-1 text-sm text-destructive">
                    This visitor has requested to speak with a human agent.
                  </p>
                  <Button 
                    size="sm" 
                    onClick={() => handleTakeOver(selectedSession.id)}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Take Over
                  </Button>
                </div>
              )}

              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {selectedSession.chat_messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
                        <p className="mt-3 text-sm text-muted-foreground">
                          No messages yet. Send a message to start the conversation.
                        </p>
                      </div>
                    ) : (
                      selectedSession.chat_messages.map((message) => {
                        const isAdmin = message.sender_type === 'admin'
                        const isBot = message.sender_type === 'bot'
                        const isHandoffMsg = message.metadata && (message.metadata as Record<string, unknown>).type === 'handoff'
                        
                        return (
                          <div key={message.id}>
                            {isHandoffMsg && (
                              <div className="mb-2 flex items-center gap-2 justify-center">
                                <Separator className="flex-1" />
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <ArrowLeftRight className="h-3 w-3" />
                                  Handoff requested
                                </span>
                                <Separator className="flex-1" />
                              </div>
                            )}
                            <div className={`flex gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className={
                                  isAdmin 
                                    ? 'bg-primary text-primary-foreground' 
                                    : isBot 
                                    ? 'bg-purple-500/10 text-purple-400'
                                    : 'bg-muted'
                                }>
                                  {isAdmin ? 'A' : isBot ? <Sparkles className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`max-w-[70%] ${isAdmin ? 'text-right' : ''}`}>
                                <div className="mb-0.5 flex items-center gap-1.5">
                                  {isBot && (
                                    <span className="text-[11px] text-purple-400">AI Assistant</span>
                                  )}
                                  {isAdmin && (
                                    <span className="text-[11px] text-primary ml-auto">You</span>
                                  )}
                                  {!isAdmin && !isBot && (
                                    <span className="text-[11px] text-muted-foreground">Visitor</span>
                                  )}
                                </div>
                                <div
                                  className={`inline-block rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
                                    isAdmin
                                      ? 'bg-primary text-primary-foreground'
                                      : isBot
                                      ? 'bg-purple-500/10 border border-purple-500/20'
                                      : 'bg-muted'
                                  }`}
                                >
                                  {message.content}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {new Date(message.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder={
                      selectedSession.is_bot_active 
                        ? "Type to take over from AI..." 
                        : "Type your reply..."
                    }
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    rows={1}
                    className="min-h-[44px] resize-none"
                  />
                  <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {selectedSession.is_bot_active && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <Sparkles className="mr-1 inline h-3 w-3 text-purple-400" />
                    AI is currently handling this conversation. Sending a message will automatically take over.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 font-medium">No conversation selected</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Select a conversation from the list to view messages
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
