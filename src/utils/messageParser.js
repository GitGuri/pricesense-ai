function parseMessage(body) {
  const parts = body.toLowerCase().split(',').map(s => s.trim());
  return {
    product: parts[0] || 'unknown',
    location: parts[1] || 'Harare'
  };
}

module.exports = { parseMessage };