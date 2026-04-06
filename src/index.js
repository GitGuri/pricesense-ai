const express = require('express');
const { getPriceRecommendation } = require('./agents/pricingAgent');
const { sendMessage, downloadMedia, sendAudioMessage } = require('./services/whatsapp');
const { transcribeAudio } = require('./services/gemini');
const { textToSpeech } = require('./services/voice');
const { parseMessage } = require('./utils/messageParser');
const dashboardRouter = require('./routes/dashboard');
const path = require('path');
const pool = require('./db');
require('dotenv').config();



const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/dashboard-data', dashboardRouter);

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

async function getConversationHistory(phone) {
  const { rows } = await pool.query(
    `SELECT role, message FROM conversations
     WHERE phone_number = $1
     ORDER BY created_at DESC LIMIT 10`,
    [phone]
  );
  return rows.reverse();
}

async function saveMessage(phone, role, message) {
  await pool.query(
    `INSERT INTO conversations (phone_number, role, message) VALUES ($1, $2, $3)`,
    [phone, role, message]
  );
}

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0]?.changes?.[0]?.value;
    const msg = entry?.messages?.[0];
    if (!msg) return;

    const from = msg.from;
    let text = '';
    let isVoice = false;

    if (msg.type === 'text') {
      text = msg.text.body;
    } else if (msg.type === 'audio') {
      isVoice = true;
      const { base64, mimeType } = await downloadMedia(msg.audio.id);
      text = await transcribeAudio(base64, mimeType);
      await sendMessage(from, `🎤 I heard: "${text}"\n⏳ Checking now...`);
    } else {
      return;
    }

    // ── Registration flow — check FIRST before anything else ──
    if (text.toLowerCase().trim() === 'register') {
      await saveMessage(from, 'user', text);
      await sendMessage(from, `👋 Welcome to PriceSense AI!\n\nReply with your details in this format:\n\n*NAME, PRODUCT, MARKET*\n\nExample: _Tendai, Tomatoes, Mbare_`);
      return;
    }

    const { rows: lastMsg } = await pool.query(
      `SELECT message FROM conversations WHERE phone_number=$1 AND role='assistant' ORDER BY created_at DESC LIMIT 1`,
      [from]
    );
    const lastBotMsg = lastMsg[0]?.message || '';
    const regMatch = text.match(/^([^,]+),\s*([^,]+),\s*([^,]+)$/);

    if (regMatch && lastBotMsg.includes('NAME, PRODUCT, MARKET')) {
      const [_, name, product, market] = regMatch;
      await pool.query(
        `INSERT INTO conversations (phone_number, role, message) VALUES ($1, 'system', $2)`,
        [from, `VENDOR_PROFILE: name=${name.trim()}, product=${product.trim()}, market=${market.trim()}`]
      );
      await sendMessage(from, `✅ Registered!\n\nWelcome *${name.trim()}*! I'll help you with *${product.trim()}* prices in *${market.trim()}*.\n\nSend any product name to get started. 🧠`);
      return;
    }

    // ── Save message to history ──
    await saveMessage(from, 'user', text);
    const history = await getConversationHistory(from);
    const parsed = await parseMessage(text, history);

    // ── Only show checking message for text, not voice ──
    if (!isVoice) {
      await sendMessage(from, `⏳ Checking prices for *${parsed.product || 'your query'}* in ${parsed.location || 'Harare'}...`);
    }

    const reply = await getPriceRecommendation(parsed, from, history);
    await saveMessage(from, 'assistant', reply);

    // ── Text → text reply only ──
    // ── Voice → voice reply only ──
    if (isVoice) {
      try {
        console.log('🎤 Generating voice reply...');
        const audioBuffer = await textToSpeech(reply);
        console.log('🎤 Audio generated, size:', audioBuffer.length);
        await sendAudioMessage(from, audioBuffer);
        console.log('🎤 Voice reply sent successfully');
      } catch (voiceErr) {
        console.error('Voice reply failed:', voiceErr.response?.status, JSON.stringify(voiceErr.response?.data));
        // Fallback to text if voice fails
        await sendMessage(from, reply);
      }
    } else {
      await sendMessage(from, reply);
    }

  } catch (err) {
    console.error('Webhook error:', err.message);
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const { sendDailyAlerts } = require('./services/alerts');

// Send daily alerts at 7am every day
const now = new Date();
const nextAlert = new Date();
nextAlert.setHours(7, 0, 0, 0);
if (now > nextAlert) nextAlert.setDate(nextAlert.getDate() + 1);
const msUntilAlert = nextAlert - now;

setTimeout(() => {
  sendDailyAlerts();
  setInterval(sendDailyAlerts, 24 * 60 * 60 * 1000);
}, msUntilAlert);

