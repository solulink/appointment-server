const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { connect, AppointmentModel } = require('../mongoConfig');
const { formatDateForSheet, getAppendRange, writeToSheet, writeHeaders, 
    deleteSheet, createSheetWithHeaders } = require('../utils/reportUtils');

// Google Sheets API Configuration
const auth = new google.auth.GoogleAuth({
    credentials: {
      private_key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      // Add other necessary fields from your service account JSON as environment variables
      // For example:
      // project_id: process.env.GOOGLE_PROJECT_ID,
      // private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      // client_id: process.env.GOOGLE_CLIENT_ID,
      // auth_uri: process.env.GOOGLE_AUTH_URI,
      // token_uri: process.env.GOOGLE_TOKEN_URI,
      // auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
      // client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const REPORT_HEADERS = ['Service', 'Name', 'Phone', 'Date', 'Time', 'Status', 'Number of People', 'Email']; // Added Email to headers

// Helper function to parse date string to Date object (assuming YYYY-MM-DD format)
const parseDateString = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // Month is 0-indexed
};

// GET daily report
router.get('/daily', async (req, res) => {
    try {
        if (!SPREADSHEET_ID) {
            return res.status(500).json({ error: 'SPREADSHEET_ID environment variable not set' });
        }
        const authClient = await auth.getClient();
        const today = new Date();
        const todayString = formatDateForSheet(today);

        await deleteSheet(authClient, SPREADSHEET_ID, `Daily-${todayString}`);
        await createSheetWithHeaders(authClient, SPREADSHEET_ID, `Daily-${todayString}`, REPORT_HEADERS);
        await connect();

        const dailyAppointments = await AppointmentModel.find({ date: todayString }).lean();

        const reportData = dailyAppointments.map(appointment => [
            appointment.service,
            appointment.name,
            appointment.phone,
            appointment.date, // Date is already a string
            appointment.time,
            appointment.status,
            appointment.numberOfPeople,
            appointment.email,
        ]);

        if (reportData.length > 0) {
            await writeToSheet(authClient, SPREADSHEET_ID, getAppendRange(`Daily-${todayString}`), reportData);
        }

        res.json({ message: `Daily report generated for ${todayString} in sheet: Daily-${todayString}` });
    } catch (error) {
        console.error('Error generating daily report:', error);
        res.status(500).json({ error: 'Failed to generate daily report' });
    }
});

// GET weekly report
router.get('/weekly', async (req, res) => {
    try {
        if (!SPREADSHEET_ID) {
            return res.status(500).json({ error: 'SPREADSHEET_ID environment variable not set' });
        }
        const authClient = await auth.getClient();
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        const startDateString = formatDateForSheet(startOfWeek);
        const endDateString = formatDateForSheet(endOfWeek);
        const sheetName = `Weekly-${startDateString}_to_${endDateString}`;

        await deleteSheet(authClient, SPREADSHEET_ID, sheetName);
        await createSheetWithHeaders(authClient, SPREADSHEET_ID, sheetName, REPORT_HEADERS);
        await connect();

        const weeklyAppointments = await AppointmentModel.find({
            date: { $gte: startDateString, $lte: endDateString },
        }).lean();

        const reportData = weeklyAppointments.map(appointment => [
            appointment.service,
            appointment.name,
            appointment.phone,
            appointment.date, // Date is already a string
            appointment.time,
            appointment.status,
            appointment.numberOfPeople,
            appointment.email,
        ]);

        if (reportData.length > 0) {
            await writeToSheet(authClient, SPREADSHEET_ID, getAppendRange(sheetName), reportData);
        }

        res.json({ message: `Weekly report generated for ${startDateString} to ${endDateString} in sheet: ${sheetName}` });
    } catch (error) {
        console.error('Error generating weekly report:', error);
        res.status(500).json({ error: 'Failed to generate weekly report' });
    }
});

// GET monthly report
router.get('/monthly', async (req, res) => {
    try {
        if (!SPREADSHEET_ID) {
            return res.status(500).json({ error: 'SPREADSHEET_ID environment variable not set' });
        }
        const authClient = await auth.getClient();
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const sheetName = `Monthly-${year}-${month}`;
        const startOfMonthString = `${year}-${month}-01`;
        const endOfMonthDate = new Date(year, today.getMonth() + 1, 0);
        const endOfMonthString = formatDateForSheet(endOfMonthDate);

        await deleteSheet(authClient, SPREADSHEET_ID, sheetName);
        await createSheetWithHeaders(authClient, SPREADSHEET_ID, sheetName, REPORT_HEADERS);
        await connect();

        const monthlyAppointments = await AppointmentModel.find({
            date: { $gte: startOfMonthString, $lte: endOfMonthString },
        }).lean();

        const reportData = monthlyAppointments.map(appointment => [
            appointment.service,
            appointment.name,
            appointment.phone,
            appointment.date, // Date is already a string
            appointment.time,
            appointment.status,
            appointment.numberOfPeople,
            appointment.email,
        ]);

        if (reportData.length > 0) {
            await writeToSheet(authClient, SPREADSHEET_ID, getAppendRange(sheetName), reportData);
        }

        res.json({ message: `Monthly report generated for ${year}-${month} in sheet: ${sheetName}` });
    } catch (error) {
        console.error('Error generating monthly report:', error);
        res.status(500).json({ error: 'Failed to generate monthly report' });
    }
});

module.exports = router;