import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createPublicClient } from '@/lib/supabase/public'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  const supabase = createPublicClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const userId = session.metadata?.user_id

        if (!userId) {
          console.error('No user_id in checkout session metadata')
          break
        }

        // Determine plan from the price amount
        let plan = 'starter'
        if (session.amount_total === 2900) {
          plan = 'pro'
        } else if (session.amount_total === 9900) {
          plan = 'business'
        }

        await supabase
          .from('admin_profiles')
          .update({
            plan,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: 'active',
            plan_period_start: new Date().toISOString(),
            plan_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            conversations_this_month: 0,
            conversations_reset_at: new Date().toISOString(),
          })
          .eq('id', userId)

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by stripe_customer_id
        const { data: profile } = await supabase
          .from('admin_profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          const status = subscription.status
          const periodEnd = new Date(subscription.current_period_end * 1000).toISOString()
          const periodStart = new Date(subscription.current_period_start * 1000).toISOString()

          // Determine plan from subscription items price
          let plan = 'starter'
          const priceAmount = subscription.items.data[0]?.price?.unit_amount
          if (priceAmount === 2900) {
            plan = 'pro'
          } else if (priceAmount === 9900) {
            plan = 'business'
          }

          await supabase
            .from('admin_profiles')
            .update({
              plan,
              subscription_status: status,
              plan_period_start: periodStart,
              plan_period_end: periodEnd,
            })
            .eq('id', profile.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: profile } = await supabase
          .from('admin_profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          await supabase
            .from('admin_profiles')
            .update({
              plan: 'starter',
              subscription_status: 'canceled',
              stripe_subscription_id: null,
            })
            .eq('id', profile.id)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: profile } = await supabase
          .from('admin_profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          await supabase
            .from('admin_profiles')
            .update({ subscription_status: 'past_due' })
            .eq('id', profile.id)
        }
        break
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
