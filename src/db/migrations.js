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
  await pool.query(`
  CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    phone_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    products TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    registered_at TIMESTAMP DEFAULT NOW()
  );
`);
await pool.query(
  `INSERT INTO vendors (phone_number, name, location, products, payment_method)
   VALUES ($1, $2, $3, $4, $5)
   ON CONFLICT (phone_number) DO UPDATE SET
   name=$2, location=$3, products=$4, payment_method=$5`,
  [from, name, location, products, payment]
);

// Also save to conversations for AI context
await pool.query(
  `INSERT INTO conversations (phone_number, role, message) VALUES ($1, 'system', $2)`,
  [from, `VENDOR_PROFILE: name=${name}, location=${location}, products=${products}, payment=${payment}`]
);
  console.log('✅ Migrations complete');
}
