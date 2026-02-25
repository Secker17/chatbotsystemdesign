'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, User, Bell, Shield, Trash2, CreditCard, Check, Crown, ExternalLink, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import { PRODUCTS, type PlanId } from '@/lib/products'
import { useRouter } from 'next/navigation'
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

interface Profile {
  id: string
  company_name: string | null
  email_notifications: boolean
  timezone: string | null
  plan?: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<PlanId>('starter')
  const [switchingPlan, setSwitchingPlan] = useState<PlanId | null>(null)
  const [openingPortal, setOpeningPortal] = useState(false)

  // Password change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    loadProfile()
    loadPlan()
  }, [])

  const loadPlan = async () => {
    try {
      const res = await fetch('/api/plan')
      if (res.ok) {
        const data = await res.json()
        setCurrentPlan(data.planId || 'starter')
      }
    } catch {
      // Default to starter
    }
  }

  const loadProfile = async () => {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      // Use mock data in development mode
      const mockProfile = {
        id: 'dev-profile',
        user_id: 'dev-user',
        full_name: 'Development User',
        company_name: null,
        avatar_url: null,
        plan: 'free',
        email_notifications: false,
        timezone: null
      }
      setProfile(mockProfile)
      setEmail('dev@example.com')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setEmail(user.email || '')

    const { data } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!profile) return
    
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      // In dev mode, just show success but don't actually save
      toast.success('Settings saved (Development Mode - not actually saved)')
      return
    }
    
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('admin_profiles')
      .update({
        company_name: profile.company_name,
        email_notifications: profile.email_notifications,
        timezone: profile.timezone,
      })
      .eq('id', profile.id)

    if (error) {
      toast.error('Failed to save settings')
    } else {
      toast.success('Settings saved successfully')
    }
    setSaving(false)
  }

  const handleUpgrade = (planId: PlanId) => {
    // Redirect to Stripe checkout
    router.push(`/checkout/${planId}`)
  }

  const handleDowngrade = async () => {
    setSwitchingPlan('starter')
    try {
      const res = await fetch('/api/plan/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'starter' }),
      })
      const data = await res.json()

      if (res.ok) {
        setCurrentPlan('starter')
        toast.success('Downgraded to Starter plan. Your subscription has been canceled.')
        window.location.reload()
      } else {
        toast.error(data.error || 'Failed to downgrade')
      }
    } catch {
      toast.error('Failed to downgrade')
    }
    setSwitchingPlan(null)
  }

  const handleManageBilling = async () => {
    setOpeningPortal(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.url) {
        window.open(data.url, '_blank')
      } else {
        toast.error(data.error || 'Failed to open billing portal')
      }
    } catch {
      toast.error('Failed to open billing portal')
    }
    setOpeningPortal(false)
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      // In dev mode, just show success but don't actually change
      toast.success('Password changed (Development Mode - not actually changed)')
      setPasswordDialogOpen(false)
      setNewPassword('')
      setConfirmPassword('')
      setChangingPassword(false)
      return
    }

    setChangingPassword(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      toast.error(error.message || 'Failed to change password')
    } else {
      toast.success('Password changed successfully')
      setPasswordDialogOpen(false)
      setNewPassword('')
      setConfirmPassword('')
    }
    setChangingPassword(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your account and preferences
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

      <div className="grid gap-6">
        {/* Plan & Billing */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Plan & Billing</CardTitle>
            </div>
            <CardDescription>
              Manage your subscription plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              {PRODUCTS.map((product) => {
                const isActive = currentPlan === product.id
                return (
                  <div
                    key={product.id}
                    className={`relative rounded-lg border-2 p-4 transition-colors ${
                      isActive
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    {isActive && (
                      <Badge className="absolute -top-2.5 right-3 gap-1">
                        <Check className="h-3 w-3" />
                        Current
                      </Badge>
                    )}
                    {product.id === 'business' && !isActive && (
                      <Badge variant="secondary" className="absolute -top-2.5 right-3 gap-1">
                        <Crown className="h-3 w-3" />
                        Full Access
                      </Badge>
                    )}
                    <div className="mb-3">
                      <h3 className="font-semibold text-foreground">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">{product.description}</p>
                    </div>
                    <div className="mb-3">
                      <span className="text-2xl font-bold text-foreground">
                        {product.priceInCents === 0 ? 'Free' : `$${product.priceInCents / 100}`}
                      </span>
                      {product.priceInCents > 0 && (
                        <span className="text-sm text-muted-foreground">/mo</span>
                      )}
                    </div>
                    <ul className="mb-4 space-y-1">
                      {product.features.slice(0, 4).map((feature, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Check className="h-3 w-3 shrink-0 text-primary" />
                          {feature}
                        </li>
                      ))}
                      {product.features.length > 4 && (
                        <li className="text-xs text-muted-foreground">
                          +{product.features.length - 4} more
                        </li>
                      )}
                    </ul>
                    {isActive ? (
                      <Button variant="outline" size="sm" className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : product.priceInCents === 0 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={switchingPlan !== null}
                        onClick={handleDowngrade}
                      >
                        {switchingPlan === 'starter' ? (
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        ) : (
                          <ArrowDown className="mr-2 h-3 w-3" />
                        )}
                        Downgrade
                      </Button>
                    ) : (
                      <Button
                        variant={product.id === 'business' ? 'default' : 'outline'}
                        size="sm"
                        className="w-full"
                        onClick={() => handleUpgrade(product.id)}
                      >
                        Upgrade to {product.name}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
            {currentPlan !== 'starter' && (
              <div className="mt-4 flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Subscription Management</p>
                  <p className="text-xs text-muted-foreground">
                    Update payment method, view invoices, or cancel your subscription
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageBilling}
                  disabled={openingPortal}
                >
                  {openingPortal ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-3 w-3" />
                  )}
                  Manage Billing
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Profile</CardTitle>
            </div>
            <CardDescription>
              Your account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Contact support to change your email address
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                value={profile?.company_name || ''}
                onChange={(e) =>
                  setProfile(profile ? { ...profile, company_name: e.target.value } : null)
                }
                placeholder="Acme Inc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={profile?.timezone || ''}
                onChange={(e) =>
                  setProfile(profile ? { ...profile, timezone: e.target.value } : null)
                }
                placeholder="America/New_York"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Choose what notifications you receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email alerts for new conversations
                </p>
              </div>
              <Switch
                checked={profile?.email_notifications || false}
                onCheckedChange={(checked) =>
                  setProfile(profile ? { ...profile, email_notifications: checked } : null)
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weekly Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Receive weekly analytics summaries
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>
              Manage your account security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Password</Label>
                <p className="text-sm text-muted-foreground">
                  Change your account password
                </p>
              </div>
              <Button variant="outline" onClick={() => setPasswordDialogOpen(true)}>
                Change Password
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security
                </p>
              </div>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </div>
            <CardDescription>
              Irreversible actions for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Delete Account</Label>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      account and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your new password below. Must be at least 6 characters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || !newPassword || !confirmPassword}
            >
              {changingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
