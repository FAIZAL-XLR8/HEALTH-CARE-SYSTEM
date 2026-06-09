require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Doctor = require('../models/Doctor');
const Lab = require('../models/Lab');
const Article = require('../models/Article');

// Helper to generate a random unit vector of dimension 768
function generateRandomVector(dim = 768) {
  const vec = Array.from({ length: dim }, () => Math.random() * 2 - 1);
  const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  return vec.map(val => val / magnitude);
}

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Doctor.deleteMany();
    await Lab.deleteMany();
    await Article.deleteMany();
    console.log('Database cleared of existing records.');

    // Seed Doctors
    const doctors = [
      {
        name: 'Dr. Aditi Rao',
        specialty: 'ENT',
        experience: 12,
        clinicName: 'Clear Hearing Clinic',
        fee: 600,
        googleRating: 4.8,
        scrapedRating: 4.6,
        location: {
          type: 'Point',
          coordinates: [77.6375, 12.9725], // Indiranagar [lng, lat]
        },
        activeHours: '09:00 AM - 01:00 PM, 04:00 PM - 07:00 PM',
      },
      {
        name: 'Dr. Vikram Hegde',
        specialty: 'Cardiologist',
        experience: 18,
        clinicName: 'Apex Heart Center',
        fee: 1000,
        googleRating: 4.9,
        scrapedRating: 4.7,
        location: {
          type: 'Point',
          coordinates: [77.6250, 12.9330], // Koramangala [lng, lat]
        },
        activeHours: '10:00 AM - 02:00 PM, 05:00 PM - 08:00 PM',
      },
      {
        name: 'Dr. Pooja Sharma',
        specialty: 'Dermatologist',
        experience: 8,
        clinicName: 'Glow Skin Clinic',
        fee: 700,
        googleRating: 4.6,
        scrapedRating: 4.4,
        location: {
          type: 'Point',
          coordinates: [77.6350, 12.9100], // HSR Layout [lng, lat]
        },
        activeHours: '11:00 AM - 03:00 PM, 05:30 PM - 08:30 PM',
      },
      {
        name: 'Dr. Suresh Gowda',
        specialty: 'General Physician',
        experience: 22,
        clinicName: 'Family Health Care Clinic',
        fee: 400,
        googleRating: 4.7,
        scrapedRating: 4.5,
        location: {
          type: 'Point',
          coordinates: [77.6390, 12.9590], // Domlur [lng, lat]
        },
        activeHours: '08:30 AM - 01:30 PM, 04:30 PM - 08:30 PM',
      },
      {
        name: 'Dr. Kavitha Reddy',
        specialty: 'General Physician',
        experience: 15,
        clinicName: 'Swasthya Clinic',
        fee: 500,
        googleRating: 4.5,
        scrapedRating: 4.3,
        location: {
          type: 'Point',
          coordinates: [77.6190, 12.9350], // Koramangala [lng, lat]
        },
        activeHours: '09:00 AM - 02:00 PM',
      },
      {
        name: 'Dr. Rakesh Verma',
        specialty: 'ENT',
        experience: 10,
        clinicName: 'Verma ENT Hospital',
        fee: 800,
        googleRating: 4.4,
        scrapedRating: 4.2,
        location: {
          type: 'Point',
          coordinates: [77.7450, 12.9670], // Whitefield [lng, lat]
        },
        activeHours: '10:00 AM - 01:00 PM, 03:00 PM - 06:00 PM',
      },
    ];

    await Doctor.insertMany(doctors);
    console.log('Seeded 6 Doctors successfully.');

    // Seed Diagnostic Labs
    const labs = [
      {
        name: 'Apollo Diagnostics',
        nablAccredited: true,
        homeCollection: true,
        googleRating: 4.6,
        scrapedRating: 4.4,
        location: {
          type: 'Point',
          coordinates: [77.626579, 12.934533], // Koramangala [lng, lat]
        },
        tests: [
          { testId: 'cbc', testName: 'Complete Blood Count (CBC)', price: 299, tat: '6 hours' },
          { testId: 'lipid', testName: 'Lipid Profile (Cholesterol)', price: 699, tat: '12 hours' },
          { testId: 'hba1c', testName: 'HbA1c (Diabetes Screen)', price: 399, tat: '8 hours' },
        ],
      },
      {
        name: 'Dr. Lal PathLabs',
        nablAccredited: true,
        homeCollection: true,
        googleRating: 4.8,
        scrapedRating: 4.5,
        location: {
          type: 'Point',
          coordinates: [77.641151, 12.971891], // Indiranagar [lng, lat]
        },
        tests: [
          { testId: 'cbc', testName: 'Complete Blood Count (CBC)', price: 349, tat: '12 hours' },
          { testId: 'lipid', testName: 'Lipid Profile (Cholesterol)', price: 749, tat: '12 hours' },
          { testId: 'hba1c', testName: 'HbA1c (Diabetes Screen)', price: 449, tat: '12 hours' },
        ],
      },
      {
        name: 'Thyrocare Technologies',
        nablAccredited: true,
        homeCollection: true,
        googleRating: 4.2,
        scrapedRating: 4.0,
        location: {
          type: 'Point',
          coordinates: [77.638706, 12.911623], // HSR Layout [lng, lat]
        },
        tests: [
          { testId: 'cbc', testName: 'Complete Blood Count (CBC)', price: 249, tat: '24 hours' },
          { testId: 'lipid', testName: 'Lipid Profile (Cholesterol)', price: 599, tat: '24 hours' },
          { testId: 'hba1c', testName: 'HbA1c (Diabetes Screen)', price: 299, tat: '24 hours' },
        ],
      },
      {
        name: 'SRL Diagnostics',
        nablAccredited: true,
        homeCollection: false,
        googleRating: 4.4,
        scrapedRating: 4.1,
        location: {
          type: 'Point',
          coordinates: [77.749927, 12.969792], // Whitefield [lng, lat]
        },
        tests: [
          { testId: 'cbc', testName: 'Complete Blood Count (CBC)', price: 399, tat: '8 hours' },
          { testId: 'lipid', testName: 'Lipid Profile (Cholesterol)', price: 899, tat: '8 hours' },
          { testId: 'hba1c', testName: 'HbA1c (Diabetes Screen)', price: 499, tat: '8 hours' },
        ],
      },
      {
        name: 'Medall Healthcare',
        nablAccredited: false,
        homeCollection: true,
        googleRating: 4.0,
        scrapedRating: 3.8,
        location: {
          type: 'Point',
          coordinates: [77.638531, 12.960986], // Domlur [lng, lat]
        },
        tests: [
          { testId: 'cbc', testName: 'Complete Blood Count (CBC)', price: 199, tat: '18 hours' },
          { testId: 'lipid', testName: 'Lipid Profile (Cholesterol)', price: 549, tat: '18 hours' },
          { testId: 'hba1c', testName: 'HbA1c (Diabetes Screen)', price: 349, tat: '18 hours' },
        ],
      },
    ];

    await Lab.insertMany(labs);
    console.log('Seeded 5 Diagnostic Labs successfully.');

    // Seed RAG Articles
    const articles = [
      {
        title: 'Lipid Profile & Cholesterol Management Guidelines',
        category: 'Cardiology',
        content: 'Elevated total cholesterol (above 200 mg/dL) or LDL cholesterol (above 130 mg/dL) indicates high cholesterol levels. To manage this, consult a Cardiologist or a General Physician. Lifestyle modifications include reducing saturated fats, increasing soluble fiber intake (oats, beans), exercising at least 150 minutes per week, and potentially initiating doctor-prescribed statins if values exceed safety thresholds.',
        embedding: generateRandomVector(),
      },
      {
        title: 'Understanding Diabetes and HbA1c Levels',
        category: 'Endocrinology',
        content: 'An HbA1c test measures the average blood glucose levels over the past 3 months. A value below 5.7% is normal; 5.7% to 6.4% indicates prediabetes; and 6.5% or higher indicates diabetes. Patients with high HbA1c levels should consult an Endocrinologist or a General Physician. Lifestyle adjustments require reducing refined carbohydrate intake, monitoring daily fasting glucose, drinking 3L of water, and maintaining 7-8 hours of sleep to manage cortisol levels.',
        embedding: generateRandomVector(),
      },
      {
        title: 'Fever and Viral Triage Guidelines',
        category: 'General Medicine',
        content: 'Mild fevers (under 101°F) can be managed with paracetamol, adequate rest, and high hydration. However, persistent high fevers (above 102°F) for more than 3 days, accompanied by joint pain or throat swallowing difficulties, require consulting a General Physician or an ENT Specialist. Monitor fluid intake and avoid self-medicating with heavy antibiotics without a verified blood report.',
        embedding: generateRandomVector(),
      },
    ];

    await Article.insertMany(articles);
    console.log('Seeded 3 RAG Knowledge Documents successfully.');

    mongoose.connection.close();
    console.log('Seed job completed. Connection closed.');
  } catch (error) {
    console.error('Critical Seeding Error:', error);
    process.exit(1);
  }
};

seedData();
