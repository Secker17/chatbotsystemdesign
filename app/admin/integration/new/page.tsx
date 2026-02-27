'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Code, Package, Globe, CheckCircle2, Download } from 'lucide-react'
import { useWorkspace } from '@/components/admin/workspace-provider'
import ChatWidget from '@/components/chat-widget'

export default function NewIntegrationPage() {
  const { activeWorkspaceId } = useWorkspace()
  const [chatbotId, setChatbotId] = useState<string>('')
  const [copied, setCopied] = useState<string>('')

  useEffect(() => {
    const loadChatbotId = async () => {
      if (!activeWorkspaceId) return
      
      try {
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
    }
    
    loadChatbotId()
  }, [activeWorkspaceId])

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(''), 2000)
  }

  const getReactCode = () => {
    return `// Install the widget in your React/Next.js app
import ChatWidget from '@/components/chat-widget'

export default function YourApp() {
  return (
    <div>
      {/* Your app content */}
      
      {/* Chat Widget */}
      <ChatWidget 
        chatbotId="${chatbotId}"
        userId="user@example.com"  // Optional: for personalized chat
        onMessageSent={(message, response) => {
          console.log('User said:', message)
          console.log('Bot replied:', response)
        }}
      />
    </div>
  )
}`
  }

  const getNpmCode = () => {
    return `# Install from NPM (Coming Soon)
npm install @vintrastudio/chat-widget

# Usage
import ChatWidget from '@vintrastudio/chat-widget'

<ChatWidget 
  chatbotId="${chatbotId}"
  userId="user@example.com"
/>`
  }

  const getScriptCode = () => {
    return `<!-- Traditional Script Tag Method -->
<script 
  src="${typeof window !== 'undefined' ? window.location.origin : ''}/api/widget"
  data-chatbot-id="${chatbotId}"
  data-user-id="user@example.com"
  async>
</script>`
  }

  const getIframeCode = () => {
    return `<!-- Iframe Method -->
<iframe 
  src="${typeof window !== 'undefined' ? window.location.origin : ''}/api/widget?chatbotId=${chatbotId}&userId=user@example.com"
  style="width: 380px; height: 500px; border: none; border-radius: 12px;"
  frameborder="0"
  allowfullscreen>
</iframe>`
  }

  const getTypescriptCode = () => {
    return `// TypeScript with full type support
import ChatWidget, { ChatWidgetProps, ChatWidgetConfig } from '@/components/chat-widget'

interface YourComponentProps {
  // Your props
}

export default function YourComponent({}: YourComponentProps) {
  const [userId, setUserId] = useState<string>('')

  return (
    <ChatWidget 
      chatbotId="${chatbotId}"
      userId={userId}
      className="custom-chat-widget"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999
      }}
      onConfigLoaded={(config: ChatWidgetConfig) => {
        console.log('Widget config loaded:', config)
      }}
      onMessageSent={(message: string, response: string) => {
        // Handle messages
        console.log('Message:', message)
        console.log('Response:', response)
        
        // You can store messages, trigger events, etc.
        if (message.includes('help')) {
          // Trigger help workflow
        }
      }}
    />
  )
}`
  }

  if (!chatbotId) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Loading Integration Options</h3>
          <p className="text-muted-foreground">Please wait while we load your chatbot configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Widget Integration</h1>
        <p className="text-muted-foreground">
          Integrate your chat widget into any website or application. Multiple integration methods available.
        </p>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
          <CardDescription>
            See how your widget looks and behaves with real configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-96 border rounded-lg bg-muted/20">
            <ChatWidget 
              chatbotId={chatbotId}
              userId="demo-user@example.com"
              style={{ 
                position: 'absolute', 
                bottom: 20, 
                right: 20,
                zIndex: 10 
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Integration Options */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Methods</CardTitle>
          <CardDescription>
            Choose the integration method that works best for your tech stack
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="react" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="react">React/Next.js</TabsTrigger>
              <TabsTrigger value="typescript">TypeScript</TabsTrigger>
              <TabsTrigger value="script">Script Tag</TabsTrigger>
              <TabsTrigger value="npm">NPM Package</TabsTrigger>
            </TabsList>
            
            <TabsContent value="react" className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Recommended</Badge>
                <span className="text-sm text-muted-foreground">Full React component with props and callbacks</span>
              </div>
              
              <div className="relative">
                <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
                  <code>{getReactCode()}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(getReactCode(), 'react')}
                >
                  {copied === 'react' ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
              
              <div className="space-y-2 text-sm">
                <h4 className="font-medium">Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Full TypeScript support</li>
                  <li>Props for customization</li>
                  <li>Event callbacks (onMessageSent, onConfigLoaded)</li>
                  <li>Custom styling support</li>
                  <li>User identification</li>
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="typescript" className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">TypeScript</Badge>
                <span className="text-sm text-muted-foreground">Full type safety and IntelliSense</span>
              </div>
              
              <div className="relative">
                <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
                  <code>{getTypescriptCode()}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(getTypescriptCode(), 'typescript')}
                >
                  {copied === 'typescript' ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
              
              <div className="space-y-2 text-sm">
                <h4 className="font-medium">Type Definitions:</h4>
                <pre className="text-xs bg-muted p-2 rounded">
                  <code>{`interface ChatWidgetProps {
  chatbotId: string
  userId?: string
  workspaceId?: string
  className?: string
  style?: React.CSSProperties
  onConfigLoaded?: (config: ChatWidgetConfig) => void
  onMessageSent?: (message: string, response: string) => void
}`}</code>
                </pre>
              </div>
            </TabsContent>
            
            <TabsContent value="script" className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Universal</Badge>
                <span className="text-sm text-muted-foreground">Works with any HTML website</span>
              </div>
              
              <div className="relative">
                <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
                  <code>{getScriptCode()}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(getScriptCode(), 'script')}
                >
                  {copied === 'script' ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
              
              <div className="space-y-2 text-sm">
                <h4 className="font-medium">Alternative - Iframe:</h4>
                <div className="relative">
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    <code>{getIframeCode()}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-1 right-1"
                    onClick={() => copyToClipboard(getIframeCode(), 'iframe')}
                  >
                    {copied === 'iframe' ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="npm" className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Coming Soon</Badge>
                <span className="text-sm text-muted-foreground">Install as NPM package</span>
              </div>
              
              <div className="relative">
                <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
                  <code>{getNpmCode()}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(getNpmCode(), 'npm')}
                >
                  {copied === 'npm' ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
              
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> NPM package is coming soon. For now, use the React component or script tag method.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Configuration Details */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Your widget configuration is automatically loaded from the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Chatbot ID:</span>
                <div className="font-mono bg-muted px-2 py-1 rounded mt-1">{chatbotId}</div>
              </div>
              <div>
                <span className="font-medium">API Endpoint:</span>
                <div className="font-mono bg-muted px-2 py-1 rounded mt-1">/api/widget</div>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>The widget automatically loads your configuration from:</p>
              <code className="bg-muted px-1 rounded">/api/widget/config?chatbotId={chatbotId}</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
