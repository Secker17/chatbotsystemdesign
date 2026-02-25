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

  const loadTeam = useCallback(async () => {
    try {
      const res = await fetch('/api/team')
      if (!res.ok) throw new Error('Failed to load team')
      const data = await res.json()
      setMembers(data.members || [])
      setInvitations(data.invitations || [])
      setLimits(data.limits || null)
      setPlanId(data.planId || 'starter')
    } catch {
      toast.error('Failed to load team data')
    } finally {
      setLoading(false)
    }
  }, [])

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
        const msg = data.details
          ? `${data.error}: ${data.details}`
          : data.error || 'Failed to send invitation'
        toast.error(msg)
        return
      }

      if (data.emailSent) {
        toast.success(`Invitation email sent to ${inviteEmail.trim()}`)
      } else if (data.inviteLink) {
        // Email failed — copy invite link to clipboard as fallback
        try {
          await navigator.clipboard.writeText(data.inviteLink)
          toast.success(
            `Invitation created! Email could not be sent — the invite link has been copied to your clipboard. Share it manually.`,
            { duration: 8000 }
          )
        } catch {
          toast.success(
            `Invitation created but email could not be sent. Share this link manually: ${data.inviteLink}`,
            { duration: 10000 }
          )
        }
      } else {
        toast.success(`Invitation created for ${inviteEmail.trim()}`)
      }

      setInviteEmail('')
      setInviteRole('member')
      setInviteDialogOpen(false)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Team</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Invite others to collaborate on your chatbots
          </p>
        </div>
        <Button
          onClick={() => setInviteDialogOpen(true)}
          disabled={isAtLimit}
          className="w-fit"
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
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
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
                    className="flex items-center justify-between gap-2 rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs sm:text-sm font-medium text-primary">
                        {(member.company_name || member.user_id)?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
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
                      className={`flex items-center justify-between gap-2 rounded-lg border p-3 ${
                        isExpired ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs sm:text-sm font-medium text-muted-foreground">
                          {invite.email.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{invite.email}</p>
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
              Enter their email address and we will send them an invitation to join your workspace.
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
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
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
    </div>
  )
}
