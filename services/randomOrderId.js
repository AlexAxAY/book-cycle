function generateCustomOrderId() {
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `ORD-${Date.now()}-${randomNum}`;
}

function generateCustomWalletId() {
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `WLT-${Date.now()}-${randomNum}`;
}

function generateRefId() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `RF${(Date.now() % 1e6).toString(36).toUpperCase()}${randomNum}`;
}

module.exports = {
  generateCustomOrderId,
  generateCustomWalletId,
  generateRefId,
};
