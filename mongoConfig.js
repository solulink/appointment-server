// mongoConfig.js
const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = 'appointments_db';

async function connect() {
    try {
        await mongoose.connect(uri, {
            dbName: dbName,
            //useNewUrlParser: true,
            //useUnifiedTopology: true,
        });
        //console.log('Connected to MongoDB Atlas with Mongoose');
    } catch (error) {
        console.error('Failed to connect to MongoDB Atlas with Mongoose:', error);
        throw error;
    }
}

const appointmentSchema = new mongoose.Schema({
    service: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    date: { type: String, required: true }, // Changed type to String
    time: { type: String, required: true },
    status: { type: String, default: 'Pending' },
    numberOfPeople: { type: Number, default: 1 },
    email: { type: String, required: true },
});

const AppointmentModel = mongoose.model('Appointment', appointmentSchema);

module.exports = { connect, AppointmentModel };