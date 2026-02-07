import { NextResponse } from 'next/server'

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET() {
  const widgetScript = `
(function() {
  'use strict';
  
  // Configuration
  const scriptTag = document.currentScript || document.querySelector('script[data-chatbot-id]');
  const chatbotId = scriptTag ? scriptTag.getAttribute('data-chatbot-id') : null;
  
  if (!chatbotId) {
    console.error('VintraStudio: Missing data-chatbot-id attribute');
    return;
  }
  
  // Extract the base URL from the script src
  let API_BASE = '';
  try {
    const url = new URL(scriptTag.src);
    API_BASE = url.origin;
  } catch (e) {
    API_BASE = window.location.origin;
  }
  
  // Styles
  const styles = \`
    .vintra-widget-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    .vintra-widget-container.position-left {
      right: auto;
      left: 20px;
    }
    .vintra-launcher {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      transition: transform 0.2s, box-shadow 0.2s;
      position: relative;
    }
    .vintra-launcher:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
    }
    .vintra-launcher svg {
      width: 28px;
      height: 28px;
      fill: white;
    }
    .vintra-unread-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 20px;
      height: 20px;
      background: #ef4444;
      border-radius: 50%;
      color: white;
      font-size: 11px;
      font-weight: 700;
      display: none;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
    }
    .vintra-unread-badge.show {
      display: flex;
    }
    .vintra-launcher-row {
      display: flex;
      align-items: center;
      gap: 10px;
      justify-content: flex-end;
    }
    .vintra-widget-container.position-left .vintra-launcher-row {
      flex-direction: row-reverse;
    }
    .vintra-launcher-text {
      display: none;
      padding: 8px 16px;
      border-radius: 20px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      animation: vintraFadeIn 0.4s ease;
    }
    .vintra-launcher-text:hover {
      transform: scale(1.03);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
    }
    .vintra-launcher-text.show {
      display: block;
    }
    @keyframes vintraFadeIn {
      from { opacity: 0; transform: translateX(10px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .vintra-offline-overlay {
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex: 1;
      padding: 32px 20px;
      text-align: center;
    }
    .vintra-offline-overlay.show {
      display: flex;
    }
    .vintra-offline-overlay .vintra-offline-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .vintra-offline-overlay .vintra-offline-icon svg {
      width: 24px;
      height: 24px;
      fill: #9ca3af;
    }
    .vintra-offline-overlay h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #374151;
    }
    .vintra-offline-overlay p {
      margin: 0;
      font-size: 14px;
      color: #6b7280;
      line-height: 1.5;
    }
    .vintra-chat-window {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 400px;
      max-width: calc(100vw - 40px);
      height: 560px;
      max-height: calc(100vh - 120px);
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      display: none;
      flex-direction: column;
      overflow: hidden;
      animation: vintraSlideUp 0.3s ease;
    }
    .vintra-widget-container.position-left .vintra-chat-window {
      right: auto;
      left: 0;
    }
    .vintra-chat-window.open {
      display: flex;
    }
    @keyframes vintraSlideUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .vintra-header {
      padding: 16px 20px;
      color: white;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }
    .vintra-header-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .vintra-header-avatar svg {
      width: 24px;
      height: 24px;
      fill: white;
    }
    .vintra-header-info h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    .vintra-header-info p {
      margin: 2px 0 0;
      font-size: 12px;
      opacity: 0.85;
    }
    .vintra-header-status {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .vintra-status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #4ade80;
      animation: vintraPulse 2s infinite;
    }
    .vintra-status-dot.ai {
      background: #a78bfa;
    }
    .vintra-status-dot.waiting {
      background: #fbbf24;
      animation: none;
    }
    @keyframes vintraPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .vintra-close {
      margin-left: auto;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
      flex-shrink: 0;
    }
    .vintra-close:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    .vintra-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .vintra-message {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
      white-space: pre-wrap;
    }
    .vintra-message.bot {
      background: #f0f0f0;
      color: #333;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .vintra-message.visitor {
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .vintra-message.admin {
      background: #e8f5e9;
      color: #333;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .vintra-message.system {
      align-self: center;
      background: transparent;
      color: #888;
      font-size: 12px;
      text-align: center;
      padding: 8px 16px;
      max-width: 100%;
    }
    .vintra-msg-label {
      font-size: 11px;
      color: #999;
      margin-bottom: 3px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .vintra-msg-label.right {
      justify-content: flex-end;
    }
    .vintra-msg-label svg {
      width: 12px;
      height: 12px;
    }
    .vintra-msg-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .vintra-msg-group.visitor {
      align-items: flex-end;
    }
    .vintra-msg-group.bot, .vintra-msg-group.admin {
      align-items: flex-start;
    }
    .vintra-typing {
      display: none;
      align-self: flex-start;
      padding: 12px 16px;
      background: #f0f0f0;
      border-radius: 16px;
      border-bottom-left-radius: 4px;
    }
    .vintra-typing.show {
      display: block;
    }
    .vintra-typing-dots {
      display: flex;
      gap: 4px;
    }
    .vintra-typing-dots span {
      width: 8px;
      height: 8px;
      background: #999;
      border-radius: 50%;
      animation: vintraBounce 1.4s infinite ease-in-out both;
    }
    .vintra-typing-dots span:nth-child(1) { animation-delay: -0.32s; }
    .vintra-typing-dots span:nth-child(2) { animation-delay: -0.16s; }
    @keyframes vintraBounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
    .vintra-input-area {
      padding: 12px 16px;
      border-top: 1px solid #eee;
      display: flex;
      gap: 8px;
      align-items: center;
      flex-shrink: 0;
    }
    .vintra-input {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 24px;
      padding: 10px 16px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
      font-family: inherit;
    }
    .vintra-input:focus {
      border-color: var(--vintra-primary, #14b8a6);
    }
    .vintra-send {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s;
      flex-shrink: 0;
    }
    .vintra-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .vintra-send svg {
      width: 18px;
      height: 18px;
      fill: white;
    }
    .vintra-branding {
      text-align: center;
      padding: 8px;
      font-size: 11px;
      color: #999;
      flex-shrink: 0;
    }
    .vintra-branding a {
      color: #666;
      text-decoration: none;
    }
    .vintra-branding a:hover {
      text-decoration: underline;
    }
    .vintra-pre-chat {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      flex: 1;
    }
    .vintra-pre-chat.hidden {
      display: none;
    }
    .vintra-pre-chat h3 {
      margin: 0;
      font-size: 18px;
      color: #333;
    }
    .vintra-pre-chat p {
      margin: 0;
      font-size: 14px;
      color: #666;
    }
    .vintra-pre-chat input {
      padding: 12px 16px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      font-family: inherit;
    }
    .vintra-pre-chat input:focus {
      border-color: var(--vintra-primary, #14b8a6);
    }
    .vintra-pre-chat button {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: white;
      cursor: pointer;
      transition: opacity 0.2s;
      font-family: inherit;
    }
    .vintra-pre-chat button:hover {
      opacity: 0.9;
    }
    .vintra-handoff-banner {
      display: none;
      padding: 10px 16px;
      background: #fef3c7;
      border-bottom: 1px solid #fde68a;
      text-align: center;
      font-size: 13px;
      color: #92400e;
      flex-shrink: 0;
    }
    .vintra-handoff-banner.show {
      display: block;
    }
    .vintra-handoff-btn {
      display: none;
      margin: 0 16px 8px;
      padding: 10px 16px;
      background: transparent;
      border: 1px dashed #ccc;
      border-radius: 12px;
      color: #666;
      font-size: 13px;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
      font-family: inherit;
      flex-shrink: 0;
    }
    .vintra-handoff-btn:hover {
      border-color: #999;
      color: #333;
      background: #f9f9f9;
    }
    .vintra-handoff-btn.show {
      display: block;
    }
    .vintra-quick-actions {
      display: none;
      padding: 0 16px 8px;
      flex-wrap: wrap;
      gap: 6px;
      flex-shrink: 0;
    }
    .vintra-quick-actions.show {
      display: flex;
    }
    .vintra-quick-action {
      padding: 6px 12px;
      border: 1px solid #e0e0e0;
      border-radius: 16px;
      background: #fff;
      font-size: 12px;
      color: #555;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
    }
    .vintra-quick-action:hover {
      border-color: var(--vintra-primary, #14b8a6);
      color: var(--vintra-primary, #14b8a6);
      background: #f0fdf4;
    }
    @media (max-width: 480px) {
      .vintra-chat-window {
        width: calc(100vw - 20px);
        height: calc(100vh - 100px);
        bottom: 70px;
        right: 10px;
        border-radius: 12px;
      }
      .vintra-widget-container.position-left .vintra-chat-window {
        left: 10px;
      }
    }
  \`;
  
  // Inject styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
  
  // State
  let config = null;
  let sessionId = null;
  let visitorName = '';
  let visitorEmail = '';
  let isOpen = false;
  let hasStartedChat = false;
  let isBotActive = false;
  let isWaitingForHuman = false;
  let isSending = false;
  let unreadCount = 0;
  let isOffline = false;
  
  // Icons
  const icons = {
    chat: '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
    bot: '<svg viewBox="0 0 24 24"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.07A7.001 7.001 0 0 1 7.07 19H6a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM9.5 14a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>',
    user: '<svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/></svg>',
    handoff: '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>'
  };
  
  // Create widget
  function createWidget() {
    const container = document.createElement('div');
    container.className = 'vintra-widget-container';
    container.innerHTML = \`
      <div class="vintra-chat-window">
        <div class="vintra-header">
          <div class="vintra-header-avatar">\${icons.bot}</div>
          <div class="vintra-header-info">
            <h4 class="vintra-title">Chat with us</h4>
            <div class="vintra-header-status">
              <div class="vintra-status-dot ai"></div>
              <p class="vintra-status-text">AI Assistant</p>
            </div>
          </div>
          <button class="vintra-close">\${icons.close}</button>
        </div>
        <div class="vintra-handoff-banner">
          \${icons.handoff} Waiting for a human agent to join...
        </div>
        <div class="vintra-pre-chat">
          <h3>Start a conversation</h3>
          <p>Please provide your details to begin chatting.</p>
          <input type="text" class="vintra-name-input" placeholder="Your name">
          <input type="email" class="vintra-email-input" placeholder="Your email (optional)">
          <button class="vintra-start-btn">Start Chat</button>
        </div>
        <div class="vintra-offline-overlay">
          <div class="vintra-offline-icon">\${icons.bot}</div>
          <h3>We're currently offline</h3>
          <p class="vintra-offline-msg">We're currently offline. Leave a message and we'll get back to you!</p>
        </div>
        <div class="vintra-messages" style="display: none;"></div>
        <div class="vintra-typing">
          <div class="vintra-typing-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
        <div class="vintra-quick-actions">
          <button class="vintra-quick-action" data-msg="What services do you offer?">What services do you offer?</button>
          <button class="vintra-quick-action" data-msg="What are your pricing plans?">Pricing</button>
          <button class="vintra-quick-action" data-msg="I need help with my account">Account help</button>
        </div>
        <button class="vintra-handoff-btn">\${icons.handoff} Talk to a human agent</button>
        <div class="vintra-input-area" style="display: none;">
          <input type="text" class="vintra-input" placeholder="Type your message...">
          <button class="vintra-send">\${icons.send}</button>
        </div>
        <div class="vintra-branding" style="display: none;">
          Powered by <a href="https://vintrastudio.com" target="_blank">VintraStudio</a>
        </div>
      </div>
      <div class="vintra-launcher-row">
        <span class="vintra-launcher-text">Talk to us</span>
        <button class="vintra-launcher">
          \${icons.chat}
          <span class="vintra-unread-badge">0</span>
        </button>
      </div>
    \`;
    document.body.appendChild(container);
    
    // Elements
    const launcher = container.querySelector('.vintra-launcher');
    const chatWindow = container.querySelector('.vintra-chat-window');
    const closeBtn = container.querySelector('.vintra-close');
    const messagesContainer = container.querySelector('.vintra-messages');
    const input = container.querySelector('.vintra-input');
    const sendBtn = container.querySelector('.vintra-send');
    const preChat = container.querySelector('.vintra-pre-chat');
    const inputArea = container.querySelector('.vintra-input-area');
    const branding = container.querySelector('.vintra-branding');
    const nameInput = container.querySelector('.vintra-name-input');
    const emailInput = container.querySelector('.vintra-email-input');
    const startBtn = container.querySelector('.vintra-start-btn');
    const header = container.querySelector('.vintra-header');
    const title = container.querySelector('.vintra-title');
    const typingIndicator = container.querySelector('.vintra-typing');
    const statusDot = container.querySelector('.vintra-status-dot');
    const statusText = container.querySelector('.vintra-status-text');
    const handoffBanner = container.querySelector('.vintra-handoff-banner');
    const handoffBtn = container.querySelector('.vintra-handoff-btn');
    const unreadBadge = container.querySelector('.vintra-unread-badge');
    const quickActions = container.querySelector('.vintra-quick-actions');
    const quickActionBtns = container.querySelectorAll('.vintra-quick-action');
    const launcherText = container.querySelector('.vintra-launcher-text');
    const offlineOverlay = container.querySelector('.vintra-offline-overlay');
    const offlineMsg = container.querySelector('.vintra-offline-msg');
    
    // Event handlers
    launcher.addEventListener('click', () => toggleChat(true));
    launcherText.addEventListener('click', () => toggleChat(true));
    closeBtn.addEventListener('click', () => toggleChat(false));
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
    startBtn.addEventListener('click', startChat);
    handoffBtn.addEventListener('click', requestHandoff);
    
    // Quick action buttons
    quickActionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const msg = btn.getAttribute('data-msg');
        if (msg) {
          input.value = msg;
          sendMessage();
          quickActions.classList.remove('show');
        }
      });
    });
    
    function toggleChat(open) {
      isOpen = open;
      chatWindow.classList.toggle('open', open);
      if (open) {
        unreadCount = 0;
        unreadBadge.classList.remove('show');
        unreadBadge.textContent = '0';
        // Hide launcher text when chat is open
        launcherText.classList.remove('show');
        
        // Show offline overlay if outside business hours
        if (isOffline && !hasStartedChat) {
          offlineOverlay.classList.add('show');
          preChat.classList.add('hidden');
          messagesContainer.style.display = 'none';
          inputArea.style.display = 'none';
        }
        
        if (hasStartedChat) {
          input.focus();
        }
      } else {
        // Re-show launcher text when chat is closed
        if (config?.launcher_text_enabled && config?.launcher_text) {
          launcherText.classList.add('show');
        }
      }
    }
    
    function updateStatus(mode) {
      if (mode === 'ai') {
        statusDot.className = 'vintra-status-dot ai';
        statusText.textContent = 'AI Assistant';
        handoffBtn.classList.add('show');
        handoffBanner.classList.remove('show');
      } else if (mode === 'waiting') {
        statusDot.className = 'vintra-status-dot waiting';
        statusText.textContent = 'Waiting for agent...';
        handoffBtn.classList.remove('show');
        handoffBanner.classList.add('show');
      } else if (mode === 'human') {
        statusDot.className = 'vintra-status-dot';
        statusText.textContent = 'Human Agent';
        handoffBtn.classList.remove('show');
        handoffBanner.classList.remove('show');
      } else {
        statusDot.className = 'vintra-status-dot';
        statusText.textContent = 'Online';
        handoffBtn.classList.remove('show');
        handoffBanner.classList.remove('show');
      }
    }
    
    async function startChat() {
      visitorName = nameInput.value.trim() || 'Visitor';
      visitorEmail = emailInput.value.trim();
      
      startBtn.disabled = true;
      startBtn.textContent = 'Starting...';
      
      try {
        const response = await fetch(API_BASE + '/api/chat/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatbot_id: chatbotId,
            visitor_name: visitorName,
            visitor_email: visitorEmail || null
          })
        });
        
        const data = await response.json();
        sessionId = data.session_id;
        isBotActive = data.ai_enabled || false;
        hasStartedChat = true;
        
        preChat.classList.add('hidden');
        messagesContainer.style.display = 'flex';
        inputArea.style.display = 'flex';
        if (config?.show_branding) {
          branding.style.display = 'block';
        }
        
        // Update status based on AI mode
        if (isBotActive) {
          updateStatus('ai');
          quickActions.classList.add('show');
        } else {
          updateStatus('online');
        }
        
        // Add welcome message
        if (config?.welcome_message) {
          addMessage(config.welcome_message, 'bot');
        }
        
        // Add AI greeting if available (different from welcome)
        if (data.ai_greeting && data.ai_greeting !== config?.welcome_message) {
          setTimeout(() => {
            addMessage(data.ai_greeting, 'bot', true);
          }, 500);
        }
        
        input.focus();
        
        // Start polling for messages
        pollMessages();
      } catch (error) {
        console.error('VintraStudio: Failed to start chat', error);
        startBtn.disabled = false;
        startBtn.textContent = 'Start Chat';
      }
    }
    
    async function requestHandoff() {
      if (!sessionId || isWaitingForHuman) return;
      
      // Send the handoff message through normal flow
      input.value = 'I would like to speak with a human agent please';
      await sendMessage();
    }
    
    async function sendMessage() {
      const content = input.value.trim();
      if (!content || !sessionId || isSending) return;
      
      isSending = true;
      input.value = '';
      sendBtn.disabled = true;
      addMessage(content, 'visitor');
      
      // Hide quick actions after first message
      quickActions.classList.remove('show');
      
      try {
        // Send visitor message to the API
        await fetch(API_BASE + '/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            content: content,
            sender_type: 'visitor'
          })
        });
        
        // If bot is active, request AI response
        if (isBotActive && !isWaitingForHuman) {
          showTyping(true);
          
          try {
            const aiResponse = await fetch(API_BASE + '/api/chat/ai', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                session_id: sessionId,
                content: content
              })
            });
            
            const aiData = await aiResponse.json();
            showTyping(false);
            
            if (aiData.reply) {
              addMessage(aiData.reply, 'bot', true);
            } else if (!aiResponse.ok) {
              addMessage('Sorry, I\\'m having trouble responding right now. Please try again or ask to speak with a human agent.', 'bot', true);
            }
            
            if (aiData.handoff) {
              isBotActive = false;
              isWaitingForHuman = true;
              updateStatus('waiting');
              addSystemMessage('You have been transferred to a human agent. Please wait...');
            }
            
            if (aiData.bot_active === false && !aiData.handoff) {
              isBotActive = false;
            }
          } catch (err) {
            showTyping(false);
            addMessage('Sorry, I could not connect to the AI service. Please try again later.', 'bot', true);
            console.error('VintraStudio: AI response failed', err);
          }
        }
      } catch (error) {
        console.error('VintraStudio: Failed to send message', error);
      }
      
      isSending = false;
      sendBtn.disabled = false;
    }
    
    function showTyping(show) {
      typingIndicator.classList.toggle('show', show);
      if (show) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
    
    function addMessage(content, type, isAi) {
      const group = document.createElement('div');
      group.className = 'vintra-msg-group ' + type;
      
      // Label
      if (type !== 'visitor') {
        const label = document.createElement('div');
        label.className = 'vintra-msg-label';
        if (type === 'bot' && isAi) {
          label.innerHTML = icons.sparkle + ' AI Assistant';
        } else if (type === 'admin') {
          label.innerHTML = icons.user + ' Agent';
        }
        if (label.innerHTML) {
          group.appendChild(label);
        }
      } else {
        const label = document.createElement('div');
        label.className = 'vintra-msg-label right';
        label.textContent = 'You';
        group.appendChild(label);
      }
      
      const message = document.createElement('div');
      message.className = 'vintra-message ' + type;
      message.textContent = content;
      if (type === 'visitor' && config?.primary_color) {
        message.style.background = config.primary_color;
      }
      group.appendChild(message);
      messagesContainer.appendChild(group);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      // Update unread count if window is closed
      if (!isOpen && type !== 'visitor') {
        unreadCount++;
        unreadBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        unreadBadge.classList.add('show');
      }
    }
    
    function addSystemMessage(content) {
      const message = document.createElement('div');
      message.className = 'vintra-message system';
      message.textContent = content;
      messagesContainer.appendChild(message);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    let lastMessageId = null;
    let pollInterval = null;
    
    async function pollMessages() {
      if (!sessionId || !hasStartedChat) return;
      
      try {
        const url = API_BASE + '/api/chat/messages?session_id=' + sessionId + 
          (lastMessageId ? '&after=' + lastMessageId : '');
        const response = await fetch(url);
        const messages = await response.json();
        
        if (Array.isArray(messages)) {
          messages.forEach(msg => {
            // Only show messages from others (admin/bot) - skip visitor messages (already shown)
            // Also skip bot messages if we already showed them via AI response
            if (msg.sender_type === 'admin') {
              // Human agent replied - update status
              if (isWaitingForHuman) {
                isWaitingForHuman = false;
                updateStatus('human');
                addSystemMessage('A human agent has joined the conversation.');
              }
              addMessage(msg.content, 'admin', false);
            }
            // Only show bot messages that came from external (not the ones we added inline)
            // We track by checking if this is a new bot message from polling
            lastMessageId = msg.id;
          });
        }
      } catch (error) {
        console.error('VintraStudio: Failed to poll messages', error);
      }
      
      pollInterval = setTimeout(pollMessages, 3000);
    }
    
    // Apply config
    function checkBusinessHours(cfg) {
      if (!cfg.business_hours_enabled || !cfg.business_hours) {
        return true; // No business hours configured = always online
      }
      
      const tz = cfg.business_hours_timezone || 'UTC';
      let now;
      try {
        now = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
      } catch(e) {
        now = new Date();
      }
      
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayKey = days[now.getDay()];
      const schedule = cfg.business_hours[dayKey];
      
      if (!schedule || !schedule.enabled) return false;
      
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = schedule.start.split(':').map(Number);
      const [endH, endM] = schedule.end.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
    
    function applyConfig(cfg) {
      config = cfg;
      
      if (cfg.primary_color) {
        launcher.style.background = cfg.primary_color;
        header.style.background = cfg.primary_color;
        sendBtn.style.background = cfg.primary_color;
        startBtn.style.background = cfg.primary_color;
        launcherText.style.background = cfg.primary_color;
        document.documentElement.style.setProperty('--vintra-primary', cfg.primary_color);
      }
      
      if (cfg.widget_title) {
        title.textContent = cfg.widget_title;
      }
      
      if (cfg.placeholder_text) {
        input.placeholder = cfg.placeholder_text;
      }
      
      if (cfg.position === 'bottom-left') {
        container.classList.add('position-left');
      }
      
      // Launcher text
      if (cfg.launcher_text_enabled && cfg.launcher_text) {
        launcherText.textContent = cfg.launcher_text;
        launcherText.classList.add('show');
      }
      
      // Business hours check
      isOffline = !checkBusinessHours(cfg);
      if (isOffline) {
        statusDot.className = 'vintra-status-dot waiting';
        statusText.textContent = 'Offline';
        if (cfg.outside_hours_message) {
          offlineMsg.textContent = cfg.outside_hours_message;
        }
      }
    }
    
    return { applyConfig };
  }
  
  // Initialize
  async function init() {
    try {
      const configUrl = API_BASE + '/api/chat/config?chatbot_id=' + chatbotId;
      const response = await fetch(configUrl);
      
      const defaultConfig = {
        primary_color: '#14b8a6',
        widget_title: 'Chat with us',
        welcome_message: 'Hi! How can we help you today?',
        placeholder_text: 'Type your message...',
        show_branding: true,
        position: 'bottom-right'
      };
      
      if (!response.ok) {
        const widget = createWidget();
        widget.applyConfig(defaultConfig);
        return;
      }
      
      const configData = await response.json();
      
      if (configData.error) {
        const widget = createWidget();
        widget.applyConfig(defaultConfig);
        return;
      }
      
      const widget = createWidget();
      widget.applyConfig(configData);
    } catch (error) {
      console.error('[VintraStudio] Failed to initialize:', error);
      const widget = createWidget();
      widget.applyConfig({
        primary_color: '#14b8a6',
        widget_title: 'Chat with us',
        welcome_message: 'Hi! How can we help you today?',
        placeholder_text: 'Type your message...',
        show_branding: true,
        position: 'bottom-right'
      });
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`

  return new NextResponse(widgetScript, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
