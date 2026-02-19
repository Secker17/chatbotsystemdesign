import React from "react"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import '../admin-animations.css'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    // In development mode, allow access without authentication
    // but provide mock data
    const mockUser = {
      id: 'dev-user',
      email: 'dev@example.com',
      user_metadata: { name: 'Development User' },
      app_metadata: {},
      aud: 'dev',
      created_at: new Date().toISOString()
    }
    
    const mockProfile = {
      id: 'dev-profile',
      user_id: 'dev-user',
      full_name: 'Development User',
      company_name: null,
      avatar_url: null,
      plan: 'free'
    }
    
    const mockChatbot = {
      id: 'dev-chatbot',
      admin_id: 'dev-user',
      widget_title: 'Chat with us',
      welcome_message: 'Hi! How can we help you today?',
      primary_color: '#eab308',
      position: 'bottom-right',
      avatar_url: null,
      show_branding: true,
      offline_message: 'We are currently offline. Leave a message!',
      placeholder_text: 'Type your message...',
      launcher_text: null,
      launcher_text_enabled: false,
      business_hours_enabled: false,
      business_hours: null,
      business_hours_timezone: null,
      outside_hours_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return (
      <SidebarProvider>
        <AdminSidebar user={mockUser} profile={mockProfile} />
        <SidebarInset>
          <AdminHeader user={mockUser} chatbotId={mockChatbot?.id} />
          <main className="flex-1 overflow-auto p-6">
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Development Mode:</strong> Du bruker mock data. 
                Endringer blir ikke lagret. Konfigurer Supabase for ekte funksjonalitet.
              </p>
            </div>
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  let user = null
  let profile = null
  let chatbot = null

  try {
    const supabase = await createClient()
    const { data: { user: authUser }, error } = await supabase.auth.getUser()

    if (!authUser || error) {
      redirect('/auth/login')
    }

    user = authUser

    // Fetch admin profile
    const { data: profileData } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = profileData

    // Fetch chatbot config
    const { data: chatbotData } = await supabase
      .from('chatbot_configs')
      .select('*')
      .eq('admin_id', user.id)
      .single()
    chatbot = chatbotData
  } catch (e) {
    // If it's a redirect, rethrow it
    if (e && typeof e === 'object' && 'digest' in e) throw e
    // Otherwise redirect to login
    redirect('/auth/login')
  }

  return (
    <SidebarProvider>
      <AdminSidebar user={user} profile={profile} />
      <SidebarInset>
        <AdminHeader user={user} chatbotId={chatbot?.id} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
