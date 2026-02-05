import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Zap, 
  Shield, 
  BarChart3, 
  Palette, 
  Code2, 
  ArrowRight,
  CheckCircle2,
  Bot,
  Users,
  Globe
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">VintraStudio</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Features
            </Link>
            <Link href="#integration" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Integration
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent via-background to-background" />
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6">
            Now with AI-powered responses
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Build intelligent chatbots that 
            <span className="text-primary"> connect with your customers</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            VintraStudio makes it effortless to create, customize, and deploy powerful chatbots. 
            Integrate with a single script and manage everything from an intuitive admin panel.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth/sign-up">
              <Button size="lg" className="gap-2">
                Start Building Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#integration">
              <Button variant="outline" size="lg" className="gap-2 bg-transparent">
                <Code2 className="h-4 w-4" />
                View Integration
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-20 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
          {[
            { label: 'Active Chatbots', value: '50K+', icon: Bot },
            { label: 'Messages Processed', value: '10M+', icon: MessageSquare },
            { label: 'Happy Customers', value: '5K+', icon: Users },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-2 text-center">
              <stat.icon className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold text-foreground">{stat.value}</span>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need to engage customers
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Powerful features designed to help you build better customer relationships
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: MessageSquare,
                title: 'Real-time Chat',
                description: 'Instant messaging with typing indicators, read receipts, and seamless conversation flow.',
              },
              {
                icon: Palette,
                title: 'Full Customization',
                description: 'Match your brand with custom colors, avatars, welcome messages, and positioning.',
              },
              {
                icon: Zap,
                title: 'Canned Responses',
                description: 'Save time with pre-built responses for common questions and scenarios.',
              },
              {
                icon: BarChart3,
                title: 'Analytics Dashboard',
                description: 'Track conversations, response times, and customer satisfaction metrics.',
              },
              {
                icon: Shield,
                title: 'Secure & Private',
                description: 'Enterprise-grade security with encrypted data and GDPR compliance.',
              },
              {
                icon: Globe,
                title: 'Multi-platform',
                description: 'Works on any website, mobile app, or platform with our universal script.',
              },
            ].map((feature) => (
              <Card key={feature.title} className="border-border/50 bg-card transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                    <feature.icon className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <CardTitle className="mt-4 text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section id="integration" className="border-t px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="secondary" className="mb-4">Easy Integration</Badge>
              <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Add to your site in seconds
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Just copy and paste one line of code. Our lightweight script loads asynchronously 
                and won&apos;t slow down your website.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Works with any website or framework',
                  'Automatic updates and improvements',
                  'No dependencies required',
                  'Under 30KB gzipped',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <div className="h-3 w-3 rounded-full bg-green-500/60" />
                <span className="ml-2 text-xs text-muted-foreground">index.html</span>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-muted p-4">
                <code className="font-mono text-sm text-foreground">
{`<!-- VintraStudio Chatbot -->
<script 
  src="https://cdn.vintrastudio.com/widget.js"
  data-chatbot-id="YOUR_CHATBOT_ID"
  async
></script>`}
                </code>
              </pre>
              <p className="mt-4 text-xs text-muted-foreground">
                Replace YOUR_CHATBOT_ID with your unique identifier from the admin panel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-primary px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Ready to transform your customer engagement?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Join thousands of businesses using VintraStudio to connect with their customers.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth/sign-up">
              <Button size="lg" variant="secondary" className="gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">VintraStudio</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} VintraStudio. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
