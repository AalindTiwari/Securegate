import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const resendApiKey = process.env.RESEND_API_KEY
        const contactEmailTo = process.env.CONTACT_EMAIL_TO
        const fromEmail = process.env.SECUREGATE_FROM_EMAIL || 'SecureGate <noreply@example.com>'

        if (!resendApiKey || !contactEmailTo) {
            return NextResponse.json(
                { error: 'Contact email is not configured for this deployment' },
                { status: 503 }
            )
        }

        const resend = new Resend(resendApiKey)
        const body = await req.json()
        const { name, email, message, providerName, baseUrl } = body

        if (!message || !email) {
            return NextResponse.json(
                { error: 'Message and email are required' },
                { status: 400 }
            )
        }

        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: [contactEmailTo],
            subject: `[SecureGate] Custom Provider Request: ${providerName || 'Unknown'}`,
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fafafa; border-radius: 16px; overflow: hidden; border: 1px solid #222;">
                    <div style="padding: 24px; background: linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 100%); border-bottom: 1px solid #222;">
                        <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">🛡️ SecureGate — Custom Provider Request</h1>
                    </div>
                    <div style="padding: 24px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #888; font-size: 13px; width: 120px;">From</td>
                                <td style="padding: 8px 0; font-size: 14px;">${name || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #888; font-size: 13px;">Email</td>
                                <td style="padding: 8px 0; font-size: 14px;"><a href="mailto:${email}" style="color: #e07a5f;">${email}</a></td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #888; font-size: 13px;">Provider</td>
                                <td style="padding: 8px 0; font-size: 14px; font-weight: 600;">${providerName || 'Not specified'}</td>
                            </tr>
                            ${baseUrl ? `
                            <tr>
                                <td style="padding: 8px 0; color: #888; font-size: 13px;">Base URL</td>
                                <td style="padding: 8px 0; font-size: 14px; font-family: monospace;">${baseUrl}</td>
                            </tr>
                            ` : ''}
                        </table>
                        <div style="margin-top: 20px; padding: 16px; background: #111; border-radius: 12px; border: 1px solid #222;">
                            <p style="margin: 0 0 8px; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Message</p>
                            <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                        </div>
                        <p style="margin-top: 20px; font-size: 11px; color: #555;">Sent from SecureGate Dashboard</p>
                    </div>
                </div>
            `,
        })

        if (error) {
            console.error('Resend error:', error)
            return NextResponse.json(
                { error: 'Failed to send email' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, id: data?.id })
    } catch (err) {
        console.error('Contact API error:', err)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
