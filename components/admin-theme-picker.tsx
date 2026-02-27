'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, Palette, RotateCcw, Check, Zap, Coffee, Sparkles, Shield, Gauge, Smile } from 'lucide-react'
import { toast } from 'sonner'

interface AdminTheme {
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  accent: string
  accentForeground: string
  background: string
  foreground: string
  card: string
  cardForeground: string
  border: string
  muted: string
  mutedForeground: string
  sidebarBackground: string
  sidebarForeground: string
  sidebarPrimary: string
  sidebarPrimaryForeground: string
  sidebarAccent: string
  sidebarAccentForeground: string
  sidebarBorder: string
  animationPreset: string
}

// ─── Animation presets: inject real CSS into <head> ───────────────────────
interface AnimationPreset {
  id: string
  name: string
  emoji: string
  description: string
  detail: string
  css: string
}

const ANIMATION_PRESETS: AnimationPreset[] = [
  {
    id: 'professional',
    name: 'Professional',
    emoji: '🎯',
    description: 'Calm and efficient',
    detail: 'Subtle transitions – nothing distracts you from work',
    css: `
      /* PROFESSIONAL – subtle, fast, business-like */
      button, a[role="button"], [data-slot="sidebar-menu-button"] {
        transition: opacity 0.15s ease, background-color 0.15s ease, border-color 0.15s ease !important;
      }
      button:hover:not(:disabled), a[role="button"]:hover {
        opacity: 0.88;
      }
      button:active:not(:disabled) {
        opacity: 0.72;
        transform: none;
      }
      [data-slot="card"] {
        transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
      }
      [data-slot="card"]:hover {
        box-shadow: 0 2px 8px rgba(0,0,0,0.18);
      }
      a {
        transition: opacity 0.15s ease !important;
      }
      a:hover {
        opacity: 0.75;
      }
    `,
  },
  {
    id: 'smooth',
    name: 'Smooth',
    emoji: '🌊',
    description: 'Flowing and relaxed',
    detail: 'Soft ease-out curves on everything – like butter',
    css: `
      /* SMOOTH – slow ease-out everything */
      *, *::before, *::after {
        transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1) !important;
      }
      button, a[role="button"], [data-slot="sidebar-menu-button"] {
        transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1) !important;
      }
      button:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.2);
      }
      button:active:not(:disabled) {
        transform: translateY(0px);
        box-shadow: none;
      }
      [data-slot="card"] {
        transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1) !important;
      }
      [data-slot="card"]:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 32px rgba(0,0,0,0.2);
      }
      a {
        transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1) !important;
      }
    `,
  },
  {
    id: 'snappy',
    name: 'Snappy',
    emoji: '⚡',
    description: 'Fast and responsive',
    detail: 'Instant feedback – everything reacts instantly',
    css: `
      /* SNAPPY – instant, spring-like */
      button, a[role="button"], [data-slot="sidebar-menu-button"] {
        transition: transform 0.08s cubic-bezier(0.34, 1.56, 0.64, 1),
                    background-color 0.08s ease,
                    box-shadow 0.08s ease !important;
      }
      button:hover:not(:disabled), a[role="button"]:hover {
        transform: scale(1.03);
      }
      button:active:not(:disabled) {
        transform: scale(0.96);
        transition-duration: 0.05s !important;
      }
      [data-slot="sidebar-menu-button"]:hover {
        transform: translateX(3px) !important;
      }
      [data-slot="card"] {
        transition: transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.1s ease !important;
      }
      [data-slot="card"]:hover {
        transform: scale(1.01);
        box-shadow: 0 8px 24px rgba(0,0,0,0.22);
      }
      a:not([role="button"]) {
        transition: color 0.08s ease !important;
      }
    `,
  },
  {
    id: 'bouncy',
    name: 'Playful',
    emoji: '🎉',
    description: 'Playful and energetic',
    detail: 'Spring animations with bounce – keeps the mood up',
    css: `
      /* BOUNCY – spring physics, playful */
      @keyframes admin-bounce-in {
        0%   { transform: scale(1); }
        40%  { transform: scale(1.12); }
        70%  { transform: scale(0.96); }
        100% { transform: scale(1.05); }
      }
      @keyframes admin-press {
        0%   { transform: scale(1); }
        50%  { transform: scale(0.88); }
        100% { transform: scale(1); }
      }
      button, a[role="button"] {
        transition: box-shadow 0.2s ease !important;
      }
      button:hover:not(:disabled) {
        animation: admin-bounce-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        box-shadow: 0 6px 20px rgba(0,0,0,0.25);
      }
      button:active:not(:disabled) {
        animation: admin-press 0.15s ease forwards;
      }
      [data-slot="sidebar-menu-button"]:hover {
        animation: admin-bounce-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important;
      }
      [data-slot="card"] {
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease !important;
      }
      [data-slot="card"]:hover {
        transform: rotate(-0.5deg) scale(1.02);
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      }
      a:not([role="button"]):hover {
        letter-spacing: 0.01em;
        transition: letter-spacing 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
      }
    `,
  },
  {
    id: 'glow',
    name: 'Neon Glow',
    emoji: '✨',
    description: 'Glow and light effects',
    detail: 'Primary color glow on hover – perfect for dark themes',
    css: `
      /* GLOW – neon glow effects using currentColor */
      :root {
        --glow-color: var(--primary);
      }
      button[class*="bg-primary"]:hover, 
      a[role="button"]:hover {
        box-shadow: 0 0 0 2px hsl(var(--primary) / 0.3),
                    0 0 16px hsl(var(--primary) / 0.5),
                    0 0 32px hsl(var(--primary) / 0.2) !important;
        transition: box-shadow 0.3s ease, transform 0.2s ease !important;
        transform: translateY(-1px);
      }
      button:not([class*="bg-primary"]):hover:not(:disabled) {
        box-shadow: 0 0 8px hsl(var(--primary) / 0.25),
                    0 0 20px hsl(var(--primary) / 0.1) !important;
        border-color: hsl(var(--primary) / 0.5) !important;
        transition: all 0.3s ease !important;
      }
      button:active:not(:disabled) {
        transform: scale(0.97);
        box-shadow: 0 0 4px hsl(var(--primary) / 0.6) !important;
      }
      [data-slot="sidebar-menu-button"]:hover {
        box-shadow: inset 3px 0 0 hsl(var(--sidebar-primary)),
                    4px 0 12px hsl(var(--sidebar-primary) / 0.3) !important;
        transition: all 0.25s ease !important;
      }
      [data-slot="card"]:hover {
        box-shadow: 0 0 0 1px hsl(var(--primary) / 0.3),
                    0 8px 32px hsl(var(--primary) / 0.12) !important;
        transition: all 0.35s ease !important;
      }
      a:not([role="button"]):hover {
        text-shadow: 0 0 8px hsl(var(--primary) / 0.6);
        transition: text-shadow 0.25s ease !important;
      }
    `,
  },
  {
    id: 'corporate',
    name: 'Corporate',
    emoji: '🏢',
    description: 'No animations',
    detail: 'Completely static – for those who want full control',
    css: `
      /* CORPORATE – no animations whatsoever */
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
        transform: none !important;
      }
    `,
  },
]

