'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { 
  Loader2, 
  Search, 
  MessageSquare, 
  Send,
  User,
  Bot,
  MoreVertical,
  Archive,
  Trash2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ChatSession {
  id: string
  visitor_name: string | null
  visitor_email: string | null
  status: string
  created_at: string
  chat_messages: ChatMessage[]
}

interface ChatMessage {
  id: string
  content: string
  sender_type: 'visitor' | 'admin' | 'bot'
  created_at: string
}

export default function ConversationsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  const loadSessions = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('chat_sessions')
      .select(`
        id,
        visitor_name,
        visitor_email,
        status,
        created_at,
        chat_messages (
          id,
          content,
          sender_type,
          created_at
        )
      `)
      .eq('admin_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      setSessions(data)
      if (!selectedSession && data.length > 0) {
        setSelectedSession(data[0])
      }
    }
    setLoading(false)
  }, [selectedSession])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedSession) return
    setSending(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('chat_messages').insert({
      session_id: selectedSession.id,
      admin_id: user.id,
      content: newMessage,
      sender_type: 'admin',
    })

    setNewMessage('')
    await loadSessions()
    setSending(false)
  }

  const handleArchive = async (sessionId: string) => {
    const supabase = createClient()
    await supabase
      .from('chat_sessions')
      .update({ status: 'closed' })
      .eq('id', sessionId)
    await loadSessions()
  }

  const filteredSessions = sessions.filter((session) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      session.visitor_name?.toLowerCase().includes(searchLower) ||
      session.visitor_email?.toLowerCase().includes(searchLower) ||
      session.chat_messages.some((m) => m.content.toLowerCase().includes(searchLower))
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Conversations</h1>
        <p className="text-muted-foreground">
          Manage and respond to chat conversations
        </p>
      </div>

      <div className="grid h-[calc(100vh-220px)] gap-6 lg:grid-cols-3">
        {/* Sessions List */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
                </div>
              ) : (
                <div className="divide-y">
                  {filteredSessions.map((session) => {
                    const lastMessage = session.chat_messages[session.chat_messages.length - 1]
                    const isSelected = selectedSession?.id === session.id
                    return (
                      <button
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className={`w-full p-4 text-left transition-colors hover:bg-muted/50 ${
                          isSelected ? 'bg-muted' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {session.visitor_name?.[0]?.toUpperCase() || 'V'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate font-medium">
                                  {session.visitor_name || 'Anonymous'}
                                </span>
                                <Badge
                                  variant={session.status === 'active' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {session.status}
                                </Badge>
                              </div>
                              {lastMessage && (
                                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                  {lastMessage.content}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {new Date(session.created_at).toLocaleDateString()}
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
                    <CardTitle className="text-base">
                      {selectedSession.visitor_name || 'Anonymous Visitor'}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {selectedSession.visitor_email || 'No email provided'}
                    </CardDescription>
                  </div>
                </div>
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
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {selectedSession.chat_messages.map((message) => {
                      const isAdmin = message.sender_type === 'admin'
                      const isBot = message.sender_type === 'bot'
                      return (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className={
                              isAdmin 
                                ? 'bg-primary text-primary-foreground' 
                                : isBot 
                                ? 'bg-secondary text-secondary-foreground'
                                : 'bg-muted'
                            }>
                              {isAdmin ? 'A' : isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`max-w-[70%] ${isAdmin ? 'text-right' : ''}`}>
                            <div
                              className={`inline-block rounded-lg px-4 py-2 text-sm ${
                                isAdmin
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              {message.content}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(message.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your reply..."
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
