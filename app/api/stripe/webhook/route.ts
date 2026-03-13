import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createPublicClient } from '@/lib/supabase/public'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set. Please add it to your environment variables.')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
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
        const planId = session.metadata?.plan_id

        if (!userId) {
          console.error('No user_id in checkout session metadata')
          break
        }

        // Use plan_id from metadata (set during checkout creation)
        // Fallback to amount-based detection for legacy sessions
        let plan = planId || 'starter'
        if (!planId) {
          if (session.amount_total === 2900) {
            plan = 'pro'
          } else if (session.amount_total === 9900) {
            plan = 'business'
          }
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

        console.log(`Checkout completed for user ${userId}, plan: ${plan}`)
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

          // Use plan_id from subscription metadata (set during checkout creation)
          // Fallback to price-based detection for legacy subscriptions
          const metaPlan = subscription.metadata?.plan_id
          let plan = metaPlan || 'starter'
          if (!metaPlan) {
            const priceAmount = subscription.items.data[0]?.price?.unit_amount
            if (priceAmount === 2900) {
              plan = 'pro'
            } else if (priceAmount === 9900) {
              plan = 'business'
            }
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

          console.log(`Subscription updated for profile ${profile.id}, plan: ${plan}, status: ${status}`)
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

          console.log(`Subscription deleted for profile ${profile.id}, downgraded to starter`)
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

          console.log(`Payment failed for profile ${profile.id}, marked as past_due`)
        }
        break
      }

      // Handle Stripe Connect / account-related events
      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        console.log(`Account updated: ${account.id}, charges_enabled: ${account.charges_enabled}, payouts_enabled: ${account.payouts_enabled}`)
        break
      }

      case 'capability.updated': {
        const capability = event.data.object as Stripe.Capability
        console.log(`Capability updated: ${capability.id}, status: ${capability.status}, account: ${capability.account}`)
        break
      }

      default: {
        console.log(`Unhandled event type: ${event.type}`)
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
