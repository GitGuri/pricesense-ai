const pool = require('./index');
require('dotenv').config();

const locations = [
  // Harare suburbs & markets
  'Mbare', 'CBD', 'Avondale', 'Ruwa', 'Chitungwiza',
  'Budiriro', 'Glen Norah', 'Highfield', 'Dzivaresekwa', 'Kuwadzana',
  'Mufakose', 'Glen View', 'Harare South', 'Epworth', 'Hatfield',
  'Borrowdale', 'Eastlea', 'Belvedere', 'Mabelreign', 'Westgate',
  'Dzivaresekwa', 'Warren Park', 'Cranborne', 'Tafara', 'Mabvuku',
  // Other major Zimbabwean towns
  'Bulawayo CBD', 'Bulawayo Makokoba', 'Bulawayo Nkulumane',
  'Mutare CBD', 'Mutare Sakubva',
  'Gweru CBD', 'Gweru Mkoba',
  'Masvingo CBD',
  'Kwekwe CBD',
  'Kadoma CBD',
  'Bindura CBD',
  'Marondera CBD',
  'Chinhoyi CBD',
  'Karoi',
  'Norton',
  'Chegutu',
];

const products = [
  // ── Vegetables ──
  { name: 'tomatoes', basePrice: 1.50, unit: 'per kg' },
  { name: 'onions', basePrice: 1.20, unit: 'per kg' },
  { name: 'potatoes', basePrice: 2.00, unit: 'per kg' },
  { name: 'cabbage', basePrice: 0.80, unit: 'per head' },
  { name: 'spinach', basePrice: 0.50, unit: 'per bunch' },
  { name: 'carrots', basePrice: 1.00, unit: 'per kg' },
  { name: 'butternut', basePrice: 1.20, unit: 'each' },
  { name: 'green pepper', basePrice: 1.50, unit: 'per kg' },
  { name: 'garlic', basePrice: 3.00, unit: 'per kg' },
  { name: 'cucumber', basePrice: 0.80, unit: 'each' },
  { name: 'rape', basePrice: 0.40, unit: 'per bunch' },
  { name: 'chomolia', basePrice: 0.40, unit: 'per bunch' },
  { name: 'sweet potato', basePrice: 1.00, unit: 'per kg' },
  { name: 'pumpkin', basePrice: 1.50, unit: 'each' },
  { name: 'leeks', basePrice: 1.20, unit: 'per bunch' },
  { name: 'mushrooms', basePrice: 4.00, unit: 'per kg' },
  { name: 'beetroot', basePrice: 1.00, unit: 'per bunch' },
  { name: 'lettuce', basePrice: 0.80, unit: 'per head' },
  { name: 'broccoli', basePrice: 2.00, unit: 'per head' },
  { name: 'cauliflower', basePrice: 2.00, unit: 'per head' },
  { name: 'green beans', basePrice: 1.50, unit: 'per kg' },
  { name: 'peas', basePrice: 2.00, unit: 'per kg' },
  { name: 'okra', basePrice: 1.20, unit: 'per kg' },
  { name: 'eggplant', basePrice: 1.00, unit: 'per kg' },
  { name: 'zucchini', basePrice: 1.50, unit: 'per kg' },
  { name: 'chillies', basePrice: 2.00, unit: 'per kg' },
  { name: 'spring onions', basePrice: 0.50, unit: 'per bunch' },
  { name: 'celery', basePrice: 1.50, unit: 'per bunch' },

  // ── Fruits ──
  { name: 'bananas', basePrice: 1.00, unit: 'per dozen' },
  { name: 'mangoes', basePrice: 1.50, unit: 'per kg' },
  { name: 'avocado', basePrice: 0.30, unit: 'each' },
  { name: 'oranges', basePrice: 1.20, unit: 'per kg' },
  { name: 'apples', basePrice: 2.00, unit: 'per kg' },
  { name: 'watermelon', basePrice: 2.50, unit: 'each' },
  { name: 'papaya', basePrice: 1.00, unit: 'each' },
  { name: 'guava', basePrice: 0.80, unit: 'per kg' },
  { name: 'lemon', basePrice: 1.50, unit: 'per kg' },
  { name: 'grapes', basePrice: 3.50, unit: 'per kg' },
  { name: 'pineapple', basePrice: 1.50, unit: 'each' },
  { name: 'strawberries', basePrice: 4.00, unit: 'per punnet' },
  { name: 'peaches', basePrice: 2.50, unit: 'per kg' },
  { name: 'plums', basePrice: 2.00, unit: 'per kg' },
  { name: 'passion fruit', basePrice: 2.00, unit: 'per kg' },

  // ── Grains & Staples ──
  { name: 'mealie meal', basePrice: 1.80, unit: 'per 2kg' },
  { name: 'rice', basePrice: 2.50, unit: 'per kg' },
  { name: 'sugar beans', basePrice: 3.00, unit: 'per kg' },
  { name: 'groundnuts', basePrice: 2.00, unit: 'per kg' },
  { name: 'soya chunks', basePrice: 2.50, unit: 'per kg' },
  { name: 'bread', basePrice: 0.90, unit: 'per loaf' },
  { name: 'wheat flour', basePrice: 2.00, unit: 'per kg' },
  { name: 'sorghum', basePrice: 1.50, unit: 'per kg' },
  { name: 'millet', basePrice: 1.80, unit: 'per kg' },
  { name: 'oats', basePrice: 2.50, unit: 'per kg' },
  { name: 'barley', basePrice: 2.00, unit: 'per kg' },
  { name: 'cornstarch', basePrice: 1.50, unit: 'per kg' },
  { name: 'sadza', basePrice: 0.50, unit: 'per plate' },
  { name: 'pasta', basePrice: 1.50, unit: 'per 500g' },
  { name: 'noodles', basePrice: 0.80, unit: 'per pack' },

  // ── Proteins ──
  { name: 'eggs', basePrice: 2.50, unit: 'per dozen' },
  { name: 'chicken', basePrice: 5.00, unit: 'per kg' },
  { name: 'beef', basePrice: 7.00, unit: 'per kg' },
  { name: 'fish', basePrice: 4.00, unit: 'per kg' },
  { name: 'kapenta', basePrice: 3.50, unit: 'per kg' },
  { name: 'pork', basePrice: 6.00, unit: 'per kg' },
  { name: 'goat meat', basePrice: 8.00, unit: 'per kg' },
  { name: 'rabbit', basePrice: 5.00, unit: 'per kg' },
  { name: 'tuna canned', basePrice: 1.50, unit: 'per tin' },
  { name: 'pilchards', basePrice: 1.20, unit: 'per tin' },
  { name: 'biltong', basePrice: 12.00, unit: 'per kg' },
  { name: 'chicken feet', basePrice: 2.00, unit: 'per kg' },
  { name: 'offal', basePrice: 3.00, unit: 'per kg' },
  { name: 'sausages', basePrice: 4.00, unit: 'per kg' },
  { name: 'mopane worms', basePrice: 5.00, unit: 'per kg' },

  // ── Dairy ──
  { name: 'milk', basePrice: 1.20, unit: 'per litre' },
  { name: 'cheese', basePrice: 6.00, unit: 'per kg' },
  { name: 'butter', basePrice: 4.00, unit: 'per 500g' },
  { name: 'yoghurt', basePrice: 1.50, unit: 'per 500ml' },
  { name: 'lacto', basePrice: 0.80, unit: 'per 500ml' },
  { name: 'cream', basePrice: 2.50, unit: 'per 250ml' },

  // ── Cooking & Pantry ──
  { name: 'cooking oil', basePrice: 3.50, unit: 'per litre' },
  { name: 'salt', basePrice: 0.50, unit: 'per kg' },
  { name: 'sugar', basePrice: 1.20, unit: 'per kg' },
  { name: 'tomato sauce', basePrice: 1.50, unit: 'per bottle' },
  { name: 'baked beans', basePrice: 1.00, unit: 'per tin' },
  { name: 'margarine', basePrice: 2.00, unit: 'per 500g' },
  { name: 'peanut butter', basePrice: 2.50, unit: 'per 375g' },
  { name: 'jam', basePrice: 2.00, unit: 'per jar' },
  { name: 'mayonnaise', basePrice: 2.50, unit: 'per jar' },
  { name: 'vinegar', basePrice: 1.00, unit: 'per bottle' },
  { name: 'soy sauce', basePrice: 1.50, unit: 'per bottle' },
  { name: 'curry powder', basePrice: 1.50, unit: 'per pack' },
  { name: 'black pepper', basePrice: 2.00, unit: 'per pack' },
  { name: 'mixed herbs', basePrice: 1.50, unit: 'per pack' },
  { name: 'stock cubes', basePrice: 0.50, unit: 'per pack' },

  // ── Beverages ──
  { name: 'maheu', basePrice: 0.50, unit: 'per litre' },
  { name: 'mazoe orange', basePrice: 3.00, unit: 'per 2 litre' },
  { name: 'coca cola', basePrice: 0.80, unit: 'per 500ml' },
  { name: 'water bottle', basePrice: 0.50, unit: 'per 750ml' },
  { name: 'tea bags', basePrice: 1.50, unit: 'per 50 pack' },
  { name: 'coffee', basePrice: 3.50, unit: 'per 100g' },
  { name: 'opaque beer', basePrice: 1.00, unit: 'per litre' },
  { name: 'energy drink', basePrice: 1.50, unit: 'per 300ml' },

  // ── Household ──
  { name: 'soap bar', basePrice: 0.80, unit: 'each' },
  { name: 'washing powder', basePrice: 2.50, unit: 'per kg' },
  { name: 'dish washing liquid', basePrice: 1.50, unit: 'per 500ml' },
  { name: 'toilet paper', basePrice: 1.00, unit: 'per roll' },
  { name: 'toothpaste', basePrice: 1.50, unit: 'per tube' },
  { name: 'toothbrush', basePrice: 0.80, unit: 'each' },
  { name: 'shampoo', basePrice: 2.50, unit: 'per 400ml' },
  { name: 'lotion', basePrice: 2.00, unit: 'per 400ml' },
  { name: 'vaseline', basePrice: 1.50, unit: 'per 250ml' },
  { name: 'matches', basePrice: 0.20, unit: 'per box' },
  { name: 'candles', basePrice: 0.50, unit: 'each' },
  { name: 'charcoal', basePrice: 3.00, unit: 'per 10kg' },
  { name: 'firewood', basePrice: 2.00, unit: 'per bundle' },

  // ── Airtime & Mobile ──
  { name: 'econet airtime', basePrice: 1.00, unit: 'per $1' },
  { name: 'netone airtime', basePrice: 1.00, unit: 'per $1' },
  { name: 'telecel airtime', basePrice: 1.00, unit: 'per $1' },
  { name: 'data bundles', basePrice: 2.00, unit: 'per 1GB' },

  // ── Clothing (basics) ──
  { name: 'second hand clothes', basePrice: 1.00, unit: 'per item' },
  { name: 'socks', basePrice: 0.50, unit: 'per pair' },
  { name: 'underwear', basePrice: 1.00, unit: 'each' },
  { name: 't-shirt', basePrice: 3.00, unit: 'each' },
  { name: 'school uniform', basePrice: 8.00, unit: 'per set' },
];

