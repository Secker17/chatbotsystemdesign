import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { PlanId } from '@/lib/products'
import { getPlanLimits } from '@/lib/products'

const VALID_PLANS: PlanId[] = ['starter', 'pro', 'business']

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan } = await request.json()

    if (!plan || !VALID_PLANS.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const { error } = await supabase
      .from('admin_profiles')
      .update({
        plan,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      console.error('Plan update error:', error)
      return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
    }

    const limits = getPlanLimits(plan)

    return NextResponse.json({
      success: true,
      planId: plan,
      limits,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
