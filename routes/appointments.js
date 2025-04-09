const express = require('express');
const router = express.Router();
const { connect, AppointmentModel } = require('../mongoConfig');
const mongoose = require('mongoose');

// Helper function to validate appointment data
const isValidAppointment = (appointment) => {
    return (
        appointment.service &&
        appointment.name &&
        appointment.phone &&
        typeof appointment.date === 'string' && // Expecting a string now
        appointment.time &&
        appointment.status !== undefined &&
        typeof appointment.numberOfPeople === 'number' &&
        appointment.email
    );
};

// GET all appointments
router.get('/', async (req, res) => {
    try {
        await connect();
        const appointments = await AppointmentModel.find();
        res.json(appointments);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

// POST a new appointment
router.post('/', async (req, res) => {
    const newAppointment = req.body;

    if (!isValidAppointment(newAppointment)) {
        return res.status(400).json({ error: 'Invalid appointment data' });
    }

    try {
        await connect();
        const appointment = new AppointmentModel(newAppointment);
        const savedAppointment = await appointment.save();
        res.status(201).json(savedAppointment);
    } catch (error) {
        console.error('Error adding appointment:', error);
        res.status(500).json({ error: 'Failed to add appointment' });
    }
});

// GET a specific appointment by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ error: 'Invalid appointment ID' });
    }

    try {
        await connect();
        const appointment = await AppointmentModel.findById(id);
        if (appointment) {
            res.json(appointment);
        } else {
            res.status(404).json({ error: 'Appointment not found' });
        }
    } catch (error) {
        console.error('Error fetching appointment:', error);
        res.status(500).json({ error: 'Failed to fetch appointment' });
    }
});

// PUT (update) an existing appointment
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const updatedAppointment = req.body;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ error: 'Invalid appointment ID' });
    }

    if (!isValidAppointment(updatedAppointment)) {
        return res.status(400).json({ error: 'Invalid appointment data' });
    }

    try {
        await connect();
        const updated = await AppointmentModel.findByIdAndUpdate(id, updatedAppointment, { new: true });
        if (updated) {
            res.json(updated);
        } else {
            res.status(404).json({ error: 'Appointment not found' });
        }
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ error: 'Failed to update appointment' });
    }
});

// DELETE an appointment
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ error: 'Invalid appointment ID' });
    }

    try {
        await connect();
        const deleted = await AppointmentModel.findByIdAndDelete(id);
        if (deleted) {
            res.status(204).send(); // No content
        } else {
            res.status(404).json({ error: 'Appointment not found' });
        }
    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).json({ error: 'Failed to delete appointment' });
    }
});

module.exports = router;