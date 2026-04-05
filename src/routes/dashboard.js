const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const [
    { rows: stats },
    { rows: topProducts },
    { rows: marketPrices },
    { rows: recentQueries },
    { rows: priceByMarket }
  ] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(DISTINCT phone_number) as total_vendors,
        COUNT(*) as total_queries,
        COUNT(DISTINCT product) as products_tracked,
        COUNT(DISTINCT location) as markets_covered
      FROM price_queries
    `),
    pool.query(`
      SELECT product, COUNT(*) as query_count
      FROM price_queries
      GROUP BY product
      ORDER BY query_count DESC LIMIT 8
    `),
    pool.query(`
      SELECT location, ROUND(AVG(price)::numeric, 2) as avg_price
      FROM market_prices
      GROUP BY location
      ORDER BY avg_price ASC LIMIT 10
    `),
    pool.query(`
      SELECT phone_number, product, location, created_at
      FROM price_queries
      ORDER BY created_at DESC LIMIT 10
    `),
    pool.query(`
      SELECT location, product, ROUND(AVG(price)::numeric, 2) as avg_price
      FROM market_prices
      WHERE product IN (
        SELECT product FROM price_queries
        GROUP BY product
        ORDER BY COUNT(*) DESC LIMIT 5
      )
      GROUP BY location, product
      ORDER BY product, avg_price ASC
    `)
  ]);

  res.json({
    stats: stats[0],
    topProducts,
    marketPrices,
    recentQueries,
    priceByMarket
  });
});

module.exports = router;