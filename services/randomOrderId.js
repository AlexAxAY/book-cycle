function generateCustomOrderId() {
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `ORD-${Date.now()}-${randomNum}`;
}

function generateCustomWalletId() {
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `WLT-${Date.now()}-${randomNum}`;
}

module.exports = { generateCustomOrderId, generateCustomWalletId };
