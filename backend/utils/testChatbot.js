const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const { handleChatbotMessage } = require('../controllers/chatbotController');

async function runTest() {
  console.log("🔌 Connecting to MongoDB...");
  await connectDB();
  console.log("✅ MongoDB Connected.");

  // Create mock Express request and response objects
  const req = {
    body: {
      messages: [
        {
          sender: 'user',
          text: "I feel severe spinning movements and nausea"
        },
        {
          sender: 'ai',
          text: "Are you also experiencing any vomiting, headache, or loss of balance alongside the spinning movements?"
        },
        {
          sender: 'user',
          text: "Yes, I have vomiting, headache, loss of balance, and unsteadiness"
        }
      ]
    }
  };

  const res = {
    statusCode: 200,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      console.log("\n🤖 --- Chatbot Controller Response ---");
      console.log(`Status Code: ${this.statusCode}`);
      console.log("Response Body:", JSON.stringify(data, null, 2));
      console.log("---------------------------------------\n");
      
      // Close database connection after complete
      mongoose.connection.close();
      console.log("🔌 MongoDB connection closed.");
    }
  };

  console.log("🧪 Simulating chatbot controller call with symptom description...");
  try {
    await handleChatbotMessage(req, res);
  } catch (error) {
    console.error("❌ Test execution failed:", error);
    mongoose.connection.close();
  }
}

runTest();
