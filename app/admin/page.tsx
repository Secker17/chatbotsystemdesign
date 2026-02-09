import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from 'lucide-react'
import { getPlanLimits, getProduct, type PlanId } from '@/lib/products'

async function getDashboardStats(adminId: string) {
  const supabase = await createClient()
  
  // Get total sessions
  const { count: totalSessions } = await supabase
    .from('chat_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('admin_id', adminId)

  // Get total messages
  const { count: totalMessages } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('admin_id', adminId)

  // Get recent sessions (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const { count: recentSessions } = await supabase
    .from('chat_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('admin_id', adminId)
    .gte('created_at', sevenDaysAgo.toISOString())

  // Get active sessions
  const { count: activeSessions } = await supabase
    .from('chat_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('admin_id', adminId)
    .eq('status', 'active')

  return {
    totalSessions: totalSessions || 0,
    totalMessages: totalMessages || 0,
    recentSessions: recentSessions || 0,
    activeSessions: activeSessions || 0,
  }
}

async function getRecentConversations(adminId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('chat_sessions')
    .select(`
      id,
      visitor_name,
      visitor_email,
      status,
      created_at,
      chat_messages (
        id,
        content,
        sender_type,
        created_at
      )
    `)
    .eq('admin_id', adminId)
    .order('created_at', { ascending: false })
    .limit(5)

  return data || []
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const stats = await getDashboardStats(user.id)
  const recentConversations = await getRecentConversations(user.id)

  // Fetch plan info
  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('plan, conversations_this_month, conversations_reset_at')
    .eq('id', user.id)
    .single()

  const planId = (profile?.plan as PlanId) || 'starter'
  const planLimits = getPlanLimits(planId)
  const product = getProduct(planId)
  const conversationsUsed = profile?.conversations_this_month || 0
  const conversationsPercent = Math.min(100, Math.round((conversationsUsed / planLimits.maxConversationsPerMonth) * 100))

  const statCards = [
    {
      title: 'Total Conversations',
      value: stats.totalSessions,
      icon: Users,
      change: '+12%',
      trend: 'up',
    },
    {
      title: 'Messages',
      value: stats.totalMessages,
      icon: MessageSquare,
      change: '+8%',
      trend: 'up',
    },
    {
      title: 'Active Now',
      value: stats.activeSessions,
      icon: Clock,
      change: stats.activeSessions > 0 ? 'Live' : 'None',
      trend: 'neutral',
    },
    {
      title: 'This Week',
      value: stats.recentSessions,
      icon: TrendingUp,
      change: '+5%',
      trend: 'up',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your chatbot performance.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs">
                {stat.trend === 'up' && (
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                )}
                {stat.trend === 'down' && (
                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                )}
                <span className={
                  stat.trend === 'up' 
                    ? 'text-green-600' 
                    : stat.trend === 'down' 
                    ? 'text-red-600' 
                    : 'text-muted-foreground'
                }>
                  {stat.change}
                </span>
                {stat.trend !== 'neutral' && (
                  <span className="text-muted-foreground">from last week</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Usage */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Plan Usage
              <Badge variant={planId === 'starter' ? 'secondary' : 'default'}>
                {product?.name || 'Starter'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Your current plan limits and usage this month
            </CardDescription>
          </div>
          {planId !== 'business' && (
            <Button asChild size="sm">
              <Link href="/pricing">
                <Zap className="mr-2 h-4 w-4" />
                Upgrade
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Conversations</span>
                <span className="font-medium">{conversationsUsed} / {planLimits.maxConversationsPerMonth.toLocaleString()}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full transition-all ${conversationsPercent > 80 ? 'bg-amber-500' : 'bg-primary'}`}
                  style={{ width: `${conversationsPercent}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">AI Assistant</span>
              <div className="flex items-center gap-2">
                <Badge variant={planLimits.aiEnabled ? 'default' : 'secondary'}>
                  {planLimits.aiEnabled ? 'Enabled' : 'Locked'}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Chat History</span>
              <p className="text-sm font-medium">
                {planLimits.chatHistoryDays === null ? 'Unlimited' : `${planLimits.chatHistoryDays} days`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Conversations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
          <CardDescription>
            Latest chat sessions from your visitors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No conversations yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Install the widget on your website to start receiving chats.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentConversations.map((conversation) => {
                const lastMessage = conversation.chat_messages?.[conversation.chat_messages.length - 1]
                return (
                  <div
                    key={conversation.id}
                    className="flex items-start justify-between rounded-lg border p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {conversation.visitor_name || 'Anonymous Visitor'}
                        </span>
                        <Badge 
                          variant={conversation.status === 'active' ? 'default' : 'secondary'}
                        >
                          {conversation.status}
                        </Badge>
                      </div>
                      {conversation.visitor_email && (
                        <p className="text-xs text-muted-foreground">
                          {conversation.visitor_email}
                        </p>
                      )}
                      {lastMessage && (
                        <p className="line-clamp-1 text-sm text-muted-foreground">
                          {lastMessage.content}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(conversation.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
