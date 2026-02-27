'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'

const VINTRA_LOGO = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/vintratext-skOk2ureyF4j9EWL7jotcLG1aD5kpr.png"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Bot,
  LayoutDashboard,
  MessageSquare,
  Palette,
  Settings,
  BarChart3,
  MessagesSquare,
  LogOut,
  ChevronUp,
  Code2,
  Lock,
  CreditCard,
  Users,
  ShieldAlert,
} from 'lucide-react'
import { WorkspaceSwitcher } from './workspace-switcher'
import { useWorkspace } from './workspace-provider'

interface AdminSidebarProps {
  user: User
  profile: {
    company_name: string | null
    avatar_url: string | null
  } | null
}

// Maps each menu item to the PlanLimits key that must be true for access
// null means always accessible
interface MenuItem {
  title: string
  icon: typeof LayoutDashboard
  href: string
  requiredFeature: string | null
  /** If true, item is only shown when user is owner or admin of the workspace */
  requiresEdit?: boolean
  /** If true, item is only shown for workspace owner */
  ownerOnly?: boolean
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin',
    requiredFeature: null,
  },
  {
    title: 'Conversations',
    icon: MessageSquare,
    href: '/admin/conversations',
    requiredFeature: null,
  },
  {
    title: 'AI Assistant',
    icon: Bot,
    href: '/admin/ai',
    requiredFeature: 'aiEnabled',
    requiresEdit: true,
  },
  {
    title: 'Canned Responses',
    icon: MessagesSquare,
    href: '/admin/responses',
    requiredFeature: 'cannedResponses',
    requiresEdit: true,
  },
  {
    title: 'Appearance',
    icon: Palette,
    href: '/admin/appearance',
    requiredFeature: null,
    requiresEdit: true,
  },
  {
    title: 'Export Widget',
    icon: Code2,
    href: '/export',
    requiredFeature: null,
    requiresEdit: true,
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    href: '/admin/analytics',
    requiredFeature: 'analyticsEnabled',
  },
  {
    title: 'Team',
    icon: Users,
    href: '/admin/team',
    requiredFeature: null,
    ownerOnly: true,
  },
  {
    title: 'Integration',
    icon: Code2,
    href: '/admin/integration',
    requiredFeature: null,
    requiresEdit: true,
  },
  {
    title: 'Settings',
    icon: Settings,
    href: '/admin/settings',
    requiredFeature: null,
    ownerOnly: true,
  },
]

export function AdminSidebar({ user, profile }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [currentPlan, setCurrentPlan] = useState<string>('starter')
  const [planLimits, setPlanLimits] = useState<Record<string, boolean | number | null> | null>(null)
  const { canEdit, canManage, isOwnWorkspace } = useWorkspace()

  useEffect(() => {
    fetch('/api/plan')
      .then(r => r.json())
      .then(d => {
        setCurrentPlan(d.planId || 'starter')
        setPlanLimits(d.limits || null)
      })
      .catch(() => {})
  }, [])

  const isFeatureLocked = (requiredFeature: string | null): boolean => {
    if (!requiredFeature) return false
    if (!planLimits) return false
    const value = planLimits[requiredFeature]
    if (typeof value === 'boolean') return !value
    return false
  }

  const isPermissionLocked = (item: MenuItem): boolean => {
    if (item.ownerOnly && !canManage) return true
    if (item.requiresEdit && !canEdit) return true
    return false
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const getInitials = () => {
    if (profile?.company_name) {
      return profile.company_name.slice(0, 2).toUpperCase()
    }
    return user.email?.slice(0, 2).toUpperCase() || 'VS'
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/admin" className="flex items-center px-2 py-3">
              <Image 
                src={VINTRA_LOGO} 
                alt="Vintra" 
                width={100} 
                height={32} 
                className="h-7 w-auto"
              />
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
        <WorkspaceSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const planLocked = isFeatureLocked(item.requiredFeature)
                const permLocked = isPermissionLocked(item)
                const locked = planLocked || permLocked
                if (permLocked && !isOwnWorkspace) {
                  // Hide owner-only items entirely when viewing someone else's workspace
                  if (item.ownerOnly) return null
                }
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        item.href === '/admin'
                          ? pathname === '/admin'
                          : pathname.startsWith(item.href)
                      }
                    >
                      <Link
                        href={locked ? '#' : item.href}
                        className={locked ? 'opacity-60 pointer-events-none' : ''}
                        aria-disabled={locked}
                        tabIndex={locked ? -1 : undefined}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.title}</span>
                        {planLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                        {permLocked && !planLocked && (
                          <ShieldAlert className="h-3 w-3 text-muted-foreground" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col items-start text-left">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-sidebar-foreground">
                        {profile?.company_name || 'My Workspace'}
                      </span>
                      <Badge variant={currentPlan === 'starter' ? 'secondary' : 'default'} className="text-[10px] px-1.5 py-0">
                        {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                      </Badge>
                    </div>
                    <span className="truncate text-xs text-sidebar-foreground/60">
                      {user.email}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4 text-sidebar-foreground/60" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-[--radix-dropdown-menu-trigger-width]"
              >
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Upgrade Plan
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
