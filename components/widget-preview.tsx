'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Globe, Code2, CheckCircle2, Eye } from 'lucide-react'
import { useWorkspace } from '@/components/admin/workspace-provider'

export default function WidgetPreview() {
  const { activeWorkspaceId } = useWorkspace()
  const [chatbotId, setChatbotId] = useState<string>('')
  const [userId, setUserId] = useState<string>('demo-user')
  const [previewMode, setPreviewMode] = useState<'standalone' | 'embedded'>('standalone')
  const [isWidgetOpen, setIsWidgetOpen] = useState(false)

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
    // TODO: Add toast notification
    setTimeout(() => {
      // Clear selection after copy
    }, 100)
  }

  const getWidgetUrl = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    if (previewMode === 'standalone') {
      return `${baseUrl}/api/widget?chatbotId=${chatbotId}&userId=${userId}`
    } else {
      return `${baseUrl}/api/widget?chatbotId=${chatbotId}&userId=${userId}`
    }
  }

  const getEmbedCode = () => {
    const widgetUrl = getWidgetUrl()
    
    if (previewMode === 'standalone') {
      return `<!-- VintraStudio Chat Widget -->
<script src="${widgetUrl}"></script>`
    } else {
      return `<!-- VintraStudio Chat Widget -->
<iframe 
  src="${widgetUrl}" 
  style="width: 380px; height: 500px; border: none; border-radius: 12px;"
  frameborder="0"
  allowfullscreen>
</iframe>`
    }
  }

  const getReactCode = () => {
    return `// React Component
import { useEffect } from 'react';

export default function ChatWidget({ chatbotId, userId }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '${typeof window !== 'undefined' ? window.location.origin : ''}/api/widget?chatbotId=' + chatbotId + '&userId=' + userId;
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, [chatbotId, userId]);

  return null;
}

// Usage:
<ChatWidget chatbotId="${chatbotId}" userId="${userId}" />`
  }

  const getNpmCode = () => {
    return `# NPM Package (Coming Soon)
npm install @vintrastudio/widget

# Usage:
import { VintraChat } from '@vintrastudio/widget';

<VintraChat chatbotId="${chatbotId}" userId="${userId}" />`
  }

  if (!chatbotId) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Widget Preview</h3>
          <p className="text-muted-foreground">Please select a chatbot to preview the widget.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Widget Preview & Export</CardTitle>
          <CardDescription>
            Preview your chat widget and generate embed codes for your website.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Chatbot ID</label>
              <input
                type="text"
                value={chatbotId}
                onChange={(e) => setChatbotId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="Enter your chatbot ID"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">User ID (Optional)</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="User identifier for personalized chat"
              />
            </div>
          </div>

          {/* Preview Mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Preview Mode</label>
            <Tabs value={previewMode} onValueChange={(value) => setPreviewMode(value as 'standalone' | 'embedded')}>
              <TabsList>
                <TabsTrigger value="standalone">Standalone Page</TabsTrigger>
                <TabsTrigger value="embedded">Embedded Widget</TabsTrigger>
              </TabsList>
              <TabsContent value="standalone" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Opens the widget in a new tab as a standalone page.
                </p>
                <Button
                  onClick={() => setIsWidgetOpen(true)}
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Open Widget Preview
                </Button>
              </TabsContent>
              <TabsContent value="embedded" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Embed the widget directly in your website with an iframe.
                </p>
                <div className="p-4 border rounded-md bg-muted/50">
                  <iframe
                    src={getWidgetUrl()}
                    style={{ width: '100%', height: '400px', border: 'none', borderRadius: '8px' }}
                    frameBorder="0"
                    allowFullScreen
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Export Codes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Export Codes</h4>
              <Badge variant="secondary">Copy & Paste</Badge>
            </div>
            
            <Tabs defaultValue="script" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="script">Script</TabsTrigger>
                <TabsTrigger value="iframe">iFrame</TabsTrigger>
                <TabsTrigger value="react">React</TabsTrigger>
                <TabsTrigger value="npm">NPM</TabsTrigger>
              </TabsList>
              
              <TabsContent value="script" className="space-y-2">
                <div className="relative">
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                    <code>{getEmbedCode()}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(getEmbedCode(), 'script')}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="iframe" className="space-y-2">
                <div className="relative">
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                    <code>{getEmbedCode().replace('<script', '<iframe').replace('</script>', '</iframe>')}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(getEmbedCode().replace('<script', '<iframe').replace('</script>', '</iframe>'), 'iframe')}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="react" className="space-y-2">
                <div className="relative">
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                    <code>{getReactCode()}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(getReactCode(), 'react')}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="npm" className="space-y-2">
                <div className="relative">
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                    <code>{getNpmCode()}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(getNpmCode(), 'npm')}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Widget URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Widget URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={getWidgetUrl()}
                readOnly
                className="flex-1 px-3 py-2 border rounded-md text-sm bg-muted/50"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(getWidgetUrl(), 'url')}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {isWidgetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[600px] mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Widget Preview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsWidgetOpen(false)}
              >
                ×
              </Button>
            </div>
            <div className="p-4">
              <iframe
                src={getWidgetUrl()}
                style={{ width: '100%', height: '500px', border: 'none', borderRadius: '8px' }}
                frameBorder="0"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