// ─── DEFAULT theme ─────────────────────────────────────────────────────────
const DEFAULT_ADMIN_THEME: AdminTheme = {
  primary: '#06b6d4',
  primaryForeground: '#ffffff',
  secondary: '#1e293b',
  secondaryForeground: '#e2e8f0',
  accent: '#0e7490',
  accentForeground: '#cffafe',
  background: '#0f172a',
  foreground: '#f1f5f9',
  card: '#1e293b',
  cardForeground: '#f1f5f9',
  border: '#334155',
  muted: '#1e293b',
  mutedForeground: '#94a3b8',
  sidebarBackground: '#0f172a',
  sidebarForeground: '#cbd5e1',
  sidebarPrimary: '#06b6d4',
  sidebarPrimaryForeground: '#ffffff',
  sidebarAccent: '#1e293b',
  sidebarAccentForeground: '#f1f5f9',
  sidebarBorder: '#1e293b',
  animationPreset: 'professional',
}

const PRESET_THEMES: {
  name: string
  description: string
  tag: string
  tagColor: string
  palette: string[]
  theme: AdminTheme
}[] = [
  {
    name: 'Ocean Admin',
    description: 'Rent cyan på mørk slate – profesjonelt og moderne',
    tag: 'Standard',
    tagColor: '#06b6d4',
    palette: ['#06b6d4', '#0f172a', '#1e293b'],
    theme: DEFAULT_ADMIN_THEME,
  },
  {
    name: 'Deep Navy',
    description: 'Dyp marineblå med elektrisk blå aksent',
    tag: 'Klassisk',
    tagColor: '#3b82f6',
    palette: ['#3b82f6', '#0a0f1e', '#111827'],
    theme: {
      ...DEFAULT_ADMIN_THEME,
      primary: '#3b82f6', primaryForeground: '#ffffff',
      secondary: '#111827', secondaryForeground: '#e5e7eb',
      accent: '#1d4ed8', accentForeground: '#bfdbfe',
      background: '#0a0f1e', foreground: '#f9fafb',
      card: '#111827', cardForeground: '#f9fafb',
      border: '#1f2937', muted: '#111827', mutedForeground: '#9ca3af',
      sidebarBackground: '#060c18', sidebarForeground: '#d1d5db',
      sidebarPrimary: '#3b82f6', sidebarPrimaryForeground: '#ffffff',
      sidebarAccent: '#111827', sidebarAccentForeground: '#f9fafb',
      sidebarBorder: '#1f2937',
    },
  },
  {
    name: 'Indigo SaaS',
    description: 'Sofistikert indigo på nøytral zinc',
    tag: 'Populær',
    tagColor: '#6366f1',
    palette: ['#6366f1', '#18181b', '#27272a'],
    theme: {
      ...DEFAULT_ADMIN_THEME,
      primary: '#6366f1', primaryForeground: '#ffffff',
      secondary: '#27272a', secondaryForeground: '#e4e4e7',
      accent: '#4f46e5', accentForeground: '#c7d2fe',
      background: '#18181b', foreground: '#fafafa',
      card: '#27272a', cardForeground: '#fafafa',
      border: '#3f3f46', muted: '#27272a', mutedForeground: '#a1a1aa',
      sidebarBackground: '#09090b', sidebarForeground: '#d4d4d8',
      sidebarPrimary: '#6366f1', sidebarPrimaryForeground: '#ffffff',
      sidebarAccent: '#27272a', sidebarAccentForeground: '#fafafa',
      sidebarBorder: '#3f3f46',
    },
  },
  {
    name: 'Emerald Pro',
    description: 'Frisk emeraldgrønn – tillit og vekst',
    tag: 'Frisk',
    tagColor: '#10b981',
    palette: ['#10b981', '#111827', '#1f2937'],
    theme: {
      ...DEFAULT_ADMIN_THEME,
      primary: '#10b981', primaryForeground: '#ffffff',
      secondary: '#1f2937', secondaryForeground: '#e5e7eb',
      accent: '#059669', accentForeground: '#a7f3d0',
      background: '#111827', foreground: '#f9fafb',
      card: '#1f2937', cardForeground: '#f9fafb',
      border: '#374151', muted: '#1f2937', mutedForeground: '#9ca3af',
      sidebarBackground: '#0b1120', sidebarForeground: '#d1fae5',
      sidebarPrimary: '#10b981', sidebarPrimaryForeground: '#ffffff',
      sidebarAccent: '#1f2937', sidebarAccentForeground: '#f9fafb',
      sidebarBorder: '#374151',
    },
  },
  {
    name: 'Violet Pulse',
    description: 'Kreativ lilla med dypviolett bakgrunn',
    tag: 'Kreativ',
    tagColor: '#8b5cf6',
    palette: ['#8b5cf6', '#13111c', '#1e1a2e'],
    theme: {
      ...DEFAULT_ADMIN_THEME,
      primary: '#8b5cf6', primaryForeground: '#ffffff',
      secondary: '#1e1a2e', secondaryForeground: '#ede9fe',
      accent: '#7c3aed', accentForeground: '#ddd6fe',
      background: '#13111c', foreground: '#faf5ff',
      card: '#1e1a2e', cardForeground: '#faf5ff',
      border: '#2e2a45', muted: '#1e1a2e', mutedForeground: '#a78bfa',
      sidebarBackground: '#0d0b17', sidebarForeground: '#c4b5fd',
      sidebarPrimary: '#8b5cf6', sidebarPrimaryForeground: '#ffffff',
      sidebarAccent: '#1e1a2e', sidebarAccentForeground: '#faf5ff',
      sidebarBorder: '#2e2a45',
    },
  },
  {
    name: 'Rose Elite',
    description: 'Elegant rose – premium og eksklusivt',
    tag: 'Premium',
    tagColor: '#f43f5e',
    palette: ['#f43f5e', '#1a0e12', '#2d1420'],
    theme: {
      ...DEFAULT_ADMIN_THEME,
      primary: '#f43f5e', primaryForeground: '#ffffff',
      secondary: '#2d1420', secondaryForeground: '#fce7f3',
      accent: '#e11d48', accentForeground: '#fda4af',
      background: '#1a0e12', foreground: '#fff1f2',
      card: '#2d1420', cardForeground: '#fff1f2',
      border: '#4c2030', muted: '#2d1420', mutedForeground: '#fb7185',
      sidebarBackground: '#120910', sidebarForeground: '#fecdd3',
      sidebarPrimary: '#f43f5e', sidebarPrimaryForeground: '#ffffff',
      sidebarAccent: '#2d1420', sidebarAccentForeground: '#fff1f2',
      sidebarBorder: '#4c2030',
    },
  },
  {
    name: 'Amber Spark',
    description: 'Varm amber – energisk og imøtekommende',
    tag: 'Varm',
    tagColor: '#f59e0b',
    palette: ['#f59e0b', '#1c1404', '#2c1f06'],
    theme: {
      ...DEFAULT_ADMIN_THEME,
      primary: '#f59e0b', primaryForeground: '#1c1404',
      secondary: '#2c1f06', secondaryForeground: '#fef3c7',
      accent: '#d97706', accentForeground: '#fde68a',
      background: '#1c1404', foreground: '#fffbeb',
      card: '#2c1f06', cardForeground: '#fffbeb',
      border: '#3d2c08', muted: '#2c1f06', mutedForeground: '#a16207',
      sidebarBackground: '#120e02', sidebarForeground: '#fde68a',
      sidebarPrimary: '#f59e0b', sidebarPrimaryForeground: '#1c1404',
      sidebarAccent: '#2c1f06', sidebarAccentForeground: '#fffbeb',
      sidebarBorder: '#3d2c08',
    },
  },
  {
    name: 'Arctic Light',
    description: 'Ren lys modus – maksimal lesbarhet',
    tag: 'Lys modus',
    tagColor: '#0ea5e9',
    palette: ['#0ea5e9', '#f8fafc', '#ffffff'],
    theme: {
      ...DEFAULT_ADMIN_THEME,
      primary: '#0ea5e9', primaryForeground: '#ffffff',
      secondary: '#f1f5f9', secondaryForeground: '#1e293b',
      accent: '#e0f2fe', accentForeground: '#0369a1',
      background: '#f8fafc', foreground: '#0f172a',
      card: '#ffffff', cardForeground: '#0f172a',
      border: '#e2e8f0', muted: '#f1f5f9', mutedForeground: '#64748b',
      sidebarBackground: '#f1f5f9', sidebarForeground: '#334155',
      sidebarPrimary: '#0ea5e9', sidebarPrimaryForeground: '#ffffff',
      sidebarAccent: '#e2e8f0', sidebarAccentForeground: '#0f172a',
      sidebarBorder: '#e2e8f0',
    },
  },
  {
    name: 'Enterprise',
    description: 'Charcoal med teal – seriøst og profesjonelt',
    tag: 'Enterprise',
    tagColor: '#14b8a6',
    palette: ['#14b8a6', '#1a1f2e', '#242938'],
    theme: {
      ...DEFAULT_ADMIN_THEME,
      primary: '#14b8a6', primaryForeground: '#ffffff',
      secondary: '#242938', secondaryForeground: '#e2e8f0',
      accent: '#0f766e', accentForeground: '#99f6e4',
      background: '#1a1f2e', foreground: '#f0fdf4',
      card: '#242938', cardForeground: '#f0fdf4',
      border: '#2f3650', muted: '#242938', mutedForeground: '#94a3b8',
      sidebarBackground: '#131722', sidebarForeground: '#ccfbf1',
      sidebarPrimary: '#14b8a6', sidebarPrimaryForeground: '#ffffff',
      sidebarAccent: '#242938', sidebarAccentForeground: '#f0fdf4',
      sidebarBorder: '#2f3650',
    },
  },
]

