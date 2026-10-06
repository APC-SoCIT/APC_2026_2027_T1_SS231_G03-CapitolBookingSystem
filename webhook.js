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
    && (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.trycloudflare.com'));

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

// Mirrors src/constants.ts's PACKED_MENU_ITEMS — keep the two in sync until the
// Messenger agent reads this from a shared Supabase table instead of a hardcoded list.
const DELIVERY_FEE = 60;
const MENU_ITEMS = [
  { id: 'pm-01', name: 'Adobong Manok', price: 120, description: 'Classic Filipino chicken adobo in garlic, soy, and vinegar.' },
  { id: 'pm-02', name: 'Lechon Kawali', price: 145, description: 'Crispy deep-fried pork belly served with liver sauce.' },
  { id: 'pm-03', name: 'Pork Sinigang', price: 135, description: 'Tamarind-based pork soup with fresh vegetables.' },
  { id: 'pm-04', name: 'Beef Kaldereta', price: 165, description: 'Braised beef in tomato and liver sauce with bell peppers.' },
  { id: 'pm-05', name: 'Chicken Tinola', price: 115, description: 'Ginger-based chicken soup with green papaya and chili leaves.' },
  { id: 'pm-06', name: 'Pinakbet', price: 100, description: 'Mixed vegetables sauteed with shrimp paste and pork.' },
  { id: 'pm-07', name: 'Laing', price: 95, description: 'Taro leaves simmered in coconut milk with chili.' },
  { id: 'pm-08', name: 'Pancit Bihon', price: 110, description: 'Stir-fried rice noodles with pork, vegetables, and soy sauce.' },
  { id: 'pm-09', name: 'Steamed Rice', price: 35, description: 'Freshly cooked premium white rice per serving.' },
  { id: 'pm-10', name: 'Leche Flan', price: 75, description: 'Classic Filipino caramel custard dessert.' },
];

function formatMenuForPrompt() {
  return MENU_ITEMS.map((item) => `- ${item.name}: ₱${item.price} (${item.description})`).join('\n');
}

function findMenuItem(name) {
  if (typeof name !== 'string') return null;
  const needle = name.trim().toLowerCase();
  return MENU_ITEMS.find((item) => item.name.toLowerCase() === needle) || null;
}

const KNOWN_FACTS = `Capitol Restaurant is in Pasay City, Metro Manila, and offers catering, function-room, and delivery services.
Delivery menu (packed meals):
${formatMenuForPrompt()}
Delivery fee is a flat ₱${DELIVERY_FEE} per order.`;

// --- Messenger send + per-sender conversation draft (messenger_sessions table) ---

async function sendMessage(psid, text) {
  const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;
  try {
    await axios.post('https://graph.facebook.com/v18.0/me/messages', {
      recipient: { id: psid },
      message: { text }
    }, {
      params: { access_token: pageAccessToken }
    });
    return true;
  } catch (error) {
    console.error('❌ Failed to send Messenger message:', error.response?.data || error.message);
    return false;
  }
}

async function getMessengerSession(psid) {
  const { data, error } = await supabase.from('messenger_sessions').select('*').eq('psid', psid).maybeSingle();
  if (error) console.error('❌ Failed to load Messenger session:', error);
  return data || { psid, state: 'idle', draft: {} };
}

async function saveMessengerSession(psid, patch) {
  const { error } = await supabase.from('messenger_sessions').upsert({
    psid,
    ...patch,
    last_message_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'psid' });
  if (error) console.error('❌ Failed to save Messenger session:', error);
}

async function clearMessengerSession(psid) {
  await saveMessengerSession(psid, { state: 'idle', draft: {} });
}

const REQUIRED_ORDER_FIELDS = ['name', 'phone', 'address', 'items'];

function missingOrderFields(draft) {
  const missing = [];
  if (!draft.name) missing.push('full name');
  if (!draft.phone) missing.push('contact number');
  if (!draft.address) missing.push('delivery address (must be within Metro Manila)');
  if (!Array.isArray(draft.items) || draft.items.length === 0) missing.push('items and quantities from the menu');
  return missing;
}

// Extracts/merges order details from the latest customer message into the running
// draft. Only field extraction is trusted from Gemini — pricing/totals are always
// recomputed server-side in handleOrderMessage, never taken from the model's output.
async function extractOrderDraft(draft, message) {
  const prompt = `
    You are helping take a Capitol Restaurant delivery order on Messenger.
    Known menu items (only these can be ordered): ${MENU_ITEMS.map((item) => item.name).join(', ')}.
    The customer's order so far (may be incomplete): ${JSON.stringify(draft)}
    Their latest message: ${JSON.stringify(message)}
    Update the draft by merging in any new details from the latest message. Do not discard previously known fields unless the customer is clearly correcting them.
    Match item mentions to the known menu items by name only; ignore anything not on the menu and list it in "unavailableItems" instead.
    Return only JSON with this shape:
    {
      "name": string or null,
      "phone": string or null,
      "address": string or null,
      "items": [{ "name": string, "quantity": number }],
      "paymentMethod": "Cash on delivery" | "GCash" | "Card" | null,
      "notes": string or null,
      "unavailableItems": string[]
    }
  `;

  const aiResponse = await generateWithRetry(prompt);
  const parsed = JSON.parse(aiResponse.text);
  return {
    name: parsed.name || draft.name || null,
    phone: parsed.phone || draft.phone || null,
    address: parsed.address || draft.address || null,
    items: Array.isArray(parsed.items) && parsed.items.length > 0 ? parsed.items : (draft.items || []),
    paymentMethod: parsed.paymentMethod || draft.paymentMethod || null,
    notes: parsed.notes || draft.notes || null,
    unavailableItems: Array.isArray(parsed.unavailableItems) ? parsed.unavailableItems : []
  };
}

function priceOrderItems(items) {
  const priced = [];
  const unmatched = [];
  for (const item of items) {
    const menuItem = findMenuItem(item.name);
    const quantity = Number(item.quantity) > 0 ? Math.floor(Number(item.quantity)) : 1;
    if (!menuItem) {
      unmatched.push(item.name);
      continue;
    }
    priced.push({ id: menuItem.id, name: menuItem.name, price: menuItem.price, quantity });
  }
  const subtotal = priced.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal > 0 ? DELIVERY_FEE : 0;
  return { priced, unmatched, subtotal, deliveryFee, total: subtotal + deliveryFee };
}

function formatReceipt({ reference, draft, priced, subtotal, deliveryFee, total }) {
  const itemLines = priced.map((item) => `- ${item.name} x${item.quantity}   ₱${item.price * item.quantity}`).join('\n');
  return `Capitol Restaurant: Order Received

Reference No.: ${reference}
Status: Pending Confirmation

Name: ${draft.name}
Contact Number: ${draft.phone}
Delivery Address: ${draft.address}
Payment Method: ${draft.paymentMethod || 'Not specified'}

Items:
${itemLines}

Subtotal:      ₱${subtotal}
Delivery Fee:  ₱${deliveryFee}
Total:         ₱${total}
${draft.notes ? `\nNotes: ${draft.notes}` : ''}

A staff member, manager, or admin will confirm your order shortly.`;
}

async function handleOrderMessage(senderId, messageText, preloadedSession) {
  const session = preloadedSession || (await getMessengerSession(senderId));
  let draft;
  try {
    draft = await extractOrderDraft(session.draft || {}, messageText);
  } catch (error) {
    console.error('❌ Gemini failed to extract order details:', error.message);
    await sendMessage(senderId, 'Sorry, we had trouble reading your order details. Could you resend them?');
    return;
  }

  const { priced, unmatched, subtotal, deliveryFee, total } = priceOrderItems(draft.items || []);
  const missing = missingOrderFields({ ...draft, items: priced });

  if (missing.length > 0 || unmatched.length > 0 || priced.length === 0) {
    await saveMessengerSession(senderId, { state: 'collecting', draft });
    const notes = [];
    if (missing.length > 0) notes.push(`Please provide: ${missing.join(', ')}.`);
    if (unmatched.length > 0) notes.push(`These items aren't on our menu and were skipped: ${unmatched.join(', ')}.`);
    await sendMessage(senderId, `Thanks! To complete your order, I still need a bit more info.\n${notes.join('\n')}`);
    return;
  }

  const { data: referenceData, error: referenceError } = await supabase.rpc('next_delivery_reference');
  if (referenceError || !referenceData) {
    console.error('❌ Failed to generate order reference:', referenceError);
    await sendMessage(senderId, 'Sorry, we could not process your order right now. Our staff will follow up shortly.');
    await notifyStaff({
      inquiryId: crypto.randomUUID(),
      senderId,
      name: draft.name,
      source: 'Messenger',
      message: `Order reference generation failed for draft: ${JSON.stringify(draft)}`
    });
    return;
  }
  const reference = referenceData;

  const itemsDisplay = priced.map((item) => `${item.quantity}x ${item.name}`).join(', ');
  const { error: insertError } = await supabase.from('delivery_orders').insert([{
    reference,
    user_id: null,
    customer: draft.name,
    phone: draft.phone,
    address: draft.address,
    status: 'Pending Confirmation',
    eta: 'To be confirmed by staff',
    payment_method: draft.paymentMethod,
    notes: draft.notes,
    items_list: priced,
    items_display: itemsDisplay,
    subtotal,
    delivery_fee: deliveryFee,
    total,
    source: 'messenger',
    messenger_psid: senderId
  }]);

  if (insertError) {
    console.error('❌ Failed to create Messenger order:', insertError);
    await sendMessage(senderId, 'Sorry, we could not process your order right now. Our staff will follow up shortly.');
    await notifyStaff({
      inquiryId: crypto.randomUUID(),
      senderId,
      name: draft.name,
      source: 'Messenger',
      message: `Order insert failed for draft: ${JSON.stringify(draft)}`
    });
    return;
  }

  await clearMessengerSession(senderId);

  await supabase.from('inquiries').insert([{
    id: crypto.randomUUID(),
    user_id: null,
    name: draft.name,
    email: `messenger_${senderId}@placeholder.com`,
    type: 'Messenger Order - Pending Confirmation',
    message: `Order ${reference}: ${itemsDisplay} — ₱${total}`,
    status: 'New'
  }]);

  await sendMessage(senderId, formatReceipt({ reference, draft, priced, subtotal, deliveryFee, total }));

  await notifyStaff({
    inquiryId: reference,
    senderId,
    name: draft.name,
    source: 'Messenger',
    message: `New order ${reference} needs confirmation: ${itemsDisplay} — ₱${total}`
  });
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
      Do not invent menus, prices, availability, policies, or promises beyond these known facts:
      ${KNOWN_FACTS}
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

          const session = await getMessengerSession(senderId);
          const inOrderFlow = session.state === 'collecting';
          const orderIntent = inOrderFlow || isOrderRequest(messageText);

          if (orderIntent) {
            console.log(inOrderFlow ? 'Continuing an in-progress Messenger order.' : 'Order intent detected; starting the order flow.');
            await handleOrderMessage(senderId, messageText, session);
            continue;
          }

          const prompt = `
            You are the Capitol Restaurant customer-service assistant on Messenger.
            Reply only to informational inquiries. Never accept, start, or confirm orders or bookings; never collect order details.
            Do not invent menus, prices, availability, policies, or promises beyond these known facts:
            ${KNOWN_FACTS}
            For details not supported by those facts, politely say staff will follow up.
            If the message asks to place or continue an order, say nothing here because the order flow handles that separately.
            Return only a JSON object with one key, "suggested_reply", containing a concise, friendly answer to this informational inquiry.

            Customer message: ${JSON.stringify(messageText)}
          `;

          let replyText;
          try {
            const aiResponse = await generateWithRetry(prompt);
            const aiData = JSON.parse(aiResponse.text);
            replyText = typeof aiData.suggested_reply === 'string' ? aiData.suggested_reply.trim() : '';
          } catch (aiErr) {
            console.error('❌ Gemini failed to answer inquiry:', aiErr.message);
            replyText = 'Thanks for your inquiry. Our team will follow up with you shortly.';
          }

          const { error } = await supabase.from('inquiries').insert([{
            id: crypto.randomUUID(),
            user_id: null,
            name: `Messenger User (${senderId.slice(-4)})`,
            email: `messenger_${senderId}@placeholder.com`,
            type: 'General Inquiry',
            message: messageText,
            status: 'Resolved'
          }]);

          if (error) console.error('❌ Supabase insertion failed:', error);

          if (replyText) {
            await sendMessage(senderId, replyText);
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
