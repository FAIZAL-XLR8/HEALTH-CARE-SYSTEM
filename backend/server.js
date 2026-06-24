require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');

const app = express();

// Connect to local MongoDB instance
connectDB();

// Global Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// API Routes Configuration
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);

// Register 2:00 AM Daily Cron Ingestion Scheduler
const cron = require('node-cron');
const { executeCronDailyScrape } = require('./services/scraperService');

cron.schedule('0 2 * * *', async () => {
  try {
    await executeCronDailyScrape();
  } catch (err) {
    console.error('Scheduled cron scraping pipeline failed:', err);
  }
});

// Basic Route for verification
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Port configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
