const express = require('express');
const { getPriceRecommendation } = require('./agents/pricingAgent');
const { sendMessage, downloadMedia } = require('./services/whatsapp');
const { transcribeAudio } = require('./services/gemini');
const { parseMessage } = require('./utils/messageParser');
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

app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // always ack immediately

  try {
    const entry = req.body.entry?.[0]?.changes?.[0]?.value;
    const msg = entry?.messages?.[0];
    if (!msg) return;

    const from = msg.from;
    let text = '';

    if (msg.type === 'text') {
      text = msg.text.body;
    } else if (msg.type === 'audio') {
      const { base64, mimeType } = await downloadMedia(msg.audio.id);
      text = await transcribeAudio(base64, mimeType);
    } else {
      return;
    }

    const { product, location } = parseMessage(text);
    await sendMessage(from, `⏳ Checking prices for *${product}* in ${location}...`);

    const reply = await getPriceRecommendation(product, location, from);
    await sendMessage(from, reply);

  } catch (err) {
    console.error('Webhook error:', err.message);
  }
});

app.get('/', (req, res) => res.send('PriceSense AI is running ✅'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));