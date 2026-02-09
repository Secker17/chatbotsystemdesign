'use server'

import { stripe } from '@/lib/stripe'
import { PRODUCTS } from '@/lib/products'
import { createClient } from '@/lib/supabase/server'

export async function startCheckoutSession(productId: string): Promise<string> {
  const product = PRODUCTS.find((p) => p.id === productId)
  if (!product) {
    throw new Error(`Product with id "${productId}" not found`)
  }

  // Free plan - no checkout needed
  if (product.priceInCents === 0) {
    throw new Error('Free plan does not require checkout')
  }

  // Get the current user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in to subscribe')
  }

  // Check if user already has a stripe customer ID
  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  // Create Checkout Session for subscription
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    customer: profile?.stripe_customer_id || undefined,
    customer_email: !profile?.stripe_customer_id ? user.email : undefined,
    metadata: {
      user_id: user.id,
      plan_id: product.id,
    },
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
          recurring: product.interval ? { interval: product.interval } : undefined,
        },
        quantity: 1,
      },
    ],
    mode: product.interval ? 'subscription' : 'payment',
    subscription_data: product.interval ? {
      metadata: {
        user_id: user.id,
        plan_id: product.id,
      },
    } : undefined,
  })

  if (!session.client_secret) {
    throw new Error('Failed to create checkout session')
  }

  return session.client_secret
}
