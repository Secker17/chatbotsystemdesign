'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  Save,
  Bot,
  Brain,
  Zap,
  MessageSquare,
  Shield,
  Sparkles,
  BookOpen,
  Settings2,
  ArrowLeftRight,
  Plus,
  X,
} from 'lucide-react'
import { UpgradeBanner } from '@/components/admin/upgrade-banner'
import type { PlanLimits } from '@/lib/products'

interface AIConfig {
  id: string
  ai_enabled: boolean
  ai_system_prompt: string | null
  ai_knowledge_base: string | null
  ai_model: string | null
  ai_temperature: number | null
  ai_max_tokens: number | null
  ai_auto_greet: boolean | null
  ai_greeting_message: string | null
  ai_handoff_keywords: string[] | null
}

const AI_MODELS = [
  { value: 'grok-3-mini', label: 'Grok 3 Mini', description: 'Fast and capable (Recommended)' },
  { value: 'grok-3', label: 'Grok 3', description: 'Most powerful xAI model' },
  { value: 'grok-2', label: 'Grok 2', description: 'Reliable xAI model' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast OpenAI model' },
  { value: 'gpt-4o', label: 'GPT-4o', description: 'Powerful OpenAI model' },
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', description: 'Latest small OpenAI model' },
  { value: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku', description: 'Fast Anthropic model' },
]

export default function AIConfigPage() {
  const [config, setConfig] = useState<AIConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')
  const [testMessage, setTestMessage] = useState('')
  const [testResponse, setTestResponse] = useState('')
  const [testing, setTesting] = useState(false)
  const [planId, setPlanId] = useState<string>('starter')
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null)

  useEffect(() => {
    loadConfig()
    loadPlan()
  }, [])

  const loadPlan = async () => {
    try {
      const res = await fetch('/api/plan')
      if (res.ok) {
        const data = await res.json()
        setPlanId(data.planId)
        setPlanLimits(data.limits)
      }
    } catch {
      // Default to starter
    }
  }

  const loadConfig = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('chatbot_configs')
      .select('id, ai_enabled, ai_system_prompt, ai_knowledge_base, ai_model, ai_temperature, ai_max_tokens, ai_auto_greet, ai_greeting_message, ai_handoff_keywords')
      .eq('admin_id', user.id)
      .single()

    if (data) {
      setConfig({
        ...data,
        ai_temperature: data.ai_temperature ?? 0.7,
        ai_max_tokens: data.ai_max_tokens ?? 500,
        ai_model: data.ai_model ?? 'grok-3-mini',
        ai_handoff_keywords: data.ai_handoff_keywords ?? ['human', 'agent', 'person', 'real person', 'speak to someone', 'menneske', 'snakke med noen'],
        ai_greeting_message: data.ai_greeting_message ?? 'Hi! I\'m an AI assistant. How can I help you today? If you\'d like to speak with a human, just let me know!',
        ai_system_prompt: data.ai_system_prompt ?? 'You are a helpful customer support assistant. Be friendly, professional, and concise. Help visitors with their questions and guide them to the right resources.',
      })
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!config) return
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('chatbot_configs')
      .update({
        ai_enabled: config.ai_enabled,
        ai_system_prompt: config.ai_system_prompt,
        ai_knowledge_base: config.ai_knowledge_base,
        ai_model: config.ai_model,
        ai_temperature: config.ai_temperature,
        ai_max_tokens: config.ai_max_tokens,
        ai_auto_greet: config.ai_auto_greet,
        ai_greeting_message: config.ai_greeting_message,
        ai_handoff_keywords: config.ai_handoff_keywords,
        updated_at: new Date().toISOString(),
      })
      .eq('id', config.id)

    if (error) {
      console.error('Save error:', error)
    }

    setSaving(false)
  }

  const addKeyword = () => {
    if (!newKeyword.trim() || !config) return
    const keywords = [...(config.ai_handoff_keywords || []), newKeyword.trim()]
    setConfig({ ...config, ai_handoff_keywords: keywords })
    setNewKeyword('')
  }

  const removeKeyword = (index: number) => {
    if (!config) return
    const keywords = [...(config.ai_handoff_keywords || [])]
    keywords.splice(index, 1)
    setConfig({ ...config, ai_handoff_keywords: keywords })
  }

  const handleTest = async () => {
    if (!testMessage.trim() || !config) return
    setTesting(true)
    setTestResponse('')

    try {
      // Create a temporary session for testing
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const res = await fetch('/api/chat/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testMessage,
          system_prompt: config.ai_system_prompt,
          knowledge_base: config.ai_knowledge_base,
          model: config.ai_model,
          temperature: config.ai_temperature,
          max_tokens: config.ai_max_tokens,
        }),
      })

      const data = await res.json()
      setTestResponse(data.reply || data.error || 'No response')
    } catch {
      setTestResponse('Failed to test. Make sure your AI configuration is saved.')
    }

    setTesting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!config) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Assistant</h1>
          <p className="text-muted-foreground">No chatbot configuration found.</p>
        </div>
      </div>
    )
  }

  const selectedModel = AI_MODELS.find(m => m.value === config.ai_model)

  // Check if plan allows AI
  if (planLimits && !planLimits.aiEnabled) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Assistant</h1>
          <p className="text-muted-foreground">
            Configure your AI chatbot to automatically respond to visitors
          </p>
        </div>
        <UpgradeBanner
          feature="AI Assistant"
          description="Upgrade to unlock AI-powered automatic responses for your chatbot visitors."
          requiredPlan="pro"
          currentPlan={planId}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Assistant</h1>
          <p className="text-muted-foreground">
            Configure your AI chatbot to automatically respond to visitors
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge 
            variant={config.ai_enabled ? 'default' : 'secondary'}
            className="text-sm"
          >
            {config.ai_enabled ? 'AI Enabled' : 'AI Disabled'}
          </Badge>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Settings Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Enable/Disable */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle>AI Auto-Responder</CardTitle>
                  <CardDescription>
                    Enable AI to automatically respond to visitor messages
                  </CardDescription>
                </div>
                <Switch
                  checked={config.ai_enabled}
                  onCheckedChange={(checked) => setConfig({ ...config, ai_enabled: checked })}
                />
              </div>
            </CardHeader>
            {config.ai_enabled && (
              <CardContent className="space-y-4 border-t pt-4">
                <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    When enabled, the AI will automatically answer visitor questions using your system prompt and knowledge base. Visitors can request a human agent at any time.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {config.ai_enabled && (
            <>
              {/* System Prompt */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>System Prompt</CardTitle>
                  </div>
                  <CardDescription>
                    Define the AI&apos;s personality, behavior, and how it should respond. This is the core instruction that shapes all responses.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={config.ai_system_prompt || ''}
                    onChange={(e) => setConfig({ ...config, ai_system_prompt: e.target.value })}
                    placeholder="You are a helpful customer support assistant for our company. Be friendly and professional..."
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Be specific about your brand voice, common questions, and how the AI should handle edge cases.
                  </p>
                </CardContent>
              </Card>

              {/* Knowledge Base */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Knowledge Base</CardTitle>
                  </div>
                  <CardDescription>
                    Add information about your products, services, FAQ, pricing, and policies. The AI will use this to answer questions accurately.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={config.ai_knowledge_base || ''}
                    onChange={(e) => setConfig({ ...config, ai_knowledge_base: e.target.value })}
                    placeholder={`Company: Acme Inc.
Products: Widget Pro ($49/mo), Widget Enterprise ($199/mo)
Support Hours: Mon-Fri 9am-5pm EST
Return Policy: 30-day money back guarantee
FAQ:
- Q: How do I reset my password? A: Go to Settings > Security > Reset Password
- Q: What payment methods do you accept? A: Visa, Mastercard, PayPal, and bank transfer`}
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    The more detailed your knowledge base, the better the AI can answer questions. Include pricing, features, policies, FAQs, etc.
                  </p>
                </CardContent>
              </Card>

              {/* Greeting Configuration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>AI Greeting</CardTitle>
                  </div>
                  <CardDescription>
                    Configure how the AI greets new visitors
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-greet visitors</Label>
                      <p className="text-xs text-muted-foreground">
                        Send an AI greeting when a new chat starts
                      </p>
                    </div>
                    <Switch
                      checked={config.ai_auto_greet || false}
                      onCheckedChange={(checked) => setConfig({ ...config, ai_auto_greet: checked })}
                    />
                  </div>
                  {config.ai_auto_greet && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <Label htmlFor="greeting">Greeting Message</Label>
                        <Textarea
                          id="greeting"
                          value={config.ai_greeting_message || ''}
                          onChange={(e) => setConfig({ ...config, ai_greeting_message: e.target.value })}
                          placeholder="Hi! I'm an AI assistant. How can I help you today?"
                          rows={3}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Handoff Keywords */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Human Handoff</CardTitle>
                  </div>
                  <CardDescription>
                    When a visitor uses one of these keywords, the AI will transfer them to a human agent. The AI will also proactively suggest handoff for complex issues.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {(config.ai_handoff_keywords || []).map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="gap-1 py-1.5 pl-3 pr-1.5">
                        {keyword}
                        <button
                          onClick={() => removeKeyword(index)}
                          className="ml-1 rounded-full p-0.5 hover:bg-muted"
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove {keyword}</span>
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Add a keyword..."
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    />
                    <Button variant="outline" onClick={addKeyword} disabled={!newKeyword.trim()}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">
                      <strong>How it works:</strong> When a visitor mentions any of these keywords, the AI bot will immediately hand off the conversation to a human agent. The visitor will see a message letting them know a human will be with them shortly.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {config.ai_enabled && (
            <>
              {/* Model Settings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Model Settings</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label>AI Model</Label>
                    <Select
                      value={config.ai_model || 'grok-3-mini'}
                      onValueChange={(value) => setConfig({ ...config, ai_model: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_MODELS.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            <div className="flex items-center gap-2">
                              <span>{model.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {model.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedModel && (
                      <p className="text-xs text-muted-foreground">{selectedModel.description}</p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Temperature</Label>
                      <span className="text-sm font-medium text-muted-foreground">
                        {config.ai_temperature?.toFixed(1)}
                      </span>
                    </div>
                    <Slider
                      value={[config.ai_temperature || 0.7]}
                      onValueChange={([value]) => setConfig({ ...config, ai_temperature: value })}
                      min={0}
                      max={2}
                      step={0.1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Lower = more focused and deterministic. Higher = more creative and varied.
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Max Tokens</Label>
                      <span className="text-sm font-medium text-muted-foreground">
                        {config.ai_max_tokens}
                      </span>
                    </div>
                    <Slider
                      value={[config.ai_max_tokens || 500]}
                      onValueChange={([value]) => setConfig({ ...config, ai_max_tokens: value })}
                      min={100}
                      max={2000}
                      step={50}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum length of AI responses. Higher values allow longer, more detailed answers.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Security Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Safety & Limits</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Zap className="mt-0.5 h-4 w-4 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      The AI will never share its system prompt or internal instructions with visitors.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap className="mt-0.5 h-4 w-4 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Automatic handoff to human agents for complex or sensitive issues.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap className="mt-0.5 h-4 w-4 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      All AI responses are logged and can be reviewed in the conversations panel.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap className="mt-0.5 h-4 w-4 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Visitors can always request a human agent at any time during the conversation.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Test Panel */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Test Your AI</CardTitle>
                  </div>
                  <CardDescription>
                    Send a test message to preview AI responses
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Type a test message..."
                    rows={3}
                  />
                  <Button
                    onClick={handleTest}
                    disabled={testing || !testMessage.trim()}
                    className="w-full"
                    variant="outline"
                  >
                    {testing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Test Response
                  </Button>
                  {testResponse && (
                    <div className="rounded-lg bg-muted p-3">
                      <p className="mb-1 text-xs font-medium text-muted-foreground">AI Response:</p>
                      <p className="whitespace-pre-wrap text-sm">{testResponse}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
