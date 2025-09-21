const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const csv = require('csvtojson');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.text({ type: 'text/csv', limit: '50mb' }));

// A custom function to parse your multi-section CSV file
async function parseMultiSectionCsv(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', async (err, data) => {
            if (err) {
                return reject(err);
            }

            const sections = {};
            const lines = data.split(/\r?\n/);
            let currentSection = null;
            let currentCsvData = '';
            
            for (const line of lines) {
                if (line.startsWith('[') && line.endsWith(']')) {
                    // Process the previous section if it exists
                    if (currentSection && currentCsvData) {
                        const jsonArray = await csv().fromString(currentCsvData);
                        // Start of the fix: Check for palayPricing section and parse the nested data
                        if (currentSection === 'palayPricing') {
                            jsonArray.forEach(item => {
                                if (item.moisture_ranges) {
                                    try {
                                        item.moisture_ranges = JSON.parse(item.moisture_ranges);
                                    } catch (e) {
                                        console.error('Failed to parse moisture_ranges JSON:', e);
                                        item.moisture_ranges = []; // Default to an empty array on failure
                                    }
                                }
                            });
                        }
                        // End of the fix
                        sections[currentSection] = jsonArray;
                    }

                    // Start a new section
                    currentSection = line.substring(1, line.length - 1);
                    currentCsvData = '';
                } else if (currentSection) {
                    currentCsvData += line + '\n';
                }
            }

            // Process the last section
            if (currentSection && currentCsvData) {
                const jsonArray = await csv().fromString(currentCsvData);
                // Start of the fix: Check for palayPricing section and parse the nested data
                if (currentSection === 'palayPricing') {
                    jsonArray.forEach(item => {
                        if (item.moisture_ranges) {
                            try {
                                item.moisture_ranges = JSON.parse(item.moisture_ranges);
                            } catch (e) {
                                console.error('Failed to parse moisture_ranges JSON:', e);
                                item.moisture_ranges = []; // Default to an empty array on failure
                            }
                        }
                    });
                }
                // End of the fix
                sections[currentSection] = jsonArray;
            }

            resolve(sections);
        });
    });
}

// Endpoint to save data
app.post('/save-data', (req, res) => {
    const csvData = req.body;
    const filePath = path.join(__dirname, 'public', 'gsr_data.csv');

    fs.writeFile(filePath, csvData, (err) => {
        if (err) {
            console.error('Error writing to file:', err);
            return res.status(500).send('Failed to save data.');
        }
        console.log('Data saved successfully!');
        res.status(200).send('Data saved successfully!');
    });
});

// Endpoint to get data, now with custom parsing
app.get('/get-data', async (req, res) => {
    const filePath = path.join(__dirname, 'public', 'gsr_data.csv');
    
    try {
        const data = await parseMultiSectionCsv(filePath);
        console.log('Data retrieved and formatted successfully!');
        res.status(200).json(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            // If the file is not found, send an empty structured object
            return res.status(200).json({
                provinces: [],
                warehouses: [],
                transactionTypes: [],
                varieties: [],
                mtsTypes: [],
                sdoList: [],
                pricing: [],
                enwfRanges: [],
                ricemills: [],
                palayPricing: [],
                ricePricing: [],
                logEntries: []
            });
        }
        console.error('Error processing CSV file:', err);
        return res.status(500).send('Failed to retrieve data.');
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});