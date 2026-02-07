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
import { Loader2, Save, Bot, Clock, MessageCircle } from 'lucide-react'

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
}

export default function AppearancePage() {
  const [config, setConfig] = useState<ChatbotConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('chatbot_configs')
      .select('*')
      .eq('admin_id', user.id)
      .single()

    if (data) {
      setConfig(data)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!config) return
    setSaving(true)

    const supabase = createClient()
    await supabase
      .from('chatbot_configs')
      .update({
        widget_title: config.widget_title,
        welcome_message: config.welcome_message,
        primary_color: config.primary_color,
        position: config.position,
        show_branding: config.show_branding,
        offline_message: config.offline_message,
        placeholder_text: config.placeholder_text,
        launcher_text: config.launcher_text,
        launcher_text_enabled: config.launcher_text_enabled,
        business_hours_enabled: config.business_hours_enabled,
        business_hours: config.business_hours,
        business_hours_timezone: config.business_hours_timezone,
        outside_hours_message: config.outside_hours_message,
      })
      .eq('id', config.id)

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appearance</h1>
          <p className="text-muted-foreground">
            Customize how your chatbot looks and feels
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Settings</CardTitle>
              <CardDescription>
                Configure the basic appearance of your chat widget
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
                Adjust the visual style and positioning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="color">Primary Color</Label>
                <div className="flex gap-3">
                  <Input
                    id="color"
                    type="color"
                    value={config.primary_color}
                    onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                    className="h-10 w-16 cursor-pointer p-1"
                  />
                  <Input
                    value={config.primary_color}
                    onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                    placeholder="#14b8a6"
                    className="flex-1 font-mono"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Widget Position</Label>
                <Select
                  value={config.position}
                  onValueChange={(value) => setConfig({ ...config, position: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Branding</Label>
                  <p className="text-xs text-muted-foreground">
                    Display &quot;Powered by VintraStudio&quot;
                  </p>
                </div>
                <Switch
                  checked={config.show_branding}
                  onCheckedChange={(checked) => setConfig({ ...config, show_branding: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Launcher Text</CardTitle>
              </div>
              <CardDescription>
                Show a &quot;Talk to us&quot; label next to the chat button
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Launcher Text</Label>
                  <p className="text-xs text-muted-foreground">
                    Display text next to the chat bubble
                  </p>
                </div>
                <Switch
                  checked={config.launcher_text_enabled}
                  onCheckedChange={(checked) => setConfig({ ...config, launcher_text_enabled: checked })}
                />
              </div>
              {config.launcher_text_enabled && (
                <div className="space-y-2">
                  <Label htmlFor="launcher-text">Launcher Text</Label>
                  <Input
                    id="launcher-text"
                    value={config.launcher_text || ''}
                    onChange={(e) => setConfig({ ...config, launcher_text: e.target.value })}
                    placeholder="Talk to us"
                  />
                </div>
              )}
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
              See how your chat widget will look
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-lg border bg-muted/50 p-6" style={{ minHeight: '500px' }}>
              {/* Widget Preview */}
              <div 
                className={`absolute bottom-4 ${config.position === 'bottom-left' ? 'left-4' : 'right-4'}`}
              >
                {/* Chat Window */}
                <div 
                  className="mb-4 w-80 overflow-hidden rounded-xl shadow-2xl"
                  style={{ 
                    border: '1px solid hsl(var(--border))',
                  }}
                >
                  {/* Header */}
                  <div 
                    className="flex items-center gap-3 p-4 text-white"
                    style={{ backgroundColor: config.primary_color }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{config.widget_title}</h4>
                      <p className="text-xs opacity-80">Online</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="h-64 space-y-3 bg-background p-4">
                    <div 
                      className="max-w-[80%] rounded-lg rounded-tl-none p-3 text-sm text-white"
                      style={{ backgroundColor: config.primary_color }}
                    >
                      {config.welcome_message}
                    </div>
                  </div>

                  {/* Input */}
                  <div className="border-t bg-background p-3">
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
                      <input
                        type="text"
                        placeholder={config.placeholder_text}
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        disabled
                      />
                      <button
                        className="rounded-md p-1.5 text-white"
                        style={{ backgroundColor: config.primary_color }}
                        disabled
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </div>
                    {config.show_branding && (
                      <p className="mt-2 text-center text-xs text-muted-foreground">
                        Powered by VintraStudio
                      </p>
                    )}
                  </div>
                </div>

                {/* Launcher Button */}
                <div className={`flex flex-col ${config.position === 'bottom-left' ? 'items-start' : 'items-end'}`}>
                  <div className="relative inline-flex items-center justify-center">
                    {config.launcher_text_enabled && config.launcher_text && (
                      <svg
                        className="absolute -top-8 left-1/2 -translate-x-1/2"
                        width="130"
                        height="60"
                        viewBox="0 0 160 80"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <defs>
                          <path id="preview-curve" d="M 15,75 Q 80,-10 145,75" fill="none"/>
                        </defs>
                        <text>
                          <textPath
                            href="#preview-curve"
                            startOffset="50%"
                            textAnchor="middle"
                            style={{
                              fontSize: '14px',
                              fontWeight: 800,
                              fill: config.primary_color,
                              letterSpacing: '0.5px',
                            }}
                          >
                            {config.launcher_text}
                          </textPath>
                        </text>
                      </svg>
                    )}
                    <div 
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-lg"
                      style={{ backgroundColor: config.primary_color }}
                    >
                      <MessageCircle className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
