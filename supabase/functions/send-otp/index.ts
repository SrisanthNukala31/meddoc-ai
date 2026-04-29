import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RequestBody {
  email: string
  otp: string
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { email, otp }: RequestBody = await req.json()

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: 'Email and OTP are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Send email using Supabase's email service
    const { error } = await supabase.auth.admin.sendRawEmail({
      to: email,
      subject: 'Your MedDoc AI OTP Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your OTP Code</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #14b8a6, #06b6d4); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🏥 MedDoc AI</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your Health Assistant</p>
          </div>

          <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border-left: 4px solid #14b8a6;">
            <h2 style="color: #1f2937; margin-top: 0;">Your Verification Code</h2>
            <p style="margin-bottom: 20px;">Use this code to complete your verification:</p>

            <div style="background: white; border: 2px solid #14b8a6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #14b8a6; letter-spacing: 4px;">${otp}</span>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              This code will expire in 5 minutes for your security.
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px;">
              This is an automated message from MedDoc AI. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
MedDoc AI - Your Health Assistant

Your verification code: ${otp}

This code will expire in 5 minutes.

If you didn't request this code, please ignore this email.

---
This is an automated message from MedDoc AI.
      `.trim()
    })

    if (error) {
      console.error('Email send error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})