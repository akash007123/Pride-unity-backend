require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const contactRoutes = require('./routes/contactRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const communityRoutes = require('./routes/communityRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/contacts', contactRoutes);
app.use('/api/auth', adminAuthRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/events', eventRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
