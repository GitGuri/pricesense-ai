const axios = require('axios');
require('dotenv').config();

const BASE_URL = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`;

async function sendMessage(to, text) {
  await axios.post(`${BASE_URL}/messages`, {
    messaging_product: 'whatsapp',
    to,
    text: { body: text }
  }, {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
}

async function downloadMedia(mediaId) {
  const { data: mediaData } = await axios.get(
    `https://graph.facebook.com/v19.0/${mediaId}`,
    { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } }
  );
  const { data } = await axios.get(mediaData.url, {
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` },
    responseType: 'arraybuffer'
  });
  return {
    base64: Buffer.from(data).toString('base64'),
    mimeType: mediaData.mime_type
  };
}

const FormData = require('form-data');

async function sendAudioMessage(to, audioBuffer) {
  try {
    const form = new FormData();
    form.append('file', audioBuffer, {
      filename: 'reply.mp3',
      contentType: 'audio/mpeg'
    });
    form.append('messaging_product', 'whatsapp');
    form.append('type', 'audio/mpeg');

    console.log('📤 Uploading audio to Meta...');
    const { data: uploadData } = await axios.post(
      `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/media`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
        }
      }
    );

    console.log('📤 Audio uploaded, media ID:', uploadData.id);

    await axios.post(
      `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'audio',
        audio: { id: uploadData.id }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Voice note sent to', to);
  } catch (err) {
    console.error('sendAudioMessage error:', err.response?.status, JSON.stringify(err.response?.data));
    throw err;
  }
}
module.exports = { sendMessage, downloadMedia, sendAudioMessage };
