// Supabase Edge Function to send emergency notifications
// This needs to be deployed to your Supabase project

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// You'll need to add these secrets to your Supabase project:
// TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
// SENDGRID_API_KEY (optional, for email)

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')

interface EmergencyContact {
  name: string
  phone: string
  email?: string
  relationship: string
}

interface RequestBody {
  alertId: string
  contacts: EmergencyContact[]
  location: {
    lat?: number
    lng?: number
    address?: string
  }
  userName: string
  timestamp: string
}

// Send SMS via Twilio
async function sendSMS(to: string, message: string): Promise<boolean> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error('Twilio credentials not configured')
    return false
  }

  try {
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: TWILIO_PHONE_NUMBER!,
          Body: message,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Twilio error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending SMS:', error)
    return false
  }
}

// Send Email via SendGrid
async function sendEmail(
  to: string,
  subject: string,
  message: string
): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn('SendGrid not configured, skipping email')
    return false
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: 'noreply@bettersafe.app', name: 'BetterSafe Emergency' },
        subject,
        content: [
          {
            type: 'text/plain',
            value: message,
          },
          {
            type: 'text/html',
            value: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">🚨 Emergency Alert</h2>
                <p>${message.replace(/\n/g, '<br>')}</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px;">
                  This is an automated emergency notification from BetterSafe - Howard University Campus Safety.
                  If this is not a real emergency, please contact the sender immediately.
                </p>
              </div>
            `,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('SendGrid error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { alertId, contacts, location, userName, timestamp }: RequestBody = await req.json()

    // Build the emergency message
    const locationText = location.address || 
      (location.lat && location.lng ? `${location.lat}, ${location.lng}` : 'Location unavailable')
    
    const mapLink = location.lat && location.lng 
      ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
      : null

    const message = `🚨 EMERGENCY ALERT

${userName} has triggered an emergency alert and may need help.

📍 Location: ${locationText}
${mapLink ? `🗺️  View on Map: ${mapLink}` : ''}
⏰ Time: ${new Date(timestamp).toLocaleString('en-US', { 
  timeZone: 'America/New_York',
  dateStyle: 'medium',
  timeStyle: 'short'
})}

If you can reach them, please check on their safety immediately.
If you cannot reach them, consider contacting:
• Howard University Campus Security: (202) 806-4357
• DC Emergency Services: 911

Alert ID: ${alertId}`

    // Send notifications to all contacts
    const results = await Promise.allSettled(
      contacts.map(async (contact) => {
        const smsSuccess = await sendSMS(contact.phone, message)
        
        let emailSuccess = false
        if (contact.email) {
          emailSuccess = await sendEmail(
            contact.email,
            `🚨 Emergency Alert - ${userName} needs help`,
            message
          )
        }

        return {
          contact: contact.name,
          phone: contact.phone,
          smsSuccess,
          emailSuccess: contact.email ? emailSuccess : null,
        }
      })
    )

    // Count successes and failures
    const notifications = results.map((result) =>
      result.status === 'fulfilled' ? result.value : null
    )
    const successCount = notifications.filter(
      (n) => n && (n.smsSuccess || n.emailSuccess)
    ).length

    return new Response(
      JSON.stringify({
        success: true,
        alertId,
        notificationsSent: successCount,
        totalContacts: contacts.length,
        details: notifications,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Error processing emergency alert:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