const locationFactors = {
  // Harare — Mbare cheapest, CBD/Borrowdale most expensive
  'Mbare':           0.80,
  'Budiriro':        0.83,
  'Glen Norah':      0.85,
  'Highfield':       0.85,
  'Mufakose':        0.85,
  'Glen View':       0.87,
  'Dzivaresekwa':    0.87,
  'Kuwadzana':       0.88,
  'Warren Park':     0.88,
  'Tafara':          0.88,
  'Mabvuku':         0.89,
  'Epworth':         0.89,
  'Harare South':    0.90,
  'Cranborne':       0.90,
  'Chitungwiza':     0.92,
  'Ruwa':            0.95,
  'Belvedere':       0.97,
  'Mabelreign':      0.98,
  'Hatfield':        1.00,
  'Eastlea':         1.02,
  'Westgate':        1.05,
  'CBD':             1.10,
  'Avondale':        1.12,
  'Borrowdale':      1.20,
  // Other towns
  'Bulawayo CBD':    1.05,
  'Bulawayo Makokoba': 0.88,
  'Bulawayo Nkulumane': 0.90,
  'Mutare CBD':      1.05,
  'Mutare Sakubva':  0.90,
  'Gweru CBD':       1.00,
  'Gweru Mkoba':     0.88,
  'Masvingo CBD':    1.02,
  'Kwekwe CBD':      0.98,
  'Kadoma CBD':      0.97,
  'Bindura CBD':     0.98,
  'Marondera CBD':   0.97,
  'Chinhoyi CBD':    0.98,
  'Karoi':           0.95,
  'Norton':          0.93,
  'Chegutu':         0.94,
};

