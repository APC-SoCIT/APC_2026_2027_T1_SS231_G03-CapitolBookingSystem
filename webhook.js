import 'dotenv/config';
import axios from 'axios';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const app = express();
const frontendDistPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');

app.use((req, res, next) => {
  const requestHost = req.get('host');
  let hostname;

  try {
    hostname = new URL(`http://${requestHost}`).hostname.toLowerCase();
  } catch {
    return res.sendStatus(400);
  }

  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.toLowerCase();
  const isRailwayHost = hostname === railwayDomain || hostname.endsWith('.up.railway.app');
  const isLocalDevelopmentHost = process.env.NODE_ENV !== 'production'
    && (hostname === 'localhost' || hostname === '127.0.0.1');

  if (!isRailwayHost && !isLocalDevelopmentHost) {
    return res.status(403).send('Requests must use the Railway public domain.');
  }

  next();
});

app.use((req, res, next) => {
  const origin = req.get('origin');
  const configuredOrigins = (process.env.FRONTEND_ORIGINS || '')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const isLocalDevelopmentOrigin = process.env.NODE_ENV !== 'production'
    && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');

  if (origin && !configuredOrigins.includes(origin.replace(/\/$/, '')) && !isLocalDevelopmentOrigin) {
    return res.status(403).send('This website origin is not allowed.');
  }

  if (origin) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());
app.use(express.static(frontendDistPath, { index: false }));

// Initialize Supabase using environment variables
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Initialize Gemini AI using environment variables
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'test-aagent';

// 1. Meta Verification Endpoint (GET)
app.get('/delivery', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // THIS WILL PRINT EXACTLY WHAT META SENDS
  console.log('--- Incoming Verification Request ---');
  console.log('Mode from Meta:', mode);
  console.log('Token from Meta:', token);
  console.log('Expected Token:', VERIFY_TOKEN);

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully!');
    return res.status(200).send(challenge);
  }

  console.log('❌ Tokens did not match. Rejecting.');
  return res.sendStatus(403);
});

// 2. Incoming Messages Endpoint (POST)
// Helper function with exponential backoff for high-demand API mitigation
async function generateWithRetry(prompt, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      return aiResponse;
    } catch (error) {
      console.warn(`⚠️ Gemini busy (attempt ${i + 1}/${retries}), retrying in ${delay}ms...`);
      if (i === retries - 1) throw error;
      await new Promise(res => setTimeout(res, delay));
      delay *= 2;
    }
  }
}

