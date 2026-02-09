import { createClient } from '@/lib/supabase/server'
import { getPlanLimits, type PlanId } from '@/lib/products'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('plan, subscription_status, conversations_this_month, conversations_reset_at')
      .eq('id', user.id)
      .single()

    const planId = (profile?.plan as PlanId) || 'starter'
    const limits = getPlanLimits(planId)

    return NextResponse.json({
      planId,
      limits,
      subscriptionStatus: profile?.subscription_status || null,
      conversationsThisMonth: profile?.conversations_this_month || 0,
      conversationsResetAt: profile?.conversations_reset_at || null,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
