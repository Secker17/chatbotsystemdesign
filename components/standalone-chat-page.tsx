'use client'

/**
 * Vintra Chat Widget - Standalone Page Component
 * 
 * Copy this entire file to your own Next.js project at: app/chat/page.tsx (or any route you want)
 * 
 * Then import in your layout if needed. That's it - it will automatically load your Vintra chatbot!
 * 
 * Configuration:
 * Replace CHATBOT_ID_HERE with your actual chatbot ID from your Vintra dashboard.
 * All settings (colors, messages, etc.) are pulled automatically from Vintra.
 */

import dynamic from 'next/dynamic'

// Dynamically import the chat interface to avoid SSR issues
const VintraChatEmbed = dynamic(
  () => import('@/components/vintra-chat-embed'),
  { ssr: false }
)

export default function ChatPage() {
  return <VintraChatEmbed chatbotId="CHATBOT_ID_HERE" />
}
