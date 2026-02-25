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
  Check,
  Globe,
  Bot,
  Layers,
} from 'lucide-react'
import { PRODUCTS, formatPrice } from '@/lib/products'
import { createClient } from '@/lib/supabase/server'
import { AnimateOnScroll } from '@/components/animate-on-scroll'
import { LandingChatWidget } from '@/components/landing-chat-widget'

const VINTRA_LOGO = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/vintratext-skOk2ureyF4j9EWL7jotcLG1aD5kpr.png"

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Real-time Chat',
    description: 'Instant messaging with animated typing indicators, message reactions, and seamless conversation flow.',
  },
  {
    icon: Bot,
    title: 'AI-Powered Responses',
    description: 'Intelligent chatbot that understands context and provides helpful, natural-sounding responses.',
  },
  {
    icon: Palette,
    title: 'Glass Orb Avatars',
    description: 'Stunning animated avatars with particle physics, multiple themes, and interactive hover effects.',
  },
  {
    icon: Layers,
    title: 'Full Customization',
    description: 'Match your brand with custom colors, avatars, welcome messages, positioning, and more.',
  },
  {
    icon: Zap,
    title: 'Quick Replies',
    description: 'Pre-built suggestion chips help users get started quickly and improve engagement rates.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track conversations, response times, customer satisfaction, and engagement metrics.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Enterprise-grade security with encrypted data, row-level policies, and GDPR compliance.',
  },
  {
    icon: Globe,
    title: 'Multi-platform',
    description: 'Works on any website, mobile app, or platform with a single lightweight script tag.',
  },
]

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <img 
              src={VINTRA_LOGO} 
              alt="Vintra" 
              width={120} 
              height={40} 
              loading="eager"
              fetchPriority="high"
              className="h-8 w-auto"
            />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/chat-demo" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Demo
            </Link>
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
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <Link href="/admin">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Sign In</Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_70%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <AnimateOnScroll animation="fade" delay={0}>
            <Badge variant="secondary" className="mb-6 animate-glow-pulse">
              Live Chat Platform by Vintra
            </Badge>
          </AnimateOnScroll>

          <AnimateOnScroll animation="slide-up" delay={100}>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Build intelligent chatbots that{' '}
              <span className="text-primary">connect with your customers</span>
            </h1>
          </AnimateOnScroll>

          <AnimateOnScroll animation="slide-up" delay={200}>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              VintraStudio makes it effortless to create, customize, and deploy powerful chatbots. 
              Integrate with a single script and manage everything from an intuitive admin panel.
            </p>
          </AnimateOnScroll>

          <AnimateOnScroll animation="slide-up" delay={300}>
            <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link href="/auth/sign-up" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow">
                  Start Building Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/chat-demo" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Try Live Demo
                </Button>
              </Link>
              <Link href="#integration" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 bg-transparent">
                  <Code2 className="h-4 w-4" />
                  View Integration
                </Button>
              </Link>
            </div>
          </AnimateOnScroll>
        </div>

        {/* Key Benefits */}
        <div className="mx-auto mt-20 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
          {[
            { label: 'Setup Time', value: '2 min', icon: Zap },
            { label: 'Code Required', value: '1 line', icon: Code2 },
            { label: 'Uptime', value: '99.9%', icon: Shield },
          ].map((stat, i) => (
            <AnimateOnScroll key={stat.label} animation="scale" delay={400 + i * 100}>
              <div className="group flex flex-col items-center gap-2 text-center rounded-2xl border border-border/50 bg-card/50 p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
                <stat.icon className="h-8 w-8 text-primary transition-transform duration-300 group-hover:scale-110" />
                <span className="text-3xl font-bold text-foreground">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-border/50 bg-muted/20 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <AnimateOnScroll animation="slide-up" className="text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need to engage customers
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Powerful features designed to help you build better customer relationships
            </p>
          </AnimateOnScroll>

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, i) => (
              <AnimateOnScroll key={feature.title} animation="slide-up" delay={i * 80}>
                <Card className="group h-full border-border/40 bg-card/80 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary/20">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="mt-3 text-base">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section id="integration" className="border-t border-border/50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <AnimateOnScroll animation="slide-left">
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
                  ].map((item, i) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span className="text-sm text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="slide-right">
              <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-xl shadow-primary/5">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <div className="h-3 w-3 rounded-full bg-green-500/60" />
                  <span className="ml-2 text-xs text-muted-foreground font-mono">index.html</span>
                </div>
                <pre className="overflow-x-auto rounded-xl bg-muted/80 p-3 sm:p-4">
                  <code className="font-mono text-xs sm:text-sm text-foreground">
{`<!-- Vintra Chatbot Widget -->
<script 
  src="YOUR_DOMAIN/api/widget.js"
  data-chatbot-id="YOUR_CHATBOT_ID"
  async
></script>`}
                  </code>
                </pre>
                <p className="mt-4 text-xs text-muted-foreground">
                  Replace YOUR_DOMAIN and YOUR_CHATBOT_ID with values from your admin panel.
                </p>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="border-t border-border/50 bg-muted/20 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <AnimateOnScroll animation="slide-up" className="text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Start free and scale as you grow. No hidden fees.
            </p>
          </AnimateOnScroll>

          <div className="mt-16 grid gap-6 lg:grid-cols-3">
            {PRODUCTS.map((product, i) => (
              <AnimateOnScroll key={product.id} animation="slide-up" delay={i * 120}>
                <Card 
                  className={`relative flex flex-col h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    product.popular 
                      ? 'border-primary ring-2 ring-primary shadow-lg shadow-primary/10' 
                      : 'border-border/50 hover:border-primary/20 hover:shadow-primary/5'
                  }`}
                >
                  {product.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-sm">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-foreground">
                        {formatPrice(product.priceInCents)}
                      </span>
                      {product.priceInCents > 0 && product.interval && (
                        <span className="text-muted-foreground">/{product.interval}</span>
                      )}
                    </div>
                    <ul className="space-y-3">
                      {product.features.slice(0, 5).map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <Check className="h-5 w-5 shrink-0 text-primary" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Link 
                      href={
                        product.priceInCents === 0 
                          ? (user ? '/admin' : '/auth/sign-up')
                          : (user ? `/checkout/${product.id}` : `/auth/login?redirect=/checkout/${product.id}`)
                      } 
                      className="block"
                    >
                      <Button 
                        className={`w-full transition-all duration-200 ${
                          product.popular ? 'shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30' : ''
                        }`}
                        variant={product.popular ? 'default' : 'outline'}
                      >
                        {product.priceInCents === 0 
                          ? (user ? 'Go to Dashboard' : 'Get Started Free') 
                          : 'Subscribe'}
                      </Button>
                    </Link>
                  </div>
                </Card>
              </AnimateOnScroll>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/pricing" className="text-sm text-primary hover:underline">
              View full plan comparison
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-primary/20 bg-primary px-4 py-20 sm:px-6 lg:px-8">
        <AnimateOnScroll animation="scale" className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Ready to transform your customer engagement?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Start building your chatbot today. Free to get started, no credit card required.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={user ? '/admin' : '/auth/sign-up'}>
              <Button size="lg" variant="secondary" className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
                {user ? 'Go to Dashboard' : 'Get Started Free'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </AnimateOnScroll>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Link href="/" className="flex items-center">
              <img 
                src={VINTRA_LOGO} 
                alt="Vintra" 
                width={100} 
                height={32} 
                className="h-6 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} VintraStudio. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Live Chat Widget */}
      <LandingChatWidget />
    </div>
  )
}