function randomVariation(base, factor) {
  const noise = 1 + (Math.random() * 0.2 - 0.1);
  return Math.round(base * factor * noise * 100) / 100;
}

function randomDate(daysBack) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date;
}

async function seedDatabase() {
  console.log('🌱 Seeding database — this will take a moment...');

  // Clear existing market prices
  await pool.query('DELETE FROM market_prices');
  console.log('🗑️  Cleared existing market prices');

  let count = 0;
  const RECORDS_PER_COMBO = 8; // 8 price records per product per location

  for (const product of products) {
    const values = [];
    const params = [];
    let paramIndex = 1;

    for (const location of locations) {
      const factor = locationFactors[location] || 1.0;

      for (let i = 0; i < RECORDS_PER_COMBO; i++) {
        const price = randomVariation(product.basePrice, factor);
        const date = randomDate(60); // last 60 days
        values.push(`($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3})`);
        params.push(product.name, location, price, date);
        paramIndex += 4;
        count++;
      }
    }

    // Batch insert per product
    await pool.query(
      `INSERT INTO market_prices (product, location, price, recorded_at) VALUES ${values.join(',')}`,
      params
    );

    process.stdout.write(`✅ ${product.name} seeded across all markets\n`);
  }

  console.log(`\n🎉 Done! Seeded ${count.toLocaleString()} price records`);
  console.log(`📦 ${products.length} products × ${locations.length} markets × ${RECORDS_PER_COMBO} records`);
}

seedDatabase().catch(console.error).finally(() => process.exit());