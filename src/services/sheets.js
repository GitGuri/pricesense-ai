const { google } = require('googleapis');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function getSheets() {
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
}

async function syncToSheets(pool) {
  try {
    const sheets = await getSheets();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const [
      { rows: topProducts },
      { rows: marketPrices },
      { rows: recentQueries },
      { rows: stats }
    ] = await Promise.all([
      pool.query(`
        SELECT product, COUNT(*) as query_count
        FROM price_queries
        GROUP BY product
        ORDER BY query_count DESC LIMIT 20
      `),
      pool.query(`
        SELECT location, product, ROUND(AVG(price)::numeric, 2) as avg_price
        FROM market_prices
        GROUP BY location, product
        ORDER BY location, product
        LIMIT 200
      `),
      pool.query(`
        SELECT phone_number, product, location, created_at
        FROM price_queries
        ORDER BY created_at DESC LIMIT 50
      `),
      pool.query(`
        SELECT
          COUNT(DISTINCT phone_number) as total_vendors,
          COUNT(*) as total_queries,
          COUNT(DISTINCT product) as products_tracked,
          COUNT(DISTINCT location) as markets_covered
        FROM price_queries
      `)
    ]);

    // ── Sheet 1: Stats ──
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Stats!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          ['Total Vendors', 'Total Queries', 'Products Tracked', 'Markets Covered', 'Last Updated'],
          [
            stats[0].total_vendors,
            stats[0].total_queries,
            stats[0].products_tracked,
            stats[0].markets_covered,
            new Date().toISOString()
          ]
        ]
      }
    });

    // ── Sheet 2: Top Products ──
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'TopProducts!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          ['Product', 'Query Count'],
          ...topProducts.map(r => [r.product, r.query_count])
        ]
      }
    });

    // ── Sheet 3: Market Prices ──
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'MarketPrices!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          ['Location', 'Product', 'Average Price (USD)'],
          ...marketPrices.map(r => [r.location, r.product, r.avg_price])
        ]
      }
    });

    // ── Sheet 4: Recent Queries ──
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'RecentQueries!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          ['Phone', 'Product', 'Location', 'Time'],
          ...recentQueries.map(r => [
            r.phone_number,
            r.product,
            r.location,
            new Date(r.created_at).toLocaleString()
          ])
        ]
      }
    });

    console.log('✅ Synced to Google Sheets:', new Date().toLocaleString());
  } catch (err) {
    console.error('Sheets sync error:', err.message);
  }
}

module.exports = { syncToSheets };