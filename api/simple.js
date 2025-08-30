const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// CORS middleware for Vercel
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Simple test routes
app.get('/api/presentations', (req, res) => {
  res.json([]);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Environment info endpoint  
app.get('/api/environment', (req, res) => {
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NETLIFY ||
    process.env.RAILWAY_PROJECT_ID ||
    process.env.CF_PAGES ||
    process.env.FUNCTIONS_WORKER_RUNTIME ||
    process.env.NODE_ENV === 'production' && !process.env.PORT
  );
  
  res.json({ 
    isServerless,
    supportsFileGeneration: !isServerless 
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled application error:", error);
  const status = error.status || error.statusCode || 500;
  const message = error.message || "Internal Server Error";
  res.status(status).json({ message });
});

module.exports = app;
