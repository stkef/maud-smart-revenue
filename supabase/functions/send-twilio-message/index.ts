import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TwilioRequest {
  to: string;
  message: string;
  channel: 'sms' | 'whatsapp';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    const twilioWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error('[TWILIO] Missing required credentials');
      return new Response(
        JSON.stringify({ success: false, error: 'Twilio credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { to, message, channel } = await req.json() as TwilioRequest;

    if (!to || !message || !channel) {
      console.error('[TWILIO] Missing required fields:', { to: !!to, message: !!message, channel: !!channel });
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: to, message, channel' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[TWILIO] Sending ${channel} message to ${to}`);

    let fromNumber: string;
    let toNumber: string;

    if (channel === 'whatsapp') {
      if (!twilioWhatsAppNumber) {
        console.error('[TWILIO] WhatsApp number not configured');
        return new Response(
          JSON.stringify({ success: false, error: 'WhatsApp number not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      fromNumber = `whatsapp:${twilioWhatsAppNumber}`;
      toNumber = `whatsapp:${to}`;
    } else {
      fromNumber = twilioPhoneNumber;
      toNumber = to;
    }

    // Make the actual Twilio API call
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append('To', toNumber);
    formData.append('From', fromNumber);
    formData.append('Body', message);

    console.log(`[TWILIO] Calling Twilio API: To=${toNumber}, From=${fromNumber}`);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('[TWILIO] API Error:', responseData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: responseData.message || 'Failed to send message',
          code: responseData.code 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[TWILIO] Message sent successfully. SID: ${responseData.sid}, Status: ${responseData.status}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sid: responseData.sid,
        status: responseData.status,
        to: responseData.to,
        from: responseData.from
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[TWILIO] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
