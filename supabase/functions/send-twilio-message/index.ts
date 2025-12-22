import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TwilioRequest {
  to: string;
  message: string;
  channel: "sms" | "whatsapp";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const smsFrom = Deno.env.get("TWILIO_PHONE_NUMBER");
    const whatsappFrom = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

    // Debug logging
    console.log("[TWILIO] Checking credentials...");
    console.log("[TWILIO] Account SID present:", !!accountSid, accountSid ? `starts with: ${accountSid.substring(0, 4)}` : "missing");
    console.log("[TWILIO] Auth Token present:", !!authToken, authToken ? `length: ${authToken.length}` : "missing");
    console.log("[TWILIO] SMS From:", smsFrom || "missing");

    if (!accountSid || !authToken || !smsFrom) {
      const missing = [];
      if (!accountSid) missing.push("TWILIO_ACCOUNT_SID");
      if (!authToken) missing.push("TWILIO_AUTH_TOKEN");
      if (!smsFrom) missing.push("TWILIO_PHONE_NUMBER");
      console.error("[TWILIO] Missing env vars:", missing.join(", "));
      return new Response(
        JSON.stringify({
          success: false,
          error: `Missing Twilio env vars: ${missing.join(", ")}`,
        }),
        { status: 500, headers: corsHeaders },
      );
    }

    if (!accountSid.startsWith("AC")) {
      console.error("[TWILIO] Invalid Account SID format - must start with 'AC'");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid Twilio Account SID format - must start with 'AC'",
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    const { to, message, channel } = (await req.json()) as TwilioRequest;

    if (!to || !message || !channel) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing to / message / channel",
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Normalize phone number
    let formattedTo = to.trim();
    if (!formattedTo.startsWith("+")) {
      formattedTo = `+91${formattedTo}`; // default India
    }

    const isWhatsApp = channel === "whatsapp";

    const fromNumber = isWhatsApp ? `whatsapp:${whatsappFrom}` : smsFrom;

    const toNumber = isWhatsApp ? `whatsapp:${formattedTo}` : formattedTo;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const body = new URLSearchParams({
      To: toNumber,
      From: fromNumber,
      Body: message,
    });

    const authHeader = btoa(`${accountSid}:${authToken}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: data.message,
          code: data.code,
        }),
        { status: response.status, headers: corsHeaders },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        sid: data.sid,
        status: data.status,
      }),
      { headers: corsHeaders },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers: corsHeaders },
    );
  }
});
