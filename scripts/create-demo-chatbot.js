#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function createDemoChatbot() {
  try {
    console.log('[v0] Creating demo chatbot...')

    // Get first admin profile
    const { data: admins, error: adminError } = await supabase
      .from('admin_profiles')
      .select('id')
      .limit(1)

    if (adminError || !admins || admins.length === 0) {
      console.error('[v0] Error: No admin profiles found. Please create an admin profile first.')
      process.exit(1)
    }

    const adminId = admins[0].id
    console.log('[v0] Using admin ID:', adminId)

    // Create demo chatbot config
    const { data: chatbot, error: insertError } = await supabase
      .from('chatbot_configs')
      .insert({
        id: '0ec5b8f2-42fd-4029-90e8-0c5d6d98bc98',
        admin_id: adminId,
        widget_title: 'Chat with us',
        welcome_message: 'Hi! How can we help you today?',
        primary_color: '#3b82f6',
        position: 'bottom-right',
        avatar_url: 'icon:glass-orb',
        show_branding: true,
        offline_message: 'We are currently offline. Leave a message!',
        placeholder_text: 'Type your message...',
        launcher_text: 'Talk to us',
        launcher_text_enabled: true,
        business_hours_enabled: false,
        business_hours_timezone: 'UTC',
        greeting_message: 'Hello! Welcome to our support chat.',
        greeting_subtext: 'How can I help you today?',
        quick_replies: ['What is this?', 'How does it work?', 'Tell me more'],
        is_landing_widget: true,
        landing_widget_enabled: true,
        ai_enabled: false,
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        console.log('[v0] Demo chatbot already exists with ID: 0ec5b8f2-42fd-4029-90e8-0c5d6d98bc98')
      } else {
        console.error('[v0] Error creating chatbot:', insertError)
        process.exit(1)
      }
    } else {
      console.log('[v0] ✅ Demo chatbot created successfully!')
      console.log('[v0] Chatbot ID:', chatbot.id)
      console.log('[v0] Admin ID:', chatbot.admin_id)
    }

  } catch (error) {
    console.error('[v0] Unexpected error:', error)
    process.exit(1)
  }
}

createDemoChatbot()
