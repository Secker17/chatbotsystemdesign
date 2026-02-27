'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function ExportPage() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

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

  const environmentCode = `// .env.local
NEXT_PUBLIC_VINTRA_API_ENDPOINT=https://chat.vintrastudio.com
NEXT_PUBLIC_VINTRA_CHATBOT_ID=your-chatbot-id-here`

  const advancedCode = `<VintraChatWidget
  chatbotId="your-chatbot-id-here"
  apiEndpoint="https://your-custom-domain.com"
/>`

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-foreground">
            Vintra
          </Link>
          <Badge variant="secondary">Export Setup</Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground">Export Your Chat Widget</h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Embed your Vintra chatbot on your own website
            </p>
          </div>

          {/* Quick Start */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🚀</span> Quick Start
              </CardTitle>
              <CardDescription>
                Get your chat widget running in 3 simple steps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1 */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Step 1: Copy the Component</h3>
                <p className="text-sm text-muted-foreground">
                  Copy the <code className="rounded bg-muted px-1 py-0.5 font-mono">vintra-chat-widget.tsx</code> file from your Vintra project to your own website's components folder.
                </p>
              </div>

              {/* Step 2 */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Step 2: Add to Your Layout</h3>
                <p className="text-sm text-muted-foreground">
                  Import and add the component to your main layout or page. Your Vintra settings will automatically sync.
                </p>
                <div className="relative rounded-lg bg-zinc-900 p-4">
                  <pre className="overflow-x-auto text-xs text-zinc-100">
                    <code>{installationCode}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => handleCopy(installationCode, 0)}
                  >
                    {copiedIndex === 0 ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Step 3: Replace Chatbot ID</h3>
                <p className="text-sm text-muted-foreground">
                  Replace <code className="rounded bg-muted px-1 py-0.5 font-mono">YOUR_CHATBOT_ID_HERE</code> with your actual Vintra chatbot ID from the widget preview page.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>✨</span> Features
              </CardTitle>
              <CardDescription>
                Your widget comes with all these features built-in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 sm:grid-cols-2">
                {[
                  '🎨 Custom colors from your Vintra settings',
                  '📍 Configurable position (bottom-right/left)',
                  '💬 Quick reply buttons',
                  '👋 Welcome messages & greetings',
                  '🤖 AI-powered responses',
                  '⏰ Business hours support',
                  '📱 Mobile responsive',
                  '🔗 All settings sync from admin panel',
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🔧</span> Optional Configuration
              </CardTitle>
              <CardDescription>
                Store your chatbot ID in environment variables for better security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Add to your .env.local:</p>
                <div className="relative rounded-lg bg-zinc-900 p-4">
                  <pre className="overflow-x-auto text-xs text-zinc-100">
                    <code>{environmentCode}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => handleCopy(environmentCode, 1)}
                  >
                    {copiedIndex === 1 ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">Then use in your component:</p>
                <div className="relative rounded-lg bg-zinc-900 p-4">
                  <pre className="overflow-x-auto text-xs text-zinc-100">
                    <code>{`<VintraChatWidget
  chatbotId={process.env.NEXT_PUBLIC_VINTRA_CHATBOT_ID || ''}
  apiEndpoint={process.env.NEXT_PUBLIC_VINTRA_API_ENDPOINT}
/>`}</code>
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>⚙️</span> Advanced Usage
              </CardTitle>
              <CardDescription>
                Customize the API endpoint for self-hosted solutions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If you're hosting Vintra on your own domain, you can point to your custom endpoint:
              </p>
              <div className="relative rounded-lg bg-zinc-900 p-4">
                <pre className="overflow-x-auto text-xs text-zinc-100">
                  <code>{advancedCode}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => handleCopy(advancedCode, 2)}
                >
                  {copiedIndex === 2 ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>❓</span> Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                All chat widget settings can be changed in your Vintra admin dashboard. Changes sync automatically.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" asChild>
                  <Link href="/admin/appearance">
                    Appearance Settings
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/widget-preview">
                    Test Preview
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Back */}
          <div className="text-center">
            <Button variant="outline" asChild>
              <Link href="/admin">
                Back to Admin
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
