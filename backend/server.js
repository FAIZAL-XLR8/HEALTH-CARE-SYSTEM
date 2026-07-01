require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const initializeSocket = require('./config/socket');
const redisClient = require('./config/redisClient');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Connect to MongoDB and Redis simultaneously
Promise.all([
  connectDB(),
  redisClient.connect()
    .then(() => console.log('Connected to Redis server successfully.'))
    .catch(err => console.error('Failed to connect to Redis server:', err))
]);

// Initialize socket listeners
initializeSocket(io);

// Global Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Turn off CSP temporarily to allow script imports for calling
}));
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(cookieParser());

// Razorpay Webhook Endpoint needs Raw Buffer body BEFORE express.json() is applied
const paymentController = require('./controllers/paymentController');
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// API Routes Configuration
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);



// Basic Route for verification
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Port configuration
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT} `);
});
