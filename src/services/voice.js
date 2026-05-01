const gtts = require('gtts');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

async function textToSpeech(text) {
  return new Promise((resolve, reject) => {
    const tts = new gtts(text, 'sn'); // 'sn' = Shona
    const tmpPath = path.join('/tmp', `reply_${Date.now()}.mp3`);
    
    tts.save(tmpPath, (err) => {
      if (err) {
        // fallback to English if Shona TTS fails
        const ttsEn = new gtts(text, 'en');
        ttsEn.save(tmpPath, (err2) => {
          if (err2) return reject(err2);
          const buffer = fs.readFileSync(tmpPath);
          fs.unlinkSync(tmpPath);
          resolve(buffer);
        });
        return;
      }
      const buffer = fs.readFileSync(tmpPath);
      fs.unlinkSync(tmpPath);
      resolve(buffer);
    });
  });
}

module.exports = { textToSpeech };