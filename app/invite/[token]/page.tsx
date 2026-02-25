'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

const VINTRA_LOGO = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/vintratext-skOk2ureyF4j9EWL7jotcLG1aD5kpr.png"

export default function AcceptInvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function acceptInvite() {
      try {
        const res = await fetch('/api/team/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const data = await res.json()

        if (res.ok) {
          setStatus('success')
          setMessage(data.message || 'Successfully joined the team!')
        } else {
          setStatus('error')
          setMessage(data.error || 'Failed to accept invitation')
        }
      } catch {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      }
    }

    if (token) {
      acceptInvite()
    }
  }, [token])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mb-4 inline-block">
            <Image
              src={VINTRA_LOGO}
              alt="Vintra"
              width={120}
              height={40}
              className="mx-auto h-8 w-auto"
            />
          </Link>
          <CardTitle className="text-xl">
            {status === 'loading' && 'Accepting Invitation...'}
            {status === 'success' && 'Welcome to the Team!'}
            {status === 'error' && 'Invitation Error'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we process your invitation.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'loading' && (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-center text-sm text-muted-foreground">{message}</p>
              <Button onClick={() => router.push('/admin')} className="w-full">
                Go to Dashboard
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-center text-sm text-muted-foreground">{message}</p>
              <div className="flex w-full gap-3">
                <Button variant="outline" onClick={() => router.push('/auth/login')} className="flex-1">
                  Sign In
                </Button>
                <Button onClick={() => router.push('/auth/sign-up')} className="flex-1">
                  Sign Up
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
