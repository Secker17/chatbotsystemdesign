'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, ExternalLink, Code } from 'lucide-react'
import Link from 'next/link'

export default function ExportPage() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const nextJsPageTemplate = `'use client'

import dynamic from 'next/dynamic'

const VintraChatEmbed = dynamic(
  () => import('@/components/vintra-chat-embed'),
  { ssr: false }
)

export default function ChatPage() {
  return <VintraChatEmbed chatbotId="YOUR_CHATBOT_ID" />
}`

  const htmlSnippet = `<!-- Add this script to any HTML page -->
<script>
  (function() {
    const chatbotId = 'YOUR_CHATBOT_ID'
    const apiEndpoint = 'https://chat.vintrastudio.com'
    
    // Create container
    const container = document.createElement('div')
    container.id = 'vintra-chat-widget'
    document.body.appendChild(container)
    
    // Load iframe
    const iframe = document.createElement('iframe')
    iframe.src = \`\${apiEndpoint}/embed/\${chatbotId}\`
    iframe.style.cssText = \`
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 400px;
      height: 600px;
      border: none;
      border-radius: 12px;
      box-shadow: 0 5px 40px rgba(0,0,0,0.16);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    \`
    container.appendChild(iframe)
  })()
</script>`

  const installationCode = `import VintraChatWidget from '@/components/vintra-chat-widget'

export default function App() {
  return (
    <>
      <YourContent />
      
      {/* Add the Vintra chat widget */}
      <VintraChatWidget chatbotId="YOUR_CHATBOT_ID_HERE" />
    </>
  )
}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <Link href="/" className="text-xl font-bold text-foreground">
            Vintra
          </Link>
          <p className="text-xs text-muted-foreground mt-1">Export & Integration Guide</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground">
            Embed Your Chat Widget
          </h1>
          <p className="text-lg text-muted-foreground mt-3">
            Multiple ways to add your Vintra chatbot to your website
          </p>
        </div>

        {/* Option 1: Next.js Page (Easiest) */}
        <Card className="mb-8 border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <Badge className="w-fit mb-2">Recommended for Next.js</Badge>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Option 1: Next.js Page Template
            </CardTitle>
            <CardDescription>
              Fastest way - copy this as a new page, no components folder needed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm mb-3">
                Create a new file at <code className="bg-muted px-2 py-1 rounded text-xs font-mono">app/chat/page.tsx</code> and paste:
              </p>
              <div className="relative rounded-lg bg-muted p-4 overflow-x-auto border border-border">
                <pre className="text-foreground text-xs font-mono">
                  <code>{nextJsPageTemplate}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => handleCopy(nextJsPageTemplate, 0)}
                >
                  {copiedIndex === 0 ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="bg-primary/10 dark:bg-primary/20 border border-primary/30 rounded-lg p-3">
              <p className="text-sm">
                <span className="font-semibold">Note:</span> You'll also need to copy <code className="bg-muted px-1 py-0.5 rounded text-xs">vintra-chat-embed.tsx</code> to your <code className="bg-muted px-1 py-0.5 rounded text-xs">components</code> folder
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Option 2: HTML/JavaScript (Universal) */}
        <Card className="mb-8">
          <CardHeader>
            <Badge className="w-fit mb-2">Works Everywhere</Badge>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Option 2: HTML/JavaScript Embed
            </CardTitle>
            <CardDescription>
              Add to any HTML page - WordPress, static sites, etc.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm mb-3">
                Add this script anywhere in your HTML page:
              </p>
              <div className="relative rounded-lg bg-muted p-4 overflow-x-auto border border-border">
                <pre className="text-foreground text-xs font-mono">
                  <code>{htmlSnippet}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => handleCopy(htmlSnippet, 1)}
                >
                  {copiedIndex === 1 ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="bg-accent/10 dark:bg-accent/20 border border-accent/30 rounded-lg p-3">
              <p className="text-sm">
                <span className="font-semibold">Note:</span> Replace both instances of <code className="bg-muted px-1 py-0.5 rounded text-xs">YOUR_CHATBOT_ID</code> with your actual ID
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Your Chatbot ID */}
        <Card className="mb-8 border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Your Chatbot ID</CardTitle>
            <CardDescription>
              Replace all <code className="bg-muted px-2 py-1 rounded text-xs">YOUR_CHATBOT_ID</code> with this value:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 bg-background p-3 rounded-lg border border-border">
              <code className="flex-1 font-mono text-sm font-semibold text-foreground">
                YOUR_CHATBOT_ID
              </code>
              <Button
                onClick={() => handleCopy('YOUR_CHATBOT_ID', 'id')}
                size="icon"
                variant="outline"
              >
                {copiedIndex === 'id' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Find this on your Widget Preview page or in the admin dashboard
            </p>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Built-in Features</CardTitle>
            <CardDescription>
              Your widget automatically includes:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: '🎨', text: 'Custom colors from admin panel' },
                { icon: '📍', text: 'Configurable position' },
                { icon: '💬', text: 'Quick reply buttons' },
                { icon: '👋', text: 'Welcome & greeting messages' },
                { icon: '🤖', text: 'AI-powered responses' },
                { icon: '⏰', text: 'Business hours support' },
                { icon: '📱', text: 'Mobile responsive' },
                { icon: '🔄', text: 'Auto-syncs with admin settings' },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-lg">{feature.icon}</span>
                  <span className="text-muted-foreground">{feature.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Configuration Guide */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Changing Settings</CardTitle>
            <CardDescription>
              No code changes needed - manage everything from admin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold">To customize your chat widget:</p>
              <ol className="text-sm text-muted-foreground space-y-2 ml-4 list-decimal">
                <li>Go to your Vintra Admin Dashboard</li>
                <li>Click "Appearance" → modify any settings</li>
                <li>Changes apply instantly to all embedded widgets</li>
              </ol>
            </div>
            <Button asChild variant="outline">
              <Link href="/admin/appearance">
                Go to Appearance Settings
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/widget-preview">
                Widget Preview
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin">
                Admin Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/conversations">
                View Messages
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
