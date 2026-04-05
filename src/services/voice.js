const gtts = require('gtts');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

async function textToSpeech(text) {
  return new Promise((resolve, reject) => {
    const tts = new gtts(text, 'en');
    const tmpPath = path.join('/tmp', `reply_${Date.now()}.mp3`);
    
    tts.save(tmpPath, (err) => {
      if (err) return reject(err);
      const buffer = fs.readFileSync(tmpPath);
      fs.unlinkSync(tmpPath);
      resolve(buffer);
    });
  });
}

module.exports = { textToSpeech };