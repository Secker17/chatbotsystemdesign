'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Users,
  UserPlus,
  Mail,
  Clock,
  Trash2,
  Loader2,
  Copy,
  Check,
  Crown,
  ArrowUpRight,
  Shield,
  UserCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface TeamMember {
  id: string
  user_id: string
  role: string
  joined_at: string
  email: string | null
  company_name: string | null
}

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  created_at: string
  expires_at: string
}

interface TeamLimits {
  maxTeamMembers: number
  currentCount: number
  pendingCount: number
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [limits, setLimits] = useState<TeamLimits | null>(null)
  const [planId, setPlanId] = useState<string>('starter')
  const [loading, setLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [lastToken, setLastToken] = useState<string | null>(null)
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [migrationNeeded, setMigrationNeeded] = useState(false)
  const [migrationSql, setMigrationSql] = useState<string | null>(null)

  const runMigrationCheck = useCallback(async () => {
    try {
      const res = await fetch('/api/migrate-team')
      if (!res.ok) return false
      const data = await res.json()
      if (data.tablesReady) return true
      // Tables don't exist yet - show migration info
      setMigrationNeeded(true)
      setMigrationSql(data.migrationSql || null)
      return false
    } catch {
      return false
    }
  }, [])

  const loadTeam = useCallback(async () => {
    try {
      // First check if tables exist
      const ready = await runMigrationCheck()
      if (!ready) {
        setLoading(false)
        return
      }

      const res = await fetch('/api/team')
      if (!res.ok) throw new Error('Failed to load team')
      const data = await res.json()
      setMembers(data.members || [])
      setInvitations(data.invitations || [])
      setLimits(data.limits || null)
      setPlanId(data.planId || 'starter')
      setMigrationNeeded(false)
    } catch {
      toast.error('Failed to load team data')
    } finally {
      setLoading(false)
    }
  }, [runMigrationCheck])

  useEffect(() => {
    loadTeam()
  }, [loadTeam])

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }

    setInviting(true)
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to send invitation')
        return
      }

      toast.success(`Invitation sent to ${inviteEmail.trim()}`)
      setLastToken(data.token)
      setInviteEmail('')
      setInviteRole('member')
      setInviteDialogOpen(false)
      setTokenDialogOpen(true)
      loadTeam()
    } catch {
      toast.error('Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  const handleRevoke = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/team?type=invitation&id=${invitationId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to revoke')
      toast.success('Invitation revoked')
      loadTeam()
    } catch {
      toast.error('Failed to revoke invitation')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      const res = await fetch(`/api/team?type=member&id=${memberId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to remove')
      toast.success('Team member removed')
      loadTeam()
    } catch {
      toast.error('Failed to remove team member')
    }
  }

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(link)
    setCopiedToken(token)
    toast.success('Invite link copied to clipboard')
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const totalUsed = (limits?.currentCount || 0) + (limits?.pendingCount || 0)
  const maxAllowed = limits?.maxTeamMembers || 2
  const usagePercent = Math.min((totalUsed / maxAllowed) * 100, 100)
  const isAtLimit = totalUsed >= maxAllowed

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (migrationNeeded) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team</h1>
          <p className="text-muted-foreground">
            Invite others to collaborate on your chatbots
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Database Setup Required</CardTitle>
            <CardDescription>
              The team tables need to be created in your Supabase database before you can use this feature.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Copy the SQL below and run it in your Supabase Dashboard &gt; SQL Editor:
            </p>
            {migrationSql && (
              <div className="relative">
                <pre className="max-h-64 overflow-auto rounded-md bg-muted p-4 text-xs font-mono">
                  {migrationSql}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute right-2 top-2"
                  onClick={() => {
                    navigator.clipboard.writeText(migrationSql)
                    toast.success('SQL copied to clipboard')
                  }}
                >
                  <Copy className="mr-1 h-3 w-3" />
                  Copy
                </Button>
              </div>
            )}
            <Button
              onClick={() => {
                setMigrating(true)
                setLoading(true)
                loadTeam().finally(() => setMigrating(false))
              }}
              disabled={migrating}
            >
              {migrating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'I have run the SQL - Check again'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team</h1>
          <p className="text-muted-foreground">
            Invite others to collaborate on your chatbots
          </p>
        </div>
        <Button
          onClick={() => setInviteDialogOpen(true)}
          disabled={isAtLimit}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Usage Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Team Usage</CardTitle>
            </div>
            <CardDescription>
              {totalUsed} of {maxAllowed} seats used on your{' '}
              <span className="font-medium capitalize text-foreground">{planId}</span> plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {limits?.currentCount || 0} active, {limits?.pendingCount || 0} pending
                </span>
                <span className="font-medium text-foreground">
                  {totalUsed}/{maxAllowed}
                </span>
              </div>
              <Progress value={usagePercent} className="h-2" />
            </div>

            {isAtLimit && (
              <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Team limit reached
                  </span>
                </div>
                <Link href="/admin/settings">
                  <Button size="sm" variant="outline" className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/50">
                    Upgrade Plan
                    <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Members</CardTitle>
            </div>
            <CardDescription>
              Active members of your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <UserCircle className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">No team members yet</p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Invite someone to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {(member.company_name || member.user_id)?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {member.company_name || 'Team Member'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove member</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This person will lose access to your workspace. You can re-invite them later.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Pending Invitations</CardTitle>
            </div>
            <CardDescription>
              Invitations waiting to be accepted
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invitations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Mail className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">No pending invitations</p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Send an invite to add team members
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {invitations.map((invite) => {
                  const isExpired = new Date(invite.expires_at) < new Date()
                  return (
                    <div
                      key={invite.id}
                      className={`flex items-center justify-between rounded-lg border p-3 ${
                        isExpired ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                          {invite.email.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{invite.email}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {isExpired ? (
                              <span className="text-destructive">Expired</span>
                            ) : (
                              <span>
                                Expires {new Date(invite.expires_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={invite.role === 'admin' ? 'default' : 'secondary'}>
                          {invite.role}
                        </Badge>
                        {!isExpired && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => {
                              // We don't have the token in the list response for security
                              toast.info('Use the invite link that was shared when the invitation was created')
                            }}
                          >
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copy invite link</span>
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Revoke invitation</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revoke invitation?</AlertDialogTitle>
                              <AlertDialogDescription>
                                The invitation link for {invite.email} will no longer work.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleRevoke(invite.id)}
                              >
                                Revoke
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your workspace. They will receive a link to accept.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInvite()
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member - Can view and reply to conversations</SelectItem>
                  <SelectItem value="admin">Admin - Full access to all features</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
              {inviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Token/Link Dialog - shown after successful invite */}
      <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitation Created</DialogTitle>
            <DialogDescription>
              Share this link with the invited person. The link expires in 7 days.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={lastToken ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${lastToken}` : ''}
                className="font-mono text-xs"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => lastToken && copyInviteLink(lastToken)}
              >
                {copiedToken === lastToken ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sr-only">Copy link</span>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setTokenDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
