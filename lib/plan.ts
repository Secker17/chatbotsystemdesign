import { createClient } from '@/lib/supabase/server'
import { getPlanLimits, type PlanId, type PlanLimits } from '@/lib/products'

export interface UserPlan {
  planId: PlanId
  limits: PlanLimits
  subscriptionStatus: string | null
  conversationsThisMonth: number
  conversationsResetAt: string | null
}

export async function getUserPlan(userId: string): Promise<UserPlan> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('plan, subscription_status, conversations_this_month, conversations_reset_at')
    .eq('id', userId)
    .single()

  const planId = (profile?.plan as PlanId) || 'starter'
  const limits = getPlanLimits(planId)

  return {
    planId,
    limits,
    subscriptionStatus: profile?.subscription_status || null,
    conversationsThisMonth: profile?.conversations_this_month || 0,
    conversationsResetAt: profile?.conversations_reset_at || null,
  }
}

export async function getUserPlanClient(supabase: ReturnType<typeof import('@/lib/supabase/client').createClient>, userId: string): Promise<UserPlan> {
  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('plan, subscription_status, conversations_this_month, conversations_reset_at')
    .eq('id', userId)
    .single()

  const planId = (profile?.plan as PlanId) || 'starter'
  const limits = getPlanLimits(planId)

  return {
    planId,
    limits,
    subscriptionStatus: profile?.subscription_status || null,
    conversationsThisMonth: profile?.conversations_this_month || 0,
    conversationsResetAt: profile?.conversations_reset_at || null,
  }
}

export function canUseFeature(plan: UserPlan, feature: keyof PlanLimits): boolean {
  const value = plan.limits[feature]
  if (typeof value === 'boolean') return value
  return true
}

export function hasConversationsLeft(plan: UserPlan): boolean {
  return plan.conversationsThisMonth < plan.limits.maxConversationsPerMonth
}

export function getUpgradePlan(currentPlan: PlanId): PlanId | null {
  if (currentPlan === 'starter') return 'pro'
  if (currentPlan === 'pro') return 'business'
  return null
}
