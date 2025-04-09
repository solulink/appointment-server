const { google } = require('googleapis');

const formatDateForSheet = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getAppendRange = (sheetName) => `${sheetName}!A:H`; // Updated range to include Email

// Helper function to write data to Google Sheets
async function writeToSheet(authClient, spreadsheetId, range, values) {
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: values,
            },
        });
    } catch (error) {
        console.error('Error writing to sheet:', error);
        throw error;
    }
}

// Helper function to write headers to Google Sheets
async function writeHeaders(authClient, spreadsheetId, sheetName, headers) {
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    try {
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName}!A1:H1`, // Updated range to include Email
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [headers],
            },
        });
    } catch (error) {
        console.error('Error writing headers:', error);
        throw error;
    }
}

// Helper function to delete a sheet
async function deleteSheet(authClient, spreadsheetId, sheetName) {
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    try {
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId,
        });
        const sheetIdToDelete = spreadsheet.data.sheets.find(sheet => sheet.properties.title === sheetName)?.properties.sheetId;
        if (sheetIdToDelete) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{
                        deleteSheet: {
                            sheetId: sheetIdToDelete,
                        },
                    }],
                },
            });
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting sheet:', error);
        return false;
    }
}

// Helper function to create a new Google Sheet and add headers
async function createSheetWithHeaders(authClient, spreadsheetId, sheetName, headers) {
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    try {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    addSheet: {
                        properties: {
                            title: sheetName,
                        },
                    },
                }],
            },
        });
        await writeHeaders(authClient, spreadsheetId, sheetName, headers);
        return true;
    } catch (error) {
        console.error('Error creating sheet with headers:', error);
        return false;
    }
}

module.exports = {
    formatDateForSheet,
    getAppendRange,
    writeToSheet,
    writeHeaders,
    deleteSheet,
    createSheetWithHeaders,
};