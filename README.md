AeroHealth 🩺

AI-Powered Healthcare & Telemedicine Platform

AeroHealth is a full-stack healthcare platform built for Bengaluru that helps patients compare real doctor consultation fees and diagnostic test prices, get AI-guided symptom triage, and book verified specialists — all backed by real-time telemedicine consultations.


✨ Features


Healthcare Cost Aggregation — Scrapes real consultation fees and diagnostic test prices from platforms like Lybrate and PathKind using Puppeteer, so patients can compare costs before booking.
Interactive Provider Map — Mapbox-powered interface to visualize verified doctors and diagnostic centers with fees, ratings, and locations.
AI Symptom Triage (RAG) — A conversational triage flow using Google Gemini + Pinecone:

Gemini asks dynamic follow-up questions to gather symptoms.
RAG retrieves clinically relevant conditions from a vector database.
Gemini recommends the appropriate medical specialist.
A second RAG pass retrieves condition-specific precautions before surfacing verified specialists nearby.



Real-Time Telemedicine — WebRTC-powered video/audio consultations with screen sharing, live chat, and typing indicators via Socket.IO.
Automatic Data Lifecycle Management — Consultation rooms and chat history are automatically purged 7 days after a consultation ends.
AI Medical Document Analysis — Gemini-powered parsing of medical reports and handwritten prescriptions.
Secure Payments — Razorpay integration for consultation booking and online payments.
Doctor Onboarding & Verification — OTP-based authentication, document verification, and role-based access control (RBAC) for doctor onboarding and admin review.
API Rate Limiting — Redis-backed rate limiting to protect sensitive and cost-incurring endpoints (e.g. Gemini calls, auth routes) from abuse.



🛠️ Tech Stack

LayerTechnologyFrontendReact (Vite)BackendNode.js, Express.jsDatabaseMongoDBCaching / Rate LimitingRedisReal-Time CommunicationSocket.IO, WebRTCWeb ScrapingPuppeteerAI / LLMGoogle GeminiVector Search (RAG)PineconePaymentsRazorpayMapsMapboxMedia StorageCloudinarySMS / OTPTwilio
