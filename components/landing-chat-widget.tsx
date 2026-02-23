'use client'

import ChatInterface from '@/components/chat-interface'

export function LandingChatWidget() {
  return (
    <ChatInterface
      chatbotId="demo-chatbot"
      primaryColor="hsl(45, 100%, 60%)"
      avatarStyle="glass-orb"
      position="bottom-right"
    />
  )
}
