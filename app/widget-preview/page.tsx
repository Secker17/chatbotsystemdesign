'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ChatInterface from '@/components/chat-interface'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Copy, Check, ExternalLink } from 'lucide-react'
import Link from 'next/link'

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

// Helper to extract avatar style
function getAvatarStyle(avatarUrl: string | null): 'glass-orb' | 'default' {
  if (avatarUrl?.startsWith('icon:')) {
    const style = avatarUrl.replace('icon:', '')
    if (style === 'glass-orb') return 'glass-orb'
  }
  return 'default'
}

export default function WidgetPreviewPage() {
  const [chatbotId, setChatbotId] = useState<string | null>(null)
  const [config, setConfig] = useState<ChatConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [widgetOpen, setWidgetOpen] = useState(false)

  useEffect(() => {
    async function loadConfig() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const workspaceCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('active_workspace='))
          ?.split('=')[1]
        
        const workspaceId = workspaceCookie || user.id
        
        let { data } = await supabase
          .from('chatbot_configs')
          .select('id')
          .eq('admin_id', workspaceId)
          .limit(1)
          .single()
        
        if (!data) {
          try {
            const setupRes = await fetch('/api/chatbot/setup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ workspaceId }),
            })
            if (setupRes.ok) {
              const setupData = await setupRes.json()
              data = setupData.config
            }
          } catch (e) {
            console.error('Failed to setup chatbot:', e)
          }
        }
        
        if (data?.id) {
          setChatbotId(data.id)
          // Fetch the full config
          try {
            const configRes = await fetch(`/api/chat/config?chatbot_id=${data.id}`)
            if (configRes.ok) {
              const configData = await configRes.json()
              setConfig(configData)
            }
          } catch (e) {
            console.error('Failed to fetch config:', e)
          }
        }
      }
      setLoading(false)
    }

    loadConfig()
  }, [])

  const handleCopy = () => {
    if (chatbotId) {
      navigator.clipboard.writeText(
        `<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/api/widget.js" data-chatbot-id="${chatbotId}" async></script>`
      )
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-foreground">
            Vintra
          </Link>
          <Badge variant="secondary">Preview Mode</Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Widget Preview</h1>
          <p className="mt-3 text-muted-foreground">
            This is a live preview of your chat widget. All your settings from the appearance panel are applied below.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {chatbotId ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Chatbot ID</CardTitle>
                  <CardDescription>
                    Use this ID when installing the widget
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 font-mono text-sm">
                      {chatbotId}
                    </code>
                    <Button variant="outline" size="icon" onClick={handleCopy}>
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Installation Code</CardTitle>
                  <CardDescription>
                    Add this script to your website
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs text-foreground border border-border font-mono">
                    <code>{`<script
  src="${typeof window !== 'undefined' ? window.location.origin : ''}/api/widget.js"
  data-chatbot-id="${chatbotId}"
  async
></script>`}</code>
                  </pre>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Not Logged In</CardTitle>
                <CardDescription>
                  Log in to your admin panel to see your chatbot ID and test the widget.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/auth/login">
                    Go to Login
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Live Preview */}
        <Card className="mt-10">
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>
              Your chat widget is shown below with all your configured settings. Click the button in the corner to test.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative min-h-[400px] rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-4">
              {config && chatbotId ? (
                <ChatInterface
                  chatbotId={chatbotId}
                  primaryColor={config.primary_color}
                  avatarStyle={getAvatarStyle(config.avatar_url)}
                  position={config.position}
                  isOpen={widgetOpen}
                  onToggle={() => setWidgetOpen(!widgetOpen)}
                  widgetTitle={config.widget_title}
                  welcomeMessage={config.welcome_message}
                  placeholderText={config.placeholder_text}
                  showBranding={config.show_branding}
                  quickReplies={config.quick_replies}
                  greetingMessage={config.greeting_message || undefined}
                  greetingSubtext={config.greeting_subtext}
                  greetingEnabled={config.greeting_enabled}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading preview...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Back to Admin */}
        <div className="mt-8 text-center">
          <Button variant="outline" asChild>
            <Link href="/admin">
              Back to Admin Dashboard
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
