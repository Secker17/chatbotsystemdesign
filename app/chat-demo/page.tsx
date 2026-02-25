'use client'

import { useState, useEffect } from 'react'
import ChatInterface from '@/components/chat-interface'
import GlassOrbAvatar from '@/components/glass-orb-avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface DemoConfig {
  enabled: boolean
  chatbotId?: string
  widgetTitle?: string
  welcomeMessage?: string
  primaryColor?: string
  position?: string
  showBranding?: boolean
  placeholderText?: string
  quickReplies?: string[]
  greetingMessage?: string
  greetingSubtext?: string
}

export default function ChatDemoPage() {
  const [isTyping, setIsTyping] = useState(false)
  const [isBotTyping, setIsBotTyping] = useState(false)
  const [skin, setSkin] = useState<'default' | 'juleskin'>('default')
  const [demoConfig, setDemoConfig] = useState<DemoConfig | null>(null)

  useEffect(() => {
    fetch('/api/chat/demo-config')
      .then(r => r.json())
      .then(data => setDemoConfig(data))
      .catch(() => setDemoConfig({ enabled: false }))
  }, [])

  const simulateTyping = (sender: 'user' | 'bot') => {
    if (sender === 'user') {
      setIsTyping(true)
      setTimeout(() => setIsTyping(false), 3000)
    } else {
      setIsBotTyping(true)
      setTimeout(() => setIsBotTyping(false), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Glass Orb Avatar Demo
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Interactive demonstration of the customizable Glass Orb Avatar component 
            with different skins and states integrated into a chat interface.
          </p>
        </div>

        <Tabs defaultValue="avatars" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="avatars">Avatar Showcase</TabsTrigger>
            <TabsTrigger value="chat">Chat Interface</TabsTrigger>
          </TabsList>

          <TabsContent value="avatars" className="space-y-6">
            {/* Avatar States Grid */}
            <Card>
              <CardHeader>
                <CardTitle>Avatar States & Skins</CardTitle>
                <CardDescription>
                  Different visual states and customization options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {/* Default Skin States */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-center">Default Skin</h3>
                    
                    <div className="flex flex-col items-center space-y-2">
                      <GlassOrbAvatar
                        sender="bot"
                        isTyping={false}
                        size={80}
                        skin="default"
                        style={{}}
                        className=""
                      />
                      <Badge variant="secondary">Idle</Badge>
                      <Button 
                        size="sm" 
                        onClick={() => simulateTyping('bot')}
                        disabled={isBotTyping}
                      >
                        {isBotTyping ? 'Typing...' : 'Simulate Bot Typing'}
                      </Button>
                    </div>

                    <div className="flex flex-col items-center space-y-2">
                      <GlassOrbAvatar
                        sender="user"
                        isTyping={false}
                        size={80}
                        skin="default"
                        style={{}}
                        className=""
                      />
                      <Badge variant="secondary">User Idle</Badge>
                      <Button 
                        size="sm" 
                        onClick={() => simulateTyping('user')}
                        disabled={isTyping}
                      >
                        {isTyping ? 'Typing...' : 'Simulate User Typing'}
                      </Button>
                    </div>
                  </div>

                  {/* Christmas Skin */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-center">Christmas Skin</h3>
                    
                    <div className="flex flex-col items-center space-y-2">
                      <GlassOrbAvatar
                        sender="bot"
                        isTyping={false}
                        size={80}
                        skin="juleskin"
                        style={{}}
                        className=""
                      />
                      <Badge variant="secondary">Christmas Theme</Badge>
                      <p className="text-xs text-muted-foreground text-center">
                        Features animated tree, star, and falling snow
                      </p>
                    </div>

                    <div className="flex flex-col items-center space-y-2">
                      <GlassOrbAvatar
                        sender="bot"
                        isTyping={true}
                        size={80}
                        skin="juleskin"
                        style={{}}
                        className=""
                      />
                      <Badge variant="secondary">Christmas Typing</Badge>
                    </div>
                  </div>

                  {/* Maintenance Mode */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-center">Special States</h3>
                    
                    <div className="flex flex-col items-center space-y-2">
                      <GlassOrbAvatar
                        sender="bot"
                        isTyping={false}
                        maintenance={true}
                        size={80}
                        skin="default"
                        style={{}}
                        className=""
                      />
                      <Badge variant="destructive">Maintenance</Badge>
                      <p className="text-xs text-muted-foreground text-center">
                        Yellow/amber color scheme for maintenance mode
                      </p>
                    </div>

                    <div className="flex flex-col items-center space-y-2">
                      <GlassOrbAvatar
                        sender="bot"
                        isTyping={true}
                        size={80}
                        skin="default"
                        style={{}}
                        className=""
                      />
                      <Badge variant="secondary">Bot Typing</Badge>
                      <p className="text-xs text-muted-foreground text-center">
                        Red particles for AI responses
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Size Variations */}
            <Card>
              <CardHeader>
                <CardTitle>Size Variations</CardTitle>
                <CardDescription>
                  Different avatar sizes for various use cases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-end justify-center gap-4 sm:gap-8">
                  <div className="flex flex-col items-center space-y-2">
                    <GlassOrbAvatar
                      sender="bot"
                      isTyping={false}
                      size={24}
                      skin="default"
                      style={{}}
                      className=""
                    />
                    <span className="text-xs text-muted-foreground">24px</span>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-2">
                    <GlassOrbAvatar
                      sender="bot"
                      isTyping={false}
                      size={40}
                      skin="default"
                      style={{}}
                      className=""
                    />
                    <span className="text-xs text-muted-foreground">40px</span>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-2">
                    <GlassOrbAvatar
                      sender="bot"
                      isTyping={false}
                      size={60}
                      skin="default"
                      style={{}}
                      className=""
                    />
                    <span className="text-xs text-muted-foreground">60px</span>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-2">
                    <GlassOrbAvatar
                      sender="bot"
                      isTyping={false}
                      size={80}
                      skin="default"
                      style={{}}
                      className=""
                    />
                    <span className="text-xs text-muted-foreground">80px</span>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-2">
                    <GlassOrbAvatar
                      sender="bot"
                      isTyping={false}
                      size={120}
                      skin="default"
                      style={{}}
                      className=""
                    />
                    <span className="text-xs text-muted-foreground">120px</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Chat Interface</CardTitle>
                <CardDescription>
                  Full chat interface with Glass Orb Avatar integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Avatar Style:</span>
                    <div className="flex gap-2">
                      <Button
                        variant={skin === 'default' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSkin('default')}
                      >
                        Default
                      </Button>
                      <Button
                        variant={skin === 'juleskin' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSkin('juleskin')}
                      >
                        Christmas
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>• Click the chat button in the bottom-right to open the chat</p>
                    <p>• The Glass Orb Avatar shows typing states with different colors</p>
                    <p>• Try the Christmas skin for festive animations!</p>
                    <p>• Click on the orb to create particle explosions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ChatInterface
              chatbotId={demoConfig?.chatbotId || 'demo-chatbot'}
              primaryColor={demoConfig?.primaryColor || '#3b82f6'}
              avatarStyle={skin === 'juleskin' ? 'glass-orb' : 'glass-orb'}
              position={(demoConfig?.position as 'bottom-right' | 'bottom-left') || 'bottom-right'}
              widgetTitle={demoConfig?.widgetTitle}
              welcomeMessage={demoConfig?.welcomeMessage}
              placeholderText={demoConfig?.placeholderText}
              showBranding={demoConfig?.showBranding}

              quickReplies={demoConfig?.quickReplies}
              greetingMessage={demoConfig?.greetingMessage}
              greetingSubtext={demoConfig?.greetingSubtext}
            />
          </TabsContent>
        </Tabs>

        {/* Features */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>What makes the Glass Orb Avatar special</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">🎨 Dynamic Colors</h4>
                <p className="text-sm text-muted-foreground">
                  Changes color based on state (idle, typing, maintenance)
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">🌟 Interactive Particles</h4>
                <p className="text-sm text-muted-foreground">
                  Responds to mouse movement and clicks with particle physics
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">🎄 Theme Support</h4>
                <p className="text-sm text-muted-foreground">
                  Multiple skins including festive Christmas theme
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">📱 Responsive</h4>
                <p className="text-sm text-muted-foreground">
                  Automatically adjusts to different sizes and screen densities
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">⚡ Performance</h4>
                <p className="text-sm text-muted-foreground">
                  Optimized canvas rendering with smooth 60fps animations
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">🔧 Customizable</h4>
                <p className="text-sm text-muted-foreground">
                  Easy to integrate with existing chat systems
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
