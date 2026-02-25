'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save, Bot, Clock, MessageCircle, Headset, MessageSquare, Heart, SmilePlus, Upload, Code, Lock, X, ImageIcon, Sparkles, Globe, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { PlanLimits } from '@/lib/products'
import ColorPicker, { DEFAULT_COLOR_CATEGORIES } from '@/components/color-picker'
import AdminThemePicker from '@/components/admin-theme-picker'
import { useWorkspace } from '@/components/admin/workspace-provider'
import ChatInterface from '@/components/chat-interface'
import GlassOrbAvatar from '@/components/glass-orb-avatar'

interface DaySchedule {
  enabled: boolean
  start: string
  end: string
}

interface BusinessHours {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { enabled: true, start: '09:00', end: '17:00' },
  tuesday: { enabled: true, start: '09:00', end: '17:00' },
  wednesday: { enabled: true, start: '09:00', end: '17:00' },
  thursday: { enabled: true, start: '09:00', end: '17:00' },
  friday: { enabled: true, start: '09:00', end: '17:00' },
  saturday: { enabled: false, start: '09:00', end: '17:00' },
  sunday: { enabled: false, start: '09:00', end: '17:00' },
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const

const TIMEZONES = [
  { value: 'Europe/Oslo', label: 'Oslo (CET/CEST)' },
  { value: 'Europe/Stockholm', label: 'Stockholm (CET/CEST)' },
  { value: 'Europe/Helsinki', label: 'Helsinki (EET/EEST)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
  { value: 'America/Denver', label: 'Denver (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
]

const ICON_OPTIONS = [
  { value: 'chat', label: 'Chat Bubble', icon: MessageCircle },
  { value: 'headset', label: 'Headset', icon: Headset },
  { value: 'support', label: 'Support', icon: SmilePlus },
  { value: 'message', label: 'Message', icon: MessageSquare },
  { value: 'heart', label: 'Heart', icon: Heart },
  { value: 'robot', label: 'Robot', icon: Bot },
  { value: 'glass-orb', label: 'Glass Orb', icon: Sparkles, animated: true },
] as const

type IconMode = 'preset' | 'upload' | 'svg' | 'code'

function getIconMode(avatarUrl: string | null): IconMode {
  if (!avatarUrl) return 'preset'
  if (avatarUrl.startsWith('data:')) return 'upload'
  if (avatarUrl.startsWith('svg:')) return 'svg'
  if (avatarUrl.startsWith('code:')) return 'code'
  return 'preset'
}

function getIconStyle(avatarUrl: string | null): string {
  if (avatarUrl && avatarUrl.startsWith('icon:')) {
    return avatarUrl.replace('icon:', '')
  }
  return 'chat'
}

interface ChatbotConfig {
  id: string
  widget_title: string
  welcome_message: string
  primary_color: string
  position: string
  avatar_url: string | null
  show_branding: boolean
  offline_message: string
  placeholder_text: string
  launcher_text: string | null
  launcher_text_enabled: boolean
  business_hours_enabled: boolean
  business_hours: BusinessHours | null
  business_hours_timezone: string | null
  outside_hours_message: string | null
  // Landing widget fields
  is_landing_widget: boolean
  landing_widget_enabled: boolean
  quick_replies: string[] | null
  greeting_message: string | null
  greeting_subtext: string | null
}

export default function AppearancePage() {
  const { activeWorkspaceId } = useWorkspace()
  const [configs, setConfigs] = useState<ChatbotConfig[]>([])
  const [activeConfigIndex, setActiveConfigIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null)

  const config = configs[activeConfigIndex] ?? null

  const setConfig = (updated: ChatbotConfig) => {
    setConfigs(prev => prev.map((c, i) => i === activeConfigIndex ? updated : c))
  }

  useEffect(() => {
    loadConfig()
    fetch('/api/plan').then(r => r.json()).then(d => {
      setPlanLimits(d.limits)
    }).catch(() => {})
  }, [])

  const loadConfig = async () => {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      // Use mock data in development mode
      const mockConfigs: ChatbotConfig[] = [
        {
          id: 'dev-chatbot-landing',
          widget_title: 'Chat with us',
          welcome_message: 'Hi! How can we help you today?',
          primary_color: '#eab308',
          position: 'bottom-right',
          avatar_url: null,
          show_branding: true,
          offline_message: 'We are currently offline. Leave a message!',
          placeholder_text: 'Type your message...',
          launcher_text: 'Talk to us',
          launcher_text_enabled: true,
          business_hours_enabled: false,
          business_hours: DEFAULT_BUSINESS_HOURS,
          business_hours_timezone: 'Europe/Oslo',
          outside_hours_message: null,
          is_landing_widget: true,
          landing_widget_enabled: true,
          quick_replies: ['What features do you offer?', 'Tell me about pricing'],
          greeting_message: 'Hi there!',
          greeting_subtext: 'How can I help you today?',
        },
        {
          id: 'dev-chatbot-demo',
          widget_title: 'Chat Demo Bot',
          welcome_message: 'Welcome to the demo!',
          primary_color: '#6366f1',
          position: 'bottom-right',
          avatar_url: null,
          show_branding: true,
          offline_message: 'We are currently offline.',
          placeholder_text: 'Type your message...',
          launcher_text: 'Chat with us',
          launcher_text_enabled: true,
          business_hours_enabled: false,
          business_hours: DEFAULT_BUSINESS_HOURS,
          business_hours_timezone: 'Europe/Oslo',
          outside_hours_message: null,
          is_landing_widget: false,
          landing_widget_enabled: false,
          quick_replies: ['Show me a demo', 'What can you do?'],
          greeting_message: 'Welcome!',
          greeting_subtext: 'Try out our features here.',
        },
      ]
      setConfigs(mockConfigs)
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // First try to fetch with all columns
    let { data, error } = await supabase
      .from('chatbot_configs')
      .select('*')
      .eq('admin_id', activeWorkspaceId)

    if (error) {
      // Fallback: fetch only core columns if new columns don't exist yet
      const fallback = await supabase
        .from('chatbot_configs')
        .select('id, widget_title, welcome_message, primary_color, position, avatar_url, show_branding, offline_message, placeholder_text, launcher_text, launcher_text_enabled, business_hours_enabled, business_hours, business_hours_timezone, outside_hours_message')
        .eq('admin_id', activeWorkspaceId)

      data = (fallback.data || []).map((c) => ({
        ...c,
        is_landing_widget: false,
        landing_widget_enabled: false,
        quick_replies: null,
        greeting_message: 'Hi there!',
        greeting_subtext: 'How can I help you today?',
      })) as ChatbotConfig[]
    }

    if (data && data.length > 0) {
      // Sort: landing widget first
      const sorted = [...data].sort((a, b) => {
        if (a.is_landing_widget && !b.is_landing_widget) return -1
        if (!a.is_landing_widget && b.is_landing_widget) return 1
        return 0
      })
      setConfigs(sorted)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!config) return
    
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      // In dev mode, just show success but don't actually save
      toast.success('Appearance settings saved (Development Mode - not actually saved)')
      setSaving(false)
      return
    }
    
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('chatbot_configs')
      .update({
        widget_title: config.widget_title,
        welcome_message: config.welcome_message,
        primary_color: config.primary_color,
        position: config.position,
        avatar_url: config.avatar_url,
        show_branding: config.show_branding,
        offline_message: config.offline_message,
        placeholder_text: config.placeholder_text,
        business_hours_enabled: config.business_hours_enabled,
        business_hours: config.business_hours,
        business_hours_timezone: config.business_hours_timezone,
        outside_hours_message: config.outside_hours_message,
        landing_widget_enabled: config.landing_widget_enabled,
        quick_replies: config.quick_replies,
        greeting_message: config.greeting_message,
        greeting_subtext: config.greeting_subtext,
        updated_at: new Date().toISOString(),
      })
      .eq('id', config.id)

    if (error) {
      toast.error('Failed to save appearance settings')
    } else {
      toast.success('Appearance settings saved successfully')
    }

    setSaving(false)
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
          <h1 className="text-2xl font-bold text-foreground">Appearance</h1>
          <p className="text-muted-foreground">
            No chatbot configuration found. Please contact support.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Appearance</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Customize how your chatbot looks and feels
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-fit">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Multi-Chatbot Selector */}
      {configs.length > 1 && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-1.5 overflow-x-auto">
          {configs.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setActiveConfigIndex(i)}
              className={`
                flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200
                ${i === activeConfigIndex
                  ? 'bg-card text-foreground shadow-sm border border-border/60'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                }
              `}
            >
              <span
                className="h-3 w-3 rounded-full shrink-0 ring-1 ring-border/30"
                style={{ backgroundColor: c.primary_color }}
              />
              <span>{c.widget_title || 'Untitled'}</span>
              {c.is_landing_widget && (
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <Globe className="h-3 w-3" />
                  Landing
                </span>
              )}
              {!c.is_landing_widget && (
                <span className="ml-1 inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                  <MessageSquare className="h-3 w-3 mr-0.5" />
                  Demo
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Admin Panel Theme */}
        <AdminThemePicker />

        {/* Chatbot Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Settings</CardTitle>
              <CardDescription>
                Configure basic appearance of your chat widget
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Widget Title</Label>
                <Input
                  id="title"
                  value={config.widget_title}
                  onChange={(e) => setConfig({ ...config, widget_title: e.target.value })}
                  placeholder="Chat with us"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="welcome">Welcome Message</Label>
                <Textarea
                  id="welcome"
                  value={config.welcome_message}
                  onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })}
                  placeholder="Hi! How can we help you today?"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="placeholder">Input Placeholder</Label>
                <Input
                  id="placeholder"
                  value={config.placeholder_text}
                  onChange={(e) => setConfig({ ...config, placeholder_text: e.target.value })}
                  placeholder="Type your message..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offline">Offline Message</Label>
                <Textarea
                  id="offline"
                  value={config.offline_message}
                  onChange={(e) => setConfig({ ...config, offline_message: e.target.value })}
                  placeholder="We're currently offline. Leave a message!"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Style & Position</CardTitle>
              <CardDescription>
                Adjust visual style and positioning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="position">Widget Position</Label>
                <Select
                  value={config.position}
                  onValueChange={(value) => setConfig({ ...config, position: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="top-left">Top Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Branding</Label>
                  <p className="text-xs text-muted-foreground">
                    Display &quot;Powered by VintraStudio&quot;
                  </p>
                  {!planLimits?.removeBranding && (
                    <p className="text-xs font-medium text-amber-600">
                      Business plan required to remove branding
                    </p>
                  )}
                </div>
                <Switch
                  checked={config.show_branding}
                  onCheckedChange={(checked) => setConfig({ ...config, show_branding: checked })}
                  disabled={!planLimits?.removeBranding}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Launcher Icon</CardTitle>
              </div>
              <CardDescription>
                Choose the icon style for your chat launcher button
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Preset icons */}
              <div className="grid grid-cols-3 gap-3">
                {ICON_OPTIONS.map((option) => {
                  const mode = getIconMode(config.avatar_url)
                  const isSelected = mode === 'preset' && getIconStyle(config.avatar_url) === option.value
                  const IconComponent = option.icon
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setConfig({ ...config, avatar_url: `icon:${option.value}` })}
                      className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                      }`}
                    >

                      <div
                        className="relative flex h-10 w-10 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: option.value === 'glass-orb' ? 'transparent' : config.primary_color }}
                      >
                        {option.value === 'glass-orb' ? (
                          <GlassOrbAvatar
                            sender="bot"
                            size={40}
                            skin="default"
                            style={{}}
                            className=""
                          />
                        ) : (
                          <IconComponent className="h-5 w-5" />
                        )}
                      </div>
                      <span className={`text-xs font-medium ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                        {option.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Custom icon - Pro+ only */}
              <div className="relative rounded-lg border-2 border-dashed border-border p-4">
                {!planLimits?.fullCustomization && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-[1px]">
                    <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">
                      <Lock className="h-4 w-4" />
                      Pro plan required
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  <p className="text-sm font-medium text-foreground">Custom Icon</p>

                  {/* Upload image */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Upload className="h-3.5 w-3.5" />
                      Upload Image
                    </Label>
                    {getIconMode(config.avatar_url) === 'upload' ? (
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full"
                          style={{ backgroundColor: config.primary_color }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={config.avatar_url || ''}
                            alt="Custom icon"
                            className="h-7 w-7 object-contain"
                            style={{ filter: 'brightness(0) invert(1)' }}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfig({ ...config, avatar_url: 'icon:chat' })}
                        >
                          <X className="mr-1 h-3 w-3" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/60 ${
                          !planLimits?.fullCustomization ? 'pointer-events-none' : ''
                        }`}
                      >
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Choose an image (PNG, SVG, max 64KB)
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/svg+xml,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            if (file.size > 65536) {
                              toast.error('Image is too large. Max size is 64KB.')
                              return
                            }
                            const reader = new FileReader()
                            reader.onload = () => {
                              const result = reader.result as string
                              setConfig({ ...config, avatar_url: result })
                              toast.success('Custom icon uploaded')
                            }
                            reader.readAsDataURL(file)
                            e.target.value = ''
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Custom SVG code */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Code className="h-3.5 w-3.5" />
                      Custom SVG Code
                    </Label>
                    {getIconMode(config.avatar_url) === 'svg' ? (
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-white [&_svg]:h-6 [&_svg]:w-6 [&_svg]:fill-white"
                          style={{ backgroundColor: config.primary_color }}
                          dangerouslySetInnerHTML={{ __html: config.avatar_url?.replace('svg:', '') || '' }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfig({ ...config, avatar_url: 'icon:chat' })}
                        >
                          <X className="mr-1 h-3 w-3" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <Textarea
                        placeholder={'<svg viewBox="0 0 24 24"><path d="..."/></svg>'}
                        rows={3}
                        className={`font-mono text-xs ${!planLimits?.fullCustomization ? 'pointer-events-none' : ''}`}
                        onBlur={(e) => {
                          const val = e.target.value.trim()
                          if (!val) return
                          if (!val.startsWith('<svg') || !val.includes('</svg>')) {
                            toast.error('Please enter valid SVG code starting with <svg> and ending with </svg>')
                            return
                          }
                          if (val.length > 4096) {
                            toast.error('SVG code is too long. Max 4KB.')
                            return
                          }
                          setConfig({ ...config, avatar_url: `svg:${val}` })
                          e.target.value = ''
                          toast.success('Custom SVG icon applied')
                        }}
                      />
                    )}
                  </div>

                  {/* Custom HTML/JS Code */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Code className="h-3.5 w-3.5" />
                      Custom Code (HTML / CSS / JS)
                    </Label>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Paste HTML/CSS/JS code for an animated or interactive launcher icon. The code runs inside an isolated iframe on the launcher button. Use vanilla JS (no React).
                    </p>
                    {getIconMode(config.avatar_url) === 'code' ? (
                      <div className="flex items-center gap-3">
                        <div
                          className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full"
                          style={{ backgroundColor: config.primary_color }}
                        >
                          <iframe
                            srcDoc={config.avatar_url?.replace('code:', '') || ''}
                            sandbox="allow-scripts"
                            className="pointer-events-none h-full w-full rounded-full border-0"
                            title="Custom icon preview"
                            style={{ background: 'transparent' }}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-foreground">Custom code active</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfig({ ...config, avatar_url: 'icon:chat' })}
                          >
                            <X className="mr-1 h-3 w-3" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Textarea
                        placeholder={`<html>\n<style>\n  body { margin:0; background:transparent; }\n  canvas { width:100%; height:100%; }\n</style>\n<body>\n  <canvas id="c"></canvas>\n  <script>\n    // Your animation code here\n  </script>\n</body>\n</html>`}
                        rows={6}
                        className={`font-mono text-xs ${!planLimits?.fullCustomization ? 'pointer-events-none' : ''}`}
                        onBlur={(e) => {
                          const val = e.target.value.trim()
                          if (!val) return
                          if (val.length > 50000) {
                            toast.error('Code is too long. Max 50KB.')
                            return
                          }
                          setConfig({ ...config, avatar_url: `code:${val}` })
                          e.target.value = ''
                          toast.success('Custom code icon applied')
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Greeting Bubble</CardTitle>
              </div>
              <CardDescription>
                A popup bubble that appears above the chat button to invite visitors to chat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="greeting-msg">Greeting Title</Label>
                <Input
                  id="greeting-msg"
                  value={config.greeting_message || ''}
                  onChange={(e) => setConfig({ ...config, greeting_message: e.target.value })}
                  placeholder="Hi there!"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="greeting-sub">Greeting Subtext</Label>
                <Input
                  id="greeting-sub"
                  value={config.greeting_subtext || ''}
                  onChange={(e) => setConfig({ ...config, greeting_subtext: e.target.value })}
                  placeholder="How can I help you today?"
                />
              </div>
            </CardContent>
          </Card>



          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Business Hours</CardTitle>
              </div>
              <CardDescription>
                Set when the chatbot is online. Outside these hours, visitors see an offline message.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Business Hours</Label>
                  <p className="text-xs text-muted-foreground">
                    Bot will appear offline outside scheduled hours
                  </p>
                </div>
                <Switch
                  checked={config.business_hours_enabled}
                  onCheckedChange={(checked) => {
                    const updates: Partial<ChatbotConfig> = { business_hours_enabled: checked }
                    if (checked && !config.business_hours) {
                      updates.business_hours = DEFAULT_BUSINESS_HOURS
                    }
                    if (checked && !config.business_hours_timezone) {
                      updates.business_hours_timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
                    }
                    setConfig({ ...config, ...updates })
                  }}
                />
              </div>
              {config.business_hours_enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select
                      value={config.business_hours_timezone || 'Europe/London'}
                      onValueChange={(value) => setConfig({ ...config, business_hours_timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label>Schedule</Label>
                    {DAYS_OF_WEEK.map(({ key, label }) => {
                      const hours = config.business_hours || DEFAULT_BUSINESS_HOURS
                      const day = hours[key]
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <Switch
                            checked={day.enabled}
                            onCheckedChange={(checked) => {
                              const updated = { ...hours, [key]: { ...day, enabled: checked } }
                              setConfig({ ...config, business_hours: updated })
                            }}
                          />
                          <span className="w-24 text-sm font-medium">{label}</span>
                          {day.enabled ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="time"
                                value={day.start}
                                onChange={(e) => {
                                  const updated = { ...hours, [key]: { ...day, start: e.target.value } }
                                  setConfig({ ...config, business_hours: updated })
                                }}
                                className="w-28"
                              />
                              <span className="text-sm text-muted-foreground">to</span>
                              <Input
                                type="time"
                                value={day.end}
                                onChange={(e) => {
                                  const updated = { ...hours, [key]: { ...day, end: e.target.value } }
                                  setConfig({ ...config, business_hours: updated })
                                }}
                                className="w-28"
                              />
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Closed</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="outside-hours-msg">Outside Hours Message</Label>
                    <Textarea
                      id="outside-hours-msg"
                      value={config.outside_hours_message || ''}
                      onChange={(e) => setConfig({ ...config, outside_hours_message: e.target.value })}
                      placeholder="We're currently offline. Our business hours are Mon-Fri 9am-5pm. Leave a message and we'll get back to you!"
                      rows={2}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              See how your chat widget will look — this is the real widget
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-lg border bg-muted/50 overflow-hidden" style={{ minHeight: '600px', transform: 'translateZ(0)' }}>
              <ChatInterface
                chatbotId="preview"
                primaryColor={config.primary_color}
                avatarStyle={
                  getIconStyle(config.avatar_url) === 'glass-orb'
                    ? 'glass-orb'
                    : 'default'
                }
                position={config.position as 'bottom-right' | 'bottom-left'}
                widgetTitle={config.widget_title}
                welcomeMessage={config.welcome_message}
                placeholderText={config.placeholder_text}
                showBranding={config.show_branding}
                quickReplies={config.quick_replies || undefined}
                greetingMessage={config.greeting_message || undefined}
                greetingSubtext={config.greeting_subtext || undefined}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
