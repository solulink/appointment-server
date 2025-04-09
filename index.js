const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const appointmentRoutes = require('./routes/appointments');
const reportRoutes = require('./routes/reports');
const { connect } = require('./mongoConfig');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB when the server starts
connect().catch(err => console.error('Failed to connect to MongoDB on startup', err));
app.get('/', (req, res) => {
    res.send('Appointment Management API');
  });
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reports', reportRoutes);

app.listen(port, () => {
    //console.log(`Server is running on port ${port}`);
});