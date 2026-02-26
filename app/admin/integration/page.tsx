'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, Copy, Code2, Globe, Loader2, CheckCircle2 } from 'lucide-react'
import { useWorkspace } from '@/components/admin/workspace-provider'

export default function IntegrationPage() {
  const { activeWorkspaceId, loading: workspaceLoading } = useWorkspace()
  const [chatbotId, setChatbotId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const loadChatbotId = async () => {
      // Wait for workspace to be loaded
      if (workspaceLoading) {
        return
      }
      
      if (!activeWorkspaceId) {
        setLoading(false)
        return
      }
      
      try {
        // Use API route to fetch chatbot ID (bypasses RLS issues)
        const res = await fetch(`/api/chatbot/id?workspaceId=${activeWorkspaceId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.chatbotId) {
            setChatbotId(data.chatbotId)
          }
        }
      } catch (err) {
        console.error('Failed to load chatbot ID:', err)
      }
      setLoading(false)
    }
    
    loadChatbotId()
  }, [activeWorkspaceId, workspaceLoading])

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const scriptCode = `<!-- VintraStudio Chatbot Widget -->
<script
  src="${typeof window !== 'undefined' ? window.location.origin : ''}/api/widget.js"
  data-chatbot-id="${chatbotId || 'YOUR_CHATBOT_ID'}"
  async
></script>`

  const reactCode = `// Install the widget in your React/Next.js app
import { useEffect } from 'react';

export function ChatWidget() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '${typeof window !== 'undefined' ? window.location.origin : ''}/api/widget.js';
    script.setAttribute('data-chatbot-id', '${chatbotId || 'YOUR_CHATBOT_ID'}');
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  return null;
}`

  const npmCode = `# Coming soon: NPM package
npm install @vintrastudio/widget

# Then in your code:
import { VintraChat } from '@vintrastudio/widget';

<VintraChat chatbotId="${chatbotId || 'YOUR_CHATBOT_ID'}" />`

  if (loading || workspaceLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Integration</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Add the chat widget to your website in seconds
        </p>
      </div>

      {/* Chatbot ID */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Your Chatbot ID
          </CardTitle>
          <CardDescription>
            Use this unique identifier to connect the widget to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chatbotId ? (
            <div className="flex items-center gap-3">
              <code className="flex-1 overflow-x-auto rounded-lg bg-muted px-3 sm:px-4 py-3 font-mono text-xs sm:text-sm">
                {chatbotId}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(chatbotId || '', 'id')}
              >
                {copied === 'id' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                No chatbot configuration found. Please go to the Appearance page to set up your chatbot first.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Installation Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Installation
          </CardTitle>
          <CardDescription>
            Choose your preferred method to add the widget
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="script">
            <TabsList className="mb-4 w-full justify-start overflow-x-auto">
              <TabsTrigger value="script">HTML Script</TabsTrigger>
              <TabsTrigger value="react">React / Next.js</TabsTrigger>
              <TabsTrigger value="npm">
                NPM
                <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="script" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add this script tag just before the closing <code className="rounded bg-muted px-1">&lt;/body&gt;</code> tag on your website.
              </p>
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg bg-muted p-3 sm:p-4 font-mono text-xs sm:text-sm">
                  <code>{scriptCode}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => copyToClipboard(scriptCode, 'script')}
                >
                  {copied === 'script' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="react" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Create a component to load the widget in your React or Next.js application.
              </p>
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm">
                  <code>{reactCode}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => copyToClipboard(reactCode, 'react')}
                >
                  {copied === 'react' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="npm" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Our NPM package is coming soon for easier integration with React frameworks.
              </p>
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm opacity-60">
                  <code>{npmCode}</code>
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Checklist</CardTitle>
          <CardDescription>
            Make sure everything is configured correctly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {[
              { label: 'Chatbot created', done: !!chatbotId },
              { label: 'Widget script added to your website', done: false },
              { label: 'Customize appearance (optional)', done: false },
              { label: 'Add canned responses (optional)', done: false },
              { label: 'Test the widget', done: false },
            ].map((item) => (
              <li key={item.label} className="flex items-center gap-3">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
                  item.done ? 'bg-primary' : 'border-2 border-border'
                }`}>
                  {item.done && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
                </div>
                <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
