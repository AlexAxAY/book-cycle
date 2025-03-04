function generateCustomOrderId() {
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `ORD-${Date.now()}-${randomNum}`;
}

module.exports = generateCustomOrderId;
