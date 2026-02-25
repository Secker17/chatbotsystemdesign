'use client'

import { useWorkspace } from './workspace-provider'
import { Building2, Check, ChevronsUpDown, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, switchWorkspace, loading } = useWorkspace()

  if (loading || workspaces.length <= 1) {
    // Don't show switcher if user only has their own workspace
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="w-full">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-sidebar-accent text-sidebar-accent-foreground">
                {activeWorkspace?.isOwn ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Building2 className="h-4 w-4" />
                )}
              </div>
              <div className="flex flex-1 flex-col items-start text-left">
                <span className="truncate text-sm font-medium text-sidebar-foreground">
                  {activeWorkspace?.name || 'My Workspace'}
                </span>
                <span className="truncate text-xs text-sidebar-foreground/60">
                  {activeWorkspace?.isOwn
                    ? 'Your workspace'
                    : `${activeWorkspace?.role === 'admin' ? 'Admin' : 'Member'}`}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto h-4 w-4 text-sidebar-foreground/60" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            align="start"
            className="w-[--radix-dropdown-menu-trigger-width]"
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Workspaces
            </DropdownMenuLabel>
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => {
                  if (workspace.id !== activeWorkspace?.id) {
                    switchWorkspace(workspace.id)
                  }
                }}
                className="flex items-center gap-2"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded border bg-muted">
                  {workspace.isOwn ? (
                    <User className="h-3 w-3" />
                  ) : (
                    <Building2 className="h-3 w-3" />
                  )}
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm">{workspace.name}</span>
                  {!workspace.isOwn && (
                    <span className="text-xs text-muted-foreground">
                      {workspace.ownerEmail}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {!workspace.isOwn && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {workspace.role}
                    </Badge>
                  )}
                  {workspace.id === activeWorkspace?.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
