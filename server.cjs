const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const csv = require('csvtojson');
const Papa = require('papaparse');

const app = express();
const port = 3001;

app.use(cors());
// This middleware is crucial. It parses incoming JSON requests.
app.use(express.json({ limit: '50mb' }));

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
                    if (currentSection && currentCsvData) {
                        const jsonArray = await csv().fromString(currentCsvData);
                        if (currentSection === 'palayPricing') {
                            jsonArray.forEach(item => {
                                // ✅ FIX: Changed to moistureRanges (camelCase)
                                if (item.moistureRanges) {
                                    try {
                                        // ✅ FIX: Changed to moistureRanges (camelCase)
                                        item.moistureRanges = JSON.parse(item.moistureRanges);
                                    } catch (e) {
                                        console.error('Failed to parse moistureRanges JSON:', e);
                                        item.moistureRanges = [];
                                    }
                                }
                            });
                        }
                        sections[currentSection] = jsonArray;
                    }
                    currentSection = line.substring(1, line.length - 1);
                    currentCsvData = '';
                } else if (currentSection) {
                    currentCsvData += line + '\n';
                }
            }
            if (currentSection && currentCsvData) {
                const jsonArray = await csv().fromString(currentCsvData);
                if (currentSection === 'palayPricing') {
                    jsonArray.forEach(item => {
                        // ✅ FIX: Changed to moistureRanges (camelCase)
                        if (item.moistureRanges) {
                            try {
                                // ✅ FIX: Changed to moistureRanges (camelCase)
                                item.moistureRanges = JSON.parse(item.moistureRanges);
                            } catch (e) {
                                console.error('Failed to parse moistureRanges JSON:', e);
                                item.moistureRanges = [];
                            }
                        }
                    });
                }
                sections[currentSection] = jsonArray;
            }
            resolve(sections);
        });
    });
}

// Define the full set of headers for the logEntries section
// This ensures that all columns, including the new ones, are always written.
const logEntryHeaders = [
    'id', 'date', 'province', 'warehouse', 'bags', 'netKgs', 'per50', 'variety', 
    'transactionType', 'remarks', 'prNumber', 'wsrNumber', 'name', 'barangay', 
    'municipality', 'entryType', 'moistureContent', 'grossKgs', 'mtsType', 
    'sackWeight', 'enwf', 'enwKgs', 'basicCost', 'pricer', 'pricerCost', 
    'grandTotal', 'sdoName', 'isLogged', 'ricemill', 'aiNumber', 'riceRecovery'
];

const createCsvString = (data) => {
    let csvContent = '';
    const sectionOrder = [
        'provinces', 'warehouses', 'transactionTypes', 'varieties', 
        'mtsTypes', 'sdoList', 'pricing', 'enwfRanges', 'ricemills', 
        'palayPricing', 'ricePricing', 'logEntries'
    ];
    
    sectionOrder.forEach(sectionName => {
        const sectionData = data[sectionName];
        if (sectionData && Array.isArray(sectionData) && sectionData.length > 0) {
            let csvSection;
            // ✅ FIX: Use a specific set of headers for the 'logEntries' section
            if (sectionName === 'logEntries') {
                csvSection = Papa.unparse(sectionData, { columns: logEntryHeaders });
            } else if (sectionName === 'palayPricing') {
                const normalizedData = sectionData.map(item => ({
                    ...item,
                    moistureRanges: JSON.stringify(item.moistureRanges)
                }));
                csvSection = Papa.unparse(normalizedData);
            } else {
                csvSection = Papa.unparse(sectionData);
            }
            csvContent += `[${sectionName}]\n${csvSection}\n\n`;
        } else if (sectionData && !Array.isArray(sectionData) && Object.keys(sectionData).length > 0) {
            const jsonArray = Object.keys(sectionData).map(key => ({ key, value: sectionData[key] }));
            const csvSection = Papa.unparse(jsonArray);
            csvContent += `[${sectionName}]\n${csvSection}\n\n`;
        }
    });

    return csvContent.trim();
};

app.post('/api/save-data', (req, res) => {
    const updatedData = req.body;
    const filePath = path.join(__dirname, 'public', 'gsr_data.csv');

    try {
        const csvString = createCsvString(updatedData);
        
        fs.writeFile(filePath, csvString, (err) => {
            if (err) {
                console.error('Error writing to file:', err);
                return res.status(500).send('Failed to save data.');
            }
            console.log('Data saved successfully!');
            res.status(200).send('Data saved successfully!');
        });
    } catch (error) {
        console.error('Error converting data to CSV:', error);
        return res.status(500).send('Failed to process data for saving.');
    }
});

app.get('/get-data', async (req, res) => {
    const filePath = path.join(__dirname, 'public', 'gsr_data.csv');
    
    try {
        const data = await parseMultiSectionCsv(filePath);
        console.log('Data retrieved and formatted successfully!');
        res.status(200).json(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
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