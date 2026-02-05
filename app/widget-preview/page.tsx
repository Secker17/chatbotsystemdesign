import { createClient } from '@/lib/supabase/server'

export default async function WidgetPreviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let chatbotId = null

  if (user) {
    const { data } = await supabase
      .from('chatbot_configs')
      .select('id')
      .eq('admin_id', user.id)
      .single()
    
    chatbotId = data?.id
  }

  return (
    <html lang="en">
      <head>
        <title>Widget Preview - VintraStudio</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          header {
            background: white;
            padding: 16px 24px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .logo {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            font-size: 18px;
            color: #111;
          }
          .logo-icon {
            width: 32px;
            height: 32px;
            background: #14b8a6;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
          .badge {
            background: #f0fdf4;
            color: #16a34a;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
          }
          main {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            text-align: center;
          }
          h1 {
            font-size: 28px;
            color: #111;
            margin-bottom: 12px;
          }
          p {
            color: #666;
            font-size: 16px;
            max-width: 500px;
            line-height: 1.6;
          }
          .preview-card {
            background: white;
            border-radius: 12px;
            padding: 24px;
            margin-top: 32px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            max-width: 400px;
          }
          .preview-card h2 {
            font-size: 18px;
            margin-bottom: 8px;
            color: #111;
          }
          .preview-card p {
            font-size: 14px;
            margin-bottom: 16px;
          }
          .code-block {
            background: #1e1e1e;
            border-radius: 8px;
            padding: 16px;
            font-family: monospace;
            font-size: 12px;
            color: #e0e0e0;
            text-align: left;
            overflow-x: auto;
            white-space: pre-wrap;
            word-break: break-all;
          }
          .code-block .tag { color: #569cd6; }
          .code-block .attr { color: #9cdcfe; }
          .code-block .string { color: #ce9178; }
        `}</style>
      </head>
      <body>
        <header>
          <div className="logo">
            <div className="logo-icon">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            VintraStudio
          </div>
          <span className="badge">Preview Mode</span>
        </header>
        <main>
          <h1>Widget Preview</h1>
          <p>
            This is a preview of how the chat widget will appear on your website. 
            Look for the chat button in the bottom-right corner.
          </p>
          
          {chatbotId ? (
            <div className="preview-card">
              <h2>Your Chatbot ID</h2>
              <p>Use this ID when installing the widget on your site:</p>
              <div className="code-block">
                {chatbotId}
              </div>
            </div>
          ) : (
            <div className="preview-card">
              <h2>Not logged in</h2>
              <p>
                Log in to your admin panel to see your chatbot ID and test the widget.
              </p>
            </div>
          )}
        </main>
        
        {chatbotId && (
          <script
            src="/api/widget.js"
            data-chatbot-id={chatbotId}
            async
          />
        )}
      </body>
    </html>
  )
}
