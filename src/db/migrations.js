const pool = require('./index');

async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS price_queries (
      id SERIAL PRIMARY KEY,
      phone_number TEXT NOT NULL,
      product TEXT NOT NULL,
      location TEXT,
      ai_response TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS market_prices (
      id SERIAL PRIMARY KEY,
      product TEXT NOT NULL,
      location TEXT NOT NULL,
      price NUMERIC NOT NULL,
      recorded_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✅ Migrations complete');
}

runMigrations().catch(console.error).finally(() => process.exit());