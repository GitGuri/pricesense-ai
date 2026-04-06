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
    // ── Registration flow ──
if (text.toLowerCase().trim() === 'register') {
  await saveMessage(from, 'user', text);
  await saveMessage(from, 'assistant', 'REG_STEP_1');
  await sendMessage(from, 
    `👋 Welcome to *PriceSense AI!*\n\nI'll help you get the best prices for your products.\n\nTo register, I just need a few details:\n\n*Your Name:*\n\n_(Reply with your full name)_`
  );
  return;
}

// ── Check registration steps ──
const { rows: lastMsgs } = await pool.query(
  `SELECT message FROM conversations WHERE phone_number=$1 AND role='assistant' ORDER BY created_at DESC LIMIT 1`,
  [from]
);
const lastBotMsg = lastMsgs[0]?.message || '';

// Step 1 — got name, ask location
if (lastBotMsg === 'REG_STEP_1') {
  await saveMessage(from, 'user', text);
  await saveMessage(from, 'assistant', `REG_STEP_2|name=${text.trim()}`);
  await sendMessage(from,
    `Thanks *${text.trim()}*! 👍\n\n*Your Primary Market Location:*\n\n_(e.g. Mbare, Ruwa, CBD, Chitungwiza)_`
  );
  return;
}

// Step 2 — got location, ask products
if (lastBotMsg.startsWith('REG_STEP_2')) {
  await saveMessage(from, 'user', text);
  await saveMessage(from, 'assistant', `REG_STEP_3|${lastBotMsg.split('|')[1]}|location=${text.trim()}`);
  await sendMessage(from,
    `Got it — *${text.trim()}* 📍\n\n*Main Products You Sell:*\n\n_(List all your products e.g: tomatoes, potatoes, eggs, rice, onions)_`
  );
  return;
}

// Step 3 — got products, ask payment
if (lastBotMsg.startsWith('REG_STEP_3')) {
  await saveMessage(from, 'user', text);
  await saveMessage(from, 'assistant', `REG_STEP_4|${lastBotMsg.split('|').slice(1).join('|')}|products=${text.trim()}`);
  await sendMessage(from,
    `Perfect! 🛒\n\n*Preferred Payment Method:*\n\n_(EcoCash, Zipit, USD Cash, or multiple)_`
  );
  return;
}

// Step 4 — got payment, save full profile
if (lastBotMsg.startsWith('REG_STEP_4') && !lastBotMsg.startsWith('REG_COMPLETE')) {
  await saveMessage(from, 'user', text);
  
  const parts = {};
  lastBotMsg.split('|').slice(1).forEach(p => {
    const idx = p.indexOf('=');
    parts[p.substring(0, idx)] = p.substring(idx + 1);
  });

  const { name, location, products } = parts;
  const payment = text.trim();

  await pool.query(
    `INSERT INTO vendors (phone_number, name, location, products, payment_method)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (phone_number) DO UPDATE SET
     name=$2, location=$3, products=$4, payment_method=$5`,
    [from, name, location, products, payment]
  );

  await pool.query(
    `INSERT INTO conversations (phone_number, role, message) VALUES ($1, 'system', $2)`,
    [from, `VENDOR_PROFILE: name=${name}, location=${location}, products=${products}, payment=${payment}`]
  );

  // Clear registration state
  await pool.query(
    `INSERT INTO conversations (phone_number, role, message) VALUES ($1, 'assistant', $2)`,
    [from, 'REG_COMPLETE']
  );

  await sendMessage(from,
    `✅ *You're registered, ${name}!*\n\n` +
    `📍 Market: ${location}\n` +
    `🛒 Products: ${products}\n` +
    `💳 Payment: ${payment}\n\n` +
    `You'll now get personalized price advice and daily alerts for all your products.\n\n` +
    `Just send any product name anytime to get started! 🧠`
  );
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

