require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Appointment = require('./models/Appointment');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
//mongoose.connect(process.env.MONGODB_URI)
//  .then(() => console.log('Connected to MongoDB Atlas'))
//  .catch(err => console.error('MongoDB connection error:', err));
const connectDB = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      });
      console.log('Connected to MongoDB Atlas');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      process.exit(1); // Exit process with failure
    }
  };
  
  // Call connectDB before starting the server
  connectDB();
// Routes
app.get('/', (req, res) => {
  res.send('Appointment Scheduling API');
});

// Create appointment
app.post('/appointments', async (req, res) => {
  try {
    const { name, email, phone, date, time, service } = req.body;
    
    const appointment = new Appointment({
      name,
      email,
      phone,
      date,
      time,
      service
    });

    await appointment.save();
    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all appointments
app.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get appointment by ID
app.get('/appointments/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update appointment
app.put('/appointments/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json(appointment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete appointment
app.delete('/appointments/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For Vercel