const axios = require('axios');
const cheerio = require('cheerio');

const SOURCES = [
  {
    name: 'The Herald',
    url: 'https://www.herald.co.zw/category/business/',
    selector: 'article h3, article h2, .post-title'
  },
  {
    name: 'NewsDay',
    url: 'https://www.newsday.co.zw/business/',
    selector: 'article h3, article h2, .entry-title'
  },
  {
    name: 'ZimPriceCheck',
    url: 'https://www.zimpricecheck.com/',
    selector: '.product-title, .price, h3, h2'
  }
];

async function scrapeMarketData(product) {
  const results = [];

  for (const source of SOURCES) {
    try {
      const { data } = await axios.get(source.url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PriceSenseAI/1.0)'
        }
      });

      const $ = cheerio.load(data);
      const texts = [];

      $(source.selector).each((_, el) => {
        const text = $(el).text().trim();
        if (
          text.length > 10 &&
          (text.toLowerCase().includes(product.toLowerCase()) ||
            text.toLowerCase().includes('price') ||
            text.toLowerCase().includes('market') ||
            text.toLowerCase().includes('food') ||
            text.toLowerCase().includes('inflation'))
        ) {
          texts.push(text);
        }
      });

      if (texts.length > 0) {
        results.push({
          source: source.name,
          data: texts.slice(0, 5).join(' | ')
        });
      }
    } catch (err) {
      console.error(`Scrape failed for ${source.name}:`, err.message);
    }
  }

  return results.length > 0
    ? results.map(r => `[${r.source}]: ${r.data}`).join('\n')
    : 'No live market data found. Using historical data only.';
}

module.exports = { scrapeMarketData };