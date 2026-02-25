'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

export interface WorkspaceInfo {
  id: string
  name: string
  isOwn: boolean
  role: 'owner' | 'admin' | 'member'
  ownerEmail: string | null
}

interface WorkspaceContextValue {
  workspaces: WorkspaceInfo[]
  activeWorkspace: WorkspaceInfo | null
  activeWorkspaceId: string
  isOwnWorkspace: boolean
  memberRole: 'owner' | 'admin' | 'member'
  switchWorkspace: (id: string) => Promise<void>
  loading: boolean
  /** Whether the user can edit settings/config (owner or admin role) */
  canEdit: boolean
  /** Whether the user can manage team & billing (owner only) */
  canManage: boolean
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return ctx
}

interface WorkspaceProviderProps {
  children: ReactNode
  userId: string
}

export function WorkspaceProvider({ children, userId }: WorkspaceProviderProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(userId)
  const [loading, setLoading] = useState(true)

  const loadWorkspaces = useCallback(async () => {
    try {
      const res = await fetch('/api/workspace')
      if (res.ok) {
        const data = await res.json()
        setWorkspaces(data.workspaces || [])
        setActiveWorkspaceId(data.activeWorkspaceId || userId)
      }
    } catch {
      // fallback to own workspace
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadWorkspaces()
  }, [loadWorkspaces])

  const switchWorkspace = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: id }),
      })
      if (res.ok) {
        setActiveWorkspaceId(id)
        // Reload the page so all server components refresh with new workspace
        window.location.reload()
      }
    } catch {
      // do nothing
    }
  }, [])

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || null
  const isOwnWorkspace = activeWorkspaceId === userId
  const memberRole = activeWorkspace?.role || 'owner'
  const canEdit = memberRole === 'owner' || memberRole === 'admin'
  const canManage = memberRole === 'owner'

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        activeWorkspaceId,
        isOwnWorkspace,
        memberRole,
        switchWorkspace,
        loading,
        canEdit,
        canManage,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
