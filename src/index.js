const express = require('express');
const { getPriceRecommendation } = require('./agents/pricingAgent');
const { sendMessage, downloadMedia, sendAudioMessage } = require('./services/whatsapp');
const { transcribeAudio } = require('./services/gemini');
const { textToSpeech } = require('./services/voice');
const { parseMessage } = require('./utils/messageParser');
const { syncToSheets } = require('./services/sheets');
const pool = require('./db');
require('dotenv').config();



const app = express();
app.use(express.json());

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

    // Save user message to history
    await saveMessage(from, 'user', text);

    // Get conversation history for context
    const history = await getConversationHistory(from);

    const parsed = await parseMessage(text, history);

    if (!isVoice) {
      await sendMessage(from, `⏳ Checking prices for *${parsed.product || 'your query'}* in ${parsed.location || 'Harare'}...`);
    }

    const reply = await getPriceRecommendation(parsed, from, history);

    // Save AI reply to history
    await saveMessage(from, 'assistant', reply);

    // Send text reply
    await sendMessage(from, reply);

    // Send voice reply
    try {
      console.log('🎤 Generating voice reply...');
      const audioBuffer = await textToSpeech(reply);
      console.log('🎤 Audio generated, size:', audioBuffer.length);
      await sendAudioMessage(from, audioBuffer);
      console.log('🎤 Voice reply sent successfully');
    } catch (voiceErr) {
      console.error('Voice reply failed:', voiceErr.response?.status, JSON.stringify(voiceErr.response?.data));
    }

  } catch (err) {
    console.error('Webhook error:', err.message);
  }
});

app.get('/', (req, res) => res.send('PriceSense AI is running ✅'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
syncToSheets(pool);
setInterval(() => syncToSheets(pool), 5 * 60 * 1000);