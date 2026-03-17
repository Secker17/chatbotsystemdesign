export type PlanId = 'starter' | 'pro' | 'business'

export interface PlanLimits {
  maxChatbots: number
  maxConversationsPerMonth: number
  chatHistoryDays: number | null // null = unlimited
  aiEnabled: boolean
  aiMessagesPerMonth: number // -1 = unlimited
  cannedResponses: boolean
  analyticsEnabled: boolean
  fullCustomization: boolean
  removeBranding: boolean
  apiAccess: boolean
}

export interface Product {
  id: PlanId
  name: string
  description: string
  priceInCents: number
  interval?: 'month' | 'year'
  features: string[]
  popular?: boolean
  limits: PlanLimits
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  starter: {
    maxChatbots: 1,
    maxConversationsPerMonth: 100,
    chatHistoryDays: 7,
    aiEnabled: false,
    aiMessagesPerMonth: 0,
    cannedResponses: true,
    analyticsEnabled: false,
    fullCustomization: false,
    removeBranding: false,
    apiAccess: false,
  },
  pro: {
    maxChatbots: 5,
    maxConversationsPerMonth: 2000,
    chatHistoryDays: null,
    aiEnabled: true,
    aiMessagesPerMonth: 500,
    cannedResponses: true,
    analyticsEnabled: true,
    fullCustomization: true,
    removeBranding: false,
    apiAccess: false,
  },
  business: {
    maxChatbots: -1, // unlimited
    maxConversationsPerMonth: 10000,
    chatHistoryDays: null,
    aiEnabled: true,
    aiMessagesPerMonth: -1, // unlimited
    cannedResponses: true,
    analyticsEnabled: true,
    fullCustomization: true,
    removeBranding: true,
    apiAccess: true,
  },
}

export const PRODUCTS: Product[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small websites and personal projects',
    priceInCents: 0,
    interval: 'month',
    limits: PLAN_LIMITS.starter,
    features: [
      '1 Chatbot',
      '100 conversations/month',
      'Canned responses',
      'Basic customization',
      'Email support',
      '7-day chat history',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing businesses with more traffic',
    priceInCents: 2900,
    interval: 'month',
    popular: true,
    limits: PLAN_LIMITS.pro,
    features: [
      '5 Chatbots',
      '2,000 conversations/month',
      '500 AI messages/month',
      'Full customization',
      'Priority support',
      'Unlimited chat history',
      'AI Assistant',
      'Canned responses',
      'Analytics dashboard',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    description: 'For teams and enterprises with high volume',
    priceInCents: 9900,
    interval: 'month',
    limits: PLAN_LIMITS.business,
    features: [
      'Unlimited Chatbots',
      '10,000 conversations/month',
      'Unlimited AI messages',
      'Full customization',
      'Dedicated support',
      'Unlimited chat history',
      'AI Assistant',
      'Canned responses',
      'Advanced analytics',
      'API access',
      'Remove Vintra branding',
    ],
  },
]

export function getProduct(productId: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === productId)
}

export function getPlanLimits(planId: string): PlanLimits {
  return PLAN_LIMITS[planId as PlanId] || PLAN_LIMITS.starter
}

export function formatPrice(priceInCents: number): string {
  if (priceInCents === 0) return 'Free'
  return `$${(priceInCents / 100).toFixed(0)}`
}
