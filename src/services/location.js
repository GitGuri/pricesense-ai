const axios = require('axios');

async function enrichLocation(marketName) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: `${marketName}, Zimbabwe`, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'PriceSenseAI/1.0' }
    });
    if (response.data.length > 0) {
      const { display_name, lat, lon } = response.data[0];
      return { display_name, lat, lon };
    }
  } catch (err) {
    console.error('Location enrichment failed:', err.message);
  }
  return { display_name: marketName, lat: null, lon: null };
}

module.exports = { enrichLocation };