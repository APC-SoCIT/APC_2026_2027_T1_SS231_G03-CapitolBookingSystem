import 'dotenv/config';
import axios from 'axios';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json());

// Initialize Supabase using environment variables
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Initialize Gemini AI using environment variables
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'test-agent';

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

          const businessKnowledge = `
            You are an automated chatbot for "Photon Phun", a high school photobooth service managed by the Stemflix page.
            Services & Pricing:
            - Softcopy: 10 pesos
            - Hard copy (2 pcs): 40 pesos

            Rules: Help customers choose between softcopies or hard copies, calculate their total price, gather their photo details, and once they fully agree and confirm their booking/order, set "order_confirmed" to true.
          `;

          const prompt = `
            ${businessKnowledge}

            Analyze this customer message and return a JSON object with keys:
            "intent" (string),
            "urgency" (low, med, high),
            "suggested_reply" (string, your friendly response as the Photon Phun assistant based on the pricing above),
            and "order_confirmed" (boolean, true if the photobooth order is finalized).

            Customer Message: "${messageText}"
          `;

          let aiData;
          let replyText;

          try {
            // 1. Generate content via Gemini using the retry helper
            const aiResponse = await generateWithRetry(prompt);
            aiData = JSON.parse(aiResponse.text);
            replyText = aiData.suggested_reply;
            console.log('Gemini analysis complete:', aiData);
          } catch (aiErr) {
            console.error('❌ Gemini overloaded, falling back to default response.');
            aiData = { intent: 'fallback', urgency: 'low', order_confirmed: false };
            replyText = "Hi! Thanks for messaging Photon Phun (Stemflix)! We are experiencing high traffic right now. For softcopies (10 PHP) or hard copies (40 PHP for 2 pcs), please drop your order details and we'll log it shortly!";
          }

          // 2. Insert or log the chat state in Supabase
          const { data, error } = await supabase.from('inquiries').insert([
            {
              id: crypto.randomUUID(),
              user_id: null,
              name: `Messenger User (${senderId.slice(-4)})`,
              email: `messenger_${senderId}@placeholder.com`,
              type: aiData.intent || 'General Inquiry',
              message: messageText,
              status: aiData.order_confirmed ? 'resolved' : 'in progress'
            }
          ]).select();

          if (error) {
            console.error('❌ Supabase Insertion Failed Details:', error);
          } else {
            console.log('✅ Successfully inserted row into Supabase:', data);
          }

          // 3. Automatically reply back to the user via Meta Graph API
          const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;

          await axios.post(`https://graph.facebook.com/v18.0/me/messages`, {
            recipient: { id: senderId },
            message: { text: replyText }
          }, {
            params: { access_token: pageAccessToken }
          });

          console.log('✅ Automated response sent back to customer via Messenger!');

        } catch (err) {
          console.error('❌ Error caught in processing block:', err);
        }
      }
    }
    return res.status(200).send('EVENT_RECEIVED');
  }
  return res.sendStatus(404);
});

const PORT = 8000;
app.listen(PORT, () => console.log(`Webhook server listening on port ${PORT}`));
