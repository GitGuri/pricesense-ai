const axios = require('axios');
require('dotenv').config();

async function textToSpeech(text) {
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
      {
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg'
        },
        responseType: 'arraybuffer'
      }
    );
    return Buffer.from(response.data);
  } catch (err) {
    console.error('ElevenLabs error:', err.response?.status, Buffer.from(err.response?.data || '').toString());
    throw err;
  }
}

module.exports = { textToSpeech };