// ─── Inject / remove animation CSS globally ───────────────────────────────
const STYLE_TAG_ID = 'admin-animation-preset'

function injectAnimationCSS(css: string) {
  let tag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null
  if (!tag) {
    tag = document.createElement('style')
    tag.id = STYLE_TAG_ID
    document.head.appendChild(tag)
  }
  tag.textContent = css
}

// ─── Component ────────────────────────────────────────────────────────────
export default function AdminThemePicker() {
  const [currentTheme, setCurrentTheme] = useState<AdminTheme>(DEFAULT_ADMIN_THEME)
  const [activePresetName, setActivePresetName] = useState<string>('Ocean Admin')
  const [customColors, setCustomColors] = useState<Record<string, string>>({})
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    presets: true,
    animations: false,
    primary: false,
    sidebar: false,
    advanced: false,
  })

  useEffect(() => {
    const savedTheme = localStorage.getItem('admin-theme')
    const savedPreset = localStorage.getItem('admin-theme-preset')
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme)
        setCurrentTheme(parsed)
        applyTheme(parsed)
        if (savedPreset) setActivePresetName(savedPreset)
        // Re-inject saved animation CSS
        const animPreset = ANIMATION_PRESETS.find(p => p.id === parsed.animationPreset)
        if (animPreset) injectAnimationCSS(animPreset.css)
      } catch (e) {
        console.error('Failed to load saved theme:', e)
      }
    } else {
      // Inject default animation
      const defaultAnim = ANIMATION_PRESETS.find(p => p.id === DEFAULT_ADMIN_THEME.animationPreset)
      if (defaultAnim) injectAnimationCSS(defaultAnim.css)
    }
  }, [])

  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0
    const l = (max + min) / 2
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
  }

  const applyTheme = (theme: AdminTheme) => {
    const root = document.documentElement
    root.style.setProperty('--primary', hexToHsl(theme.primary))
    root.style.setProperty('--primary-foreground', hexToHsl(theme.primaryForeground))
    root.style.setProperty('--secondary', hexToHsl(theme.secondary))
    root.style.setProperty('--secondary-foreground', hexToHsl(theme.secondaryForeground))
    root.style.setProperty('--accent', hexToHsl(theme.accent))
    root.style.setProperty('--accent-foreground', hexToHsl(theme.accentForeground))
    root.style.setProperty('--background', hexToHsl(theme.background))
    root.style.setProperty('--foreground', hexToHsl(theme.foreground))
    root.style.setProperty('--card', hexToHsl(theme.card))
    root.style.setProperty('--card-foreground', hexToHsl(theme.cardForeground))
    root.style.setProperty('--border', hexToHsl(theme.border))
    root.style.setProperty('--muted', hexToHsl(theme.muted))
    root.style.setProperty('--muted-foreground', hexToHsl(theme.mutedForeground))
    root.style.setProperty('--sidebar-background', hexToHsl(theme.sidebarBackground))
    root.style.setProperty('--sidebar-foreground', hexToHsl(theme.sidebarForeground))
    root.style.setProperty('--sidebar-primary', hexToHsl(theme.sidebarPrimary))
    root.style.setProperty('--sidebar-primary-foreground', hexToHsl(theme.sidebarPrimaryForeground))
    root.style.setProperty('--sidebar-accent', hexToHsl(theme.sidebarAccent))
    root.style.setProperty('--sidebar-accent-foreground', hexToHsl(theme.sidebarAccentForeground))
    root.style.setProperty('--sidebar-border', hexToHsl(theme.sidebarBorder))
    root.style.setProperty('--sidebar-ring', hexToHsl(theme.sidebarPrimary))
  }

  const applyPresetTheme = (preset: typeof PRESET_THEMES[0]) => {
    const newTheme = { ...preset.theme, animationPreset: currentTheme.animationPreset }
    setCurrentTheme(newTheme)
    setActivePresetName(preset.name)
    applyTheme(newTheme)
    localStorage.setItem('admin-theme', JSON.stringify(newTheme))
    localStorage.setItem('admin-theme-preset', preset.name)
    toast.success(`Tema "${preset.name}" aktivert`)
  }

  const applyAnimationPreset = (preset: AnimationPreset) => {
    const newTheme = { ...currentTheme, animationPreset: preset.id }
    setCurrentTheme(newTheme)
    injectAnimationCSS(preset.css)
    localStorage.setItem('admin-theme', JSON.stringify(newTheme))
    toast.success(`Animasjon: ${preset.name}`)
  }

  const handleColorChange = (property: string, color: string) => {
    const newTheme = { ...currentTheme, [property]: color }
    setCurrentTheme(newTheme)
    applyTheme(newTheme)
    setCustomColors({ ...customColors, [property]: color })
    setActivePresetName('Egendefinert')
  }

  const saveCustomTheme = () => {
    const finalTheme = { ...currentTheme, ...customColors }
    setCurrentTheme(finalTheme)
    localStorage.setItem('admin-theme', JSON.stringify(finalTheme))
    localStorage.setItem('admin-theme-preset', activePresetName)
    setCustomColors({})
    toast.success('Egendefinert tema lagret!')
  }

  const resetToDefault = () => {
    setCurrentTheme(DEFAULT_ADMIN_THEME)
    setActivePresetName('Ocean Admin')
    applyTheme(DEFAULT_ADMIN_THEME)
    const defaultAnim = ANIMATION_PRESETS.find(p => p.id === DEFAULT_ADMIN_THEME.animationPreset)
    if (defaultAnim) injectAnimationCSS(defaultAnim.css)
    localStorage.removeItem('admin-theme')
    localStorage.removeItem('admin-theme-preset')
    setCustomColors({})
    toast.success('Tema tilbakestilt til standard')
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const activeAnimation = ANIMATION_PRESETS.find(p => p.id === currentTheme.animationPreset) ?? ANIMATION_PRESETS[0]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Admin Panel Tema</CardTitle>
          </div>
          <Badge
            variant="outline"
            className="text-xs font-medium"
            style={{ borderColor: currentTheme.primary, color: currentTheme.primary }}
          >
            {activePresetName}
          </Badge>
        </div>
        <CardDescription>
          Tilpass farger, animasjoner og utseende på admin-panelet ditt
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* ── Color presets ──────────────────────────────────────────────── */}
        <Collapsible open={expandedSections.presets} onOpenChange={() => toggleSection('presets')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between font-medium">
              Fargetemaer
              {expandedSections.presets ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {PRESET_THEMES.map((preset) => {
                const isActive = activePresetName === preset.name
                return (
                  <button
                    key={preset.name}
                    onClick={() => applyPresetTheme(preset)}
                    className={`relative text-left rounded-xl border-2 p-3.5 transition-all duration-200 ${
                      isActive ? 'border-primary shadow-md shadow-primary/10' : 'border-border hover:border-muted-foreground/40 hover:bg-muted/30'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full"
                        style={{ backgroundColor: preset.palette[0] }}>
                        <Check className="h-3 w-3 text-white" />
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="rounded-lg border border-white/10" style={{ backgroundColor: preset.palette[0], width: 28, height: 28 }} />
                      <div className="rounded-md border border-white/10" style={{ backgroundColor: preset.palette[1], width: 20, height: 20 }} />
                      <div className="rounded-md border border-white/10" style={{ backgroundColor: preset.palette[2], width: 16, height: 16 }} />
                      <div className="ml-1 flex-1 h-5 rounded-md overflow-hidden flex" style={{ backgroundColor: preset.palette[1] }}>
                        <div className="w-2/5 h-full" style={{ backgroundColor: preset.palette[0], opacity: 0.85 }} />
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <p className="text-sm font-semibold leading-tight">{preset.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{preset.description}</p>
                      </div>
                      <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                        style={{ backgroundColor: preset.tagColor + '22', color: preset.tagColor }}>
                        {preset.tag}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* ── Animation presets ──────────────────────────────────────────── */}
        <Collapsible open={expandedSections.animations} onOpenChange={() => toggleSection('animations')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between font-medium">
              <span className="flex items-center gap-2">
                Animasjoner
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {activeAnimation.emoji} {activeAnimation.name}
                </Badge>
              </span>
              {expandedSections.animations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-3">
            <p className="text-xs text-muted-foreground px-1">
              Påvirker alle knapper, lenker, kort og sidefelt-elementer i admin-panelet.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ANIMATION_PRESETS.map((preset) => {
                const isActive = currentTheme.animationPreset === preset.id
                return (
                  <button
                    key={preset.id}
                    onClick={() => applyAnimationPreset(preset)}
                    className={`relative text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                      isActive ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-border hover:border-muted-foreground/40 hover:bg-muted/30'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full"
                        style={{ backgroundColor: currentTheme.primary }}>
                        <Check className="h-3 w-3 text-white" />
                      </span>
                    )}

                    {/* Visual demo */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-2xl leading-none">{preset.emoji}</div>
                      {/* Mini button mock */}
                      <div className="flex gap-1">
                        <div className="h-5 w-10 rounded" style={{ backgroundColor: currentTheme.primary, opacity: 0.9 }} />
                        <div className="h-5 w-7 rounded border" style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.card }} />
                      </div>
                      {/* Mini sidebar item mock */}
                      <div className="ml-auto flex flex-col gap-1">
                        <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: currentTheme.sidebarPrimary }} />
                        <div className="h-1.5 w-9 rounded-full" style={{ backgroundColor: currentTheme.sidebarForeground + '55' }} />
                      </div>
                    </div>

                    <p className="text-sm font-semibold leading-tight">{preset.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">{preset.detail}</p>
                  </button>
                )
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* ── Primary Colors ─────────────────────────────────────────────── */}
        <Collapsible open={expandedSections.primary} onOpenChange={() => toggleSection('primary')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between font-medium">
              Primærfarger
              {expandedSections.primary ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'primary', label: 'Primærfarge', prop: 'primary', placeholder: '#06b6d4' },
                { id: 'primary-fg', label: 'Tekst på primær', prop: 'primaryForeground', placeholder: '#ffffff' },
                { id: 'accent', label: 'Aksentfarge', prop: 'accent', placeholder: '#0e7490' },
                { id: 'foreground', label: 'Global tekst', prop: 'foreground', placeholder: '#f1f5f9' },
              ].map(({ id, label, prop, placeholder }) => (
                <div key={id} className="space-y-2">
                  <Label htmlFor={id}>{label}</Label>
                  <div className="flex gap-2">
                    <Input id={id} type="color"
                      value={customColors[prop] || (currentTheme[prop as keyof AdminTheme] as string)}
                      onChange={(e) => handleColorChange(prop, e.target.value)}
                      className="w-14 h-10 p-1 cursor-pointer" />
                    <Input
                      value={customColors[prop] || (currentTheme[prop as keyof AdminTheme] as string)}
                      onChange={(e) => handleColorChange(prop, e.target.value)}
                      placeholder={placeholder} className="font-mono text-sm" />
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ── Sidebar Colors ─────────────────────────────────────────────── */}
        <Collapsible open={expandedSections.sidebar} onOpenChange={() => toggleSection('sidebar')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between font-medium">
              Sidefelt-farger
              {expandedSections.sidebar ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'sb-bg', label: 'Bakgrunn', prop: 'sidebarBackground' },
                { id: 'sb-primary', label: 'Aksent / aktiv', prop: 'sidebarPrimary' },
                { id: 'sb-fg', label: 'Tekst', prop: 'sidebarForeground' },
                { id: 'sb-border', label: 'Kantlinje', prop: 'sidebarBorder' },
              ].map(({ id, label, prop }) => (
                <div key={id} className="space-y-2">
                  <Label htmlFor={id}>{label}</Label>
                  <div className="flex gap-2">
                    <Input id={id} type="color"
                      value={customColors[prop] || (currentTheme[prop as keyof AdminTheme] as string)}
                      onChange={(e) => handleColorChange(prop, e.target.value)}
                      className="w-14 h-10 p-1 cursor-pointer" />
                    <Input
                      value={customColors[prop] || (currentTheme[prop as keyof AdminTheme] as string)}
                      onChange={(e) => handleColorChange(prop, e.target.value)}
                      className="font-mono text-sm" />
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ── Advanced Colors ─────────────────────────────────────────────── */}
        <Collapsible open={expandedSections.advanced} onOpenChange={() => toggleSection('advanced')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between font-medium">
              Avanserte farger
              {expandedSections.advanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'bg', label: 'Sidebakgrunn', prop: 'background' },
                { id: 'card', label: 'Kortbakgrunn', prop: 'card' },
                { id: 'border', label: 'Kantlinje', prop: 'border' },
                { id: 'muted-fg', label: 'Dempet tekst', prop: 'mutedForeground' },
              ].map(({ id, label, prop }) => (
                <div key={id} className="space-y-2">
                  <Label htmlFor={id}>{label}</Label>
                  <div className="flex gap-2">
                    <Input id={id} type="color"
                      value={customColors[prop] || (currentTheme[prop as keyof AdminTheme] as string)}
                      onChange={(e) => handleColorChange(prop, e.target.value)}
                      className="w-14 h-10 p-1 cursor-pointer" />
                    <Input
                      value={customColors[prop] || (currentTheme[prop as keyof AdminTheme] as string)}
                      onChange={(e) => handleColorChange(prop, e.target.value)}
                      className="font-mono text-sm" />
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* ── Live preview ───────────────────────────────────────────────── */}
        <div className="rounded-xl overflow-hidden border border-border">
          <div className="text-xs font-medium px-3 py-2 text-muted-foreground bg-muted/40 border-b border-border flex items-center justify-between">
            <span>Forhåndsvisning</span>
            <span className="text-[10px]">{activeAnimation.emoji} {activeAnimation.name}</span>
          </div>
          <div className="flex h-16" style={{ backgroundColor: currentTheme.background }}>
            <div className="w-12 flex flex-col items-center justify-center gap-1.5"
              style={{ backgroundColor: currentTheme.sidebarBackground, borderRight: `1px solid ${currentTheme.sidebarBorder}` }}>
              {[currentTheme.sidebarPrimary, currentTheme.sidebarForeground + '88', currentTheme.sidebarForeground + '55'].map((c, i) => (
                <div key={i} className="h-1 rounded-full" style={{ backgroundColor: c, width: i === 0 ? 24 : 16 }} />
              ))}
            </div>
            <div className="flex-1 flex items-center gap-3 px-4">
              <div className="h-7 w-24 rounded-md" style={{ backgroundColor: currentTheme.card, border: `1px solid ${currentTheme.border}` }} />
              <div className="h-7 w-14 rounded-md" style={{ backgroundColor: currentTheme.primary }} />
              <div className="h-7 w-14 rounded-md border" style={{ borderColor: currentTheme.border, backgroundColor: 'transparent' }} />
              <div className="ml-auto flex flex-col gap-1">
                <div className="h-1.5 w-20 rounded-full" style={{ backgroundColor: currentTheme.foreground + 'cc' }} />
                <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: currentTheme.mutedForeground + '88' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Actions ────────────────────────────────────────────────────── */}
        <div className="flex gap-2">
          <Button onClick={saveCustomTheme} className="flex-1">Lagre egendefinert tema</Button>
          <Button variant="outline" onClick={resetToDefault}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Tilbakestill
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Temaendringer lagres i nettleseren og gjelder bare for deg på denne enheten.
        </p>
      </CardContent>
    </Card>
  )
}
