'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface UpgradeBannerProps {
  feature: string
  description: string
  requiredPlan: 'pro' | 'business'
  currentPlan: string
}

export function UpgradeBanner({ feature, description, requiredPlan, currentPlan }: UpgradeBannerProps) {
  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center sm:flex-row sm:text-left">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">{feature} requires {requiredPlan === 'pro' ? 'Pro' : 'Business'} plan</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {description} You are currently on the <span className="font-medium capitalize">{currentPlan}</span> plan.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/pricing">
            Upgrade to {requiredPlan === 'pro' ? 'Pro' : 'Business'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
