import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST /api/plan/update — only allows downgrade to starter (free)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan } = await request.json()

    // Only allow downgrade to starter — upgrades must go through Stripe checkout
    if (plan !== 'starter') {
      return NextResponse.json(
        { error: 'Upgrades require payment. Use the checkout page to upgrade.' },
        { status: 403 }
      )
    }

    const db = getServiceClient()

    // Get current profile to cancel Stripe subscription if active
    const { data: profile } = await db
      .from('admin_profiles')
      .select('stripe_subscription_id, plan')
      .eq('id', user.id)
      .single()

    if (profile?.plan === 'starter') {
      return NextResponse.json({ error: 'Already on the Starter plan' }, { status: 400 })
    }

    // Cancel Stripe subscription if one exists
    if (profile?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(profile.stripe_subscription_id)
      } catch (err) {
        console.error('Failed to cancel Stripe subscription:', err)
        // Continue anyway — the webhook will handle the DB update too
      }
    }

    // Update plan in DB
    const { error } = await db
      .from('admin_profiles')
      .update({
        plan: 'starter',
        subscription_status: 'canceled',
        stripe_subscription_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      console.error('Plan downgrade error:', error)
      return NextResponse.json({ error: 'Failed to downgrade plan' }, { status: 500 })
    }

    return NextResponse.json({ success: true, planId: 'starter' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
