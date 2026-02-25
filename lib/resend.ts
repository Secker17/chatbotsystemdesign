import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY

export const resend = resendApiKey ? new Resend(resendApiKey) : null

interface SendInviteEmailParams {
  to: string
  inviteLink: string
  inviterEmail: string
  role: string
}

export async function sendInviteEmail({ to, inviteLink, inviterEmail, role }: SendInviteEmailParams) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping email send')
    return { success: false, error: 'Email service not configured' }
  }

  const { data, error } = await resend.emails.send({
    from: 'Vintra <onboarding@resend.dev>',
    to,
    subject: `You've been invited to join a team on Vintra`,
    html: buildInviteHtml({ inviteLink, inviterEmail, role }),
  })

  if (error) {
    console.error('Resend error:', error)
    return { success: false, error: error.message }
  }

  return { success: true, id: data?.id }
}

function buildInviteHtml({ inviteLink, inviterEmail, role }: Omit<SendInviteEmailParams, 'to'>) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;">
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#18181b;">You're Invited</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:0 32px 24px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">
                <strong>${inviterEmail}</strong> has invited you to join their team on Vintra as a <strong>${role}</strong>.
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3f3f46;">
                Click the button below to accept the invitation. You will need to sign in or create an account first.
              </p>
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}" target="_blank"
                       style="display:inline-block;padding:12px 32px;background-color:#18181b;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #e4e4e7;">
              <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#a1a1aa;">
                This invitation expires in 7 days. If you did not expect this email, you can safely ignore it.
              </p>
              <p style="margin:0;font-size:12px;color:#a1a1aa;">
                Vintra &mdash; AI-Powered Chatbots
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
