// Simple test function for Vercel
module.exports = (req, res) => {
  res.status(200).json({
    message: 'Hello from Vercel!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
};
