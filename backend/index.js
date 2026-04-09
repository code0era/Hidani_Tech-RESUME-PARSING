require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const parseController = require('./controllers/parseController');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Database Connection
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB Cluster.'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
// The endpoint accepts `jdText` inline and a `resume` PDF file attachment
app.post('/api/parse-and-match', upload.single('resume'), parseController.processJDAndResume);

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Parser Backend is running' });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

module.exports = app;