function isOrderRequest(message) {
  const text = message.toLowerCase();
  return /\b(?:i(?:'d| would| want to)?\s+)?(?:place|make|start|submit|confirm)\s+(?:an?\s+)?(?:order|purchase|booking|reservation)\b/.test(text)
    || /\b(?:can|could|may)\s+i\s+(?:please\s+)?(?:place|make|start|submit|confirm)\s+(?:an?\s+)?(?:order|purchase|booking|reservation)\b/.test(text)
    || /\b(?:i want|i'd like|i would like|can i|could i|please)\s+(?:to\s+)?(?:order|buy|purchase|book|reserve)\b/.test(text)
    || /\b(?:i'm|i am)\s+ready\s+to\s+(?:order|buy|purchase|book|reserve)\b/.test(text)
    || /\b(?:order|buy|purchase|book|reserve)\s+(?:me|for me)\b/.test(text)
    || /\b\d+\s*(?:soft ?copies|hard ?copies|prints?)\b/.test(text);
}

async function notifyStaff({ inquiryId, senderId, name, email, source, message }) {
  const notificationUrl = process.env.STAFF_NOTIFICATION_WEBHOOK_URL;
  if (!notificationUrl) {
    console.error('Manual order needs staff attention, but STAFF_NOTIFICATION_WEBHOOK_URL is not configured.');
    return false;
  }

  const contact = senderId ? `Messenger PSID: ${senderId}` : `Email: ${email}`;
  const alertText = `Manual response required (${source})\nInquiry: ${inquiryId}\nCustomer: ${name}\n${contact}\nMessage: ${message}`;
  try {
    await axios.post(notificationUrl, {
      text: alertText,
      content: alertText,
      inquiryId,
      senderId,
      name,
      email,
      source,
      customerMessage: message
    });
    console.log(`✅ Staff notification sent for manual order inquiry ${inquiryId}.`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send staff notification:', error.response?.data || error.message);
    return false;
  }
}

app.post('/inquiries', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const type = typeof req.body?.type === 'string' ? req.body.type.trim() : '';
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

  if (!name || !email || !type || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid name, email, inquiry type, and message.' });
  }

  const manualOrder = isOrderRequest(message);
  const inquiryId = crypto.randomUUID();
  let reply = null;

  if (!manualOrder) {
    const prompt = `
      You are the Capitol Restaurant customer inquiry assistant.
      Reply only to informational inquiries. Never accept, start, or confirm orders or bookings.
      Do not invent menus, prices, availability, policies, or promises. Known facts: Capitol Restaurant is in Pasay City, Metro Manila, and offers catering, function-room, and delivery services.
      For details not supported by those facts, politely say staff will follow up.
      Return only JSON with one key, "suggested_reply", containing a brief friendly answer.
      Inquiry type: ${JSON.stringify(type)}
      Customer message: ${JSON.stringify(message)}
    `;

    try {
      const aiResponse = await generateWithRetry(prompt);
      const aiData = JSON.parse(aiResponse.text);
      reply = typeof aiData.suggested_reply === 'string' ? aiData.suggested_reply.trim() : '';
      if (!reply) reply = 'Thank you for contacting Capitol Restaurant. Our team will follow up with you shortly.';
    } catch (error) {
      console.error('❌ Gemini failed to answer website inquiry:', error.message);
      reply = 'Thank you for contacting Capitol Restaurant. Our team will follow up with you shortly.';
    }
  }

  const { error } = await supabase.from('inquiries').insert([{
    id: inquiryId,
    user_id: null,
    name,
    email,
    type: manualOrder ? 'Manual Order Request' : type,
    message,
    status: manualOrder ? 'New' : 'Resolved'
  }]);

  if (error) {
    console.error('❌ Failed to save website inquiry:', error);
    return res.status(503).json({ error: 'We could not record your inquiry. Please try again.' });
  }

  if (manualOrder) {
    const notificationSent = await notifyStaff({
      inquiryId,
      name,
      email,
      source: 'Website',
      message
    });
    return res.status(202).json({
      inquiryId,
      status: 'manual-response-required',
      notificationSent
    });
  }

  return res.status(200).json({ inquiryId, status: 'answered', reply });
});

app.post('/delivery', async (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    for (const entry of body.entry) {
      const messagingEvent = entry.messaging?.[0];
      if (messagingEvent && messagingEvent.message && messagingEvent.message.text) {
        const senderId = messagingEvent.sender.id;
        const messageText = messagingEvent.message.text;

        try {
          console.log('Incoming text from Meta:', messageText);

          const manualOrder = isOrderRequest(messageText);
          const inquiryId = crypto.randomUUID();
          let replyText = null;

          if (manualOrder) {
            console.log('Order intent detected; routing to staff for a manual response.');
          } else {
            const prompt = `
              You are the Photon Phun customer-service assistant.
              Answer only informational inquiries about the service and its prices:
              - Softcopy: 10 pesos
              - Hard copy (2 pcs): 40 pesos
              Never take, confirm, or process an order; never collect order details.
              If the message asks to place or continue an order, say nothing here because staff handles order messages manually.
              Return only a JSON object with one key, "suggested_reply", containing a concise, friendly answer to this informational inquiry.

              Customer message: ${JSON.stringify(messageText)}
            `;

            try {
              const aiResponse = await generateWithRetry(prompt);
              const aiData = JSON.parse(aiResponse.text);
              replyText = typeof aiData.suggested_reply === 'string' ? aiData.suggested_reply.trim() : '';
            } catch (aiErr) {
              console.error('❌ Gemini failed to answer inquiry:', aiErr.message);
              replyText = 'Thanks for your inquiry. Our team will follow up with you shortly.';
            }
          }

          const { data, error } = await supabase.from('inquiries').insert([{
            id: inquiryId,
            user_id: null,
            name: `Messenger User (${senderId.slice(-4)})`,
            email: `messenger_${senderId}@placeholder.com`,
            type: manualOrder ? 'Manual Order Request' : 'General Inquiry',
            message: messageText,
            status: manualOrder ? 'New' : 'Resolved'
          }]).select();

          if (error) {
            console.error('❌ Supabase insertion failed:', error);
          } else {
            console.log('✅ Messenger message recorded in Supabase:', data);
          }

          if (manualOrder) {
            await notifyStaff({ inquiryId, senderId, name: `Messenger User (${senderId.slice(-4)})`, source: 'Messenger', message: messageText });
            // Do not send an automated customer reply; staff must respond manually.
            continue;
          }

          if (replyText) {
            const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;
            await axios.post('https://graph.facebook.com/v18.0/me/messages', {
              recipient: { id: senderId },
              message: { text: replyText }
            }, {
              params: { access_token: pageAccessToken }
            });
            console.log('✅ Automated informational reply sent via Messenger.');
          }

        } catch (err) {
          console.error('❌ Error caught in processing block:', err);
        }
      }
    }
    return res.status(200).send('EVENT_RECEIVED');
  }
  return res.sendStatus(404);
});

// Serve the Vite single-page app for browser routes after API endpoints.
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/delivery') || req.path.startsWith('/inquiries')) {
    return res.sendStatus(404);
  }

  res.sendFile(path.join(frontendDistPath, 'index.html'), (error) => {
    if (error) next(error);
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Webhook server listening on port ${PORT}`));
