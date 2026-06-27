require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const initializeSocket = require('./config/socket');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Connect to Mongo DB
connectDB();

// Initialize socket listeners
initializeSocket(io);

// Global Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Turn off CSP temporarily to allow script imports for calling
}));
app.use(cors());

// Razorpay Webhook Endpoint needs Raw Buffer body BEFORE express.json() is applied
const paymentController = require('./controllers/paymentController');
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/client-log', (req, res) => {
  const fs = require('fs');
  fs.appendFileSync('socket_debug.log', `[Client Log] ${req.body.message}\n`);
  res.sendStatus(200);
});

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

server.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT} `);
});
