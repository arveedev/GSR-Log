const express = require('express');
// Use 'fs/promises' for consistent async/await file operations
const fs = require('fs/promises'); 
const path = require('path');
const cors = require('cors');
// Only use PapaParse for both reading and writing
const Papa = require('papaparse');

const app = express();
const port = 3001;

// Define the path to your CSV file
const DATA_FILE_PATH = path.join(__dirname, 'public', 'gsr_data.csv');

app.use(cors());
// This middleware is crucial. It parses incoming JSON requests.
app.use(express.json({ limit: '50mb' }));

// ----------------------------------------------------------------------
// HELPER FUNCTIONS 
// ----------------------------------------------------------------------

// Define the full set of headers for the logEntries section
const logEntryHeaders = [
    'id', 'date', 'province', 'warehouse', 'bags', 'netKgs', 'per50', 'variety', 
    'transactionType', 'remarks', 'prNumber', 'wsrNumber', 'name', 'barangay', 
    'municipality', 'entryType', 'moistureContent', 'grossKgs', 'mtsType', 
    'sackWeight', 'enwf', 'enwKgs', 'basicCost', 'pricer', 'pricerCost', 
    'grandTotal', 'sdoName', 'isLogged', 'ricemill', 'aiNumber', 'riceRecovery'
];

/**
 * Defines the column headers for each array-based section.
 */
const getHeadersForSection = (sectionName) => {
    switch (sectionName) {
        case 'provinces': return ['id', 'name'];
        case 'warehouses': return ['id', 'name', 'province', 'warehouseCode']; 
        case 'transactionTypes': return ['id', 'name'];
        case 'varieties': return ['id', 'name', 'grainType'];
        case 'mtsTypes': return ['id', 'name', 'weight', 'grainType'];
        case 'sdoList': return ['id', 'name', 'province'];
        case 'enwfRanges': return ['id', 'moisture', 'enwf'];
        case 'riceMills': return ['id', 'name', 'owner', 'address', 'contactNumber']; 
        case 'palayPricing': return ['id', 'varietyId', 'variety', 'moistureRanges'];
        case 'ricePricing': return ['id', 'name', 'price', 'description'];
        case 'logEntries': return logEntryHeaders;
        case 'aiDocuments': return ['id', 'aiNumber', 'date', 'warehouseCode', 'customerName', 'isLogged'];
        case 'customers': return ['id', 'name', 'address'];
        default: return [];
    }
};

/**
 * @name cleanCsvJsonString
 * Cleans the heavily-quoted and escaped JSON string for palayPricing from CSV.
 * This handles the triple quotes and escaped inner quotes (e.g., `"""[{\\"...}]"""`).
 * @param {string} str The raw string value from the CSV column.
 * @returns {string} The cleaned, parsable JSON string.
 */
const cleanCsvJsonString = (str) => {
    if (typeof str !== 'string') {
        return ''; 
    }

    let cleaned = str.trim();

    // 1. Remove all external quotes (", "", """, etc.) iteratively
    while (cleaned.length >= 2 && cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.substring(1, cleaned.length - 1).trim();
    }
    
    // 2. Unescape JSON quotes (convert \\" to " or \" to ").
    // This is the core fix to get a valid JSON structure.
    // It should handle both single and double-escaped backslashes preceding a quote.
    cleaned = cleaned.replace(/\\"/g, '"');
    
    return cleaned;
};

// --- CRITICAL REPLACEMENT FOR parseMultiSectionCsv ---

/**
 * A custom function to parse your multi-section CSV file
 */
async function parseMultiSectionCsv(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        const sections = {};

        // Helper function to handle parsing for individual sections
        const processSectionData = (sectionName, csvData) => {
            const trimmedCsvData = csvData.trim();
            
            // ==========================================================
            // === FAILSAFE: MANUAL PARSING FOR [riceMills] SECTION ===
            // ==========================================================
            if (sectionName === 'riceMills') { 
                const lines = trimmedCsvData.split(/\r?\n/).filter(line => line.trim().length > 0);
                
                if (lines.length <= 1) return []; // Only header or empty
                
                const expectedHeaders = getHeadersForSection(sectionName); 
                
                const dataRows = lines.slice(1);
                const result = [];

                dataRows.forEach(row => {
                    const parseResult = Papa.parse(row, {
                        header: false,
                        dynamicTyping: false,
                        skipEmptyLines: true,
                        delimiter: ",",
                        quotes: true, 
                    });

                    const values = parseResult.data[0];

                    if (values && values.length === expectedHeaders.length) {
                        let item = {};
                        expectedHeaders.forEach((header, i) => {
                            const value = (values[i] || '').trim();
                            item[header] = value; 
                        });
                        result.push(item);
                    }
                });
                
                return result;
            }
            // =========================================================
            // === END FAILSAFE: Use PapaParse for all other sections ===
            // =========================================================

            try {
                const parseResult = Papa.parse(trimmedCsvData, {
                    header: true,
                    // FIX: Disable dynamic typing to preserve leading zeros in warehouseCode
                    dynamicTyping: false, 
                    skipEmptyLines: true,
                    delimiter: ",",
                    quotes: true, 
                });

                let jsonArray = parseResult.data || [];
                
                // 🎯 CRITICAL FIX: Use the new robust helper to clean and parse moistureRanges
                if (sectionName === 'palayPricing') {
                    jsonArray = jsonArray.map(item => {
                        if (item.moistureRanges) {
                            try {
                                const cleanedString = cleanCsvJsonString(item.moistureRanges);
                                
                                // The error was happening here (line ~134 in your file)
                                item.moistureRanges = JSON.parse(cleanedString); 
                                
                            } catch (e) {
                                console.error("Error parsing moistureRanges for palayPricing:", e);
                                // console.error("Failing to parse this cleaned string:", cleanedString); // Keep this commented for production unless debugging
                                item.moistureRanges = [];
                            }
                        }
                        return item;
                    }).filter(item => Object.keys(item).some(key => item[key] !== null && item[key] !== '' && item[key] !== undefined));
                }

                
                if (sectionName === 'pricing') {
                    const pricingObject = {};
                    jsonArray.forEach(item => {
                        if (item.key && item.value) {
                            pricingObject[item.key] = item.value;
                        }
                    });
                    return pricingObject;
                } else if (sectionName !== 'palayPricing') {
                    // Filter out empty objects for all other array sections (excluding palayPricing which was filtered above)
                    return jsonArray.filter(item => Object.keys(item).some(key => item[key] !== null && item[key] !== '' && item[key] !== undefined));
                }
                
                return jsonArray; // Return the array (already filtered if palayPricing)
            } catch (e) {
                console.error(`Failed to parse CSV for section [${sectionName}]:`, e);
                return sectionName === 'pricing' ? {} : [];
            }
        };

        // 1. Robustly split the entire file by the section headers ([sectionName])
        const sectionRegex = /(\[(.*?)\]\r?\n)([\s\S]*?)(?=\[.*\]\r?\n|$)/g;
        let match;

        while ((match = sectionRegex.exec(data)) !== null) {
            let sectionName = match[2].trim(); 
            const csvContent = match[3];
            
            // Ensure the section name is stored with the correct case
            if (sectionName.toLowerCase() === 'ricemills') {
                sectionName = 'riceMills'; 
            }
            
            if (sectionName) {
                sections[sectionName] = processSectionData(sectionName, csvContent);
            }
        }
        
        return sections;
    } catch (e) {
        console.error('Fatal Error in parseMultiSectionCsv:', e);
        return {}; 
    }
}


/**
 * Creates a single CSV string from the structured data object. 
 */
const createCsvString = (data) => {
    let csvContent = '';
    const sectionOrder = [
        'provinces', 'warehouses', 'transactionTypes', 'varieties', 
        'mtsTypes', 'sdoList', 'pricing', 'enwfRanges', 'riceMills', 
        'palayPricing', 'ricePricing', 'logEntries', 'aiDocuments', 'customers'
    ];
    
    sectionOrder.forEach(sectionName => {
        const sectionData = data[sectionName];
        let csvSection = '';
        
        // --- Logic for Array-based Sections ---
        if (sectionData && Array.isArray(sectionData)) {
            const headers = getHeadersForSection(sectionName);
            
            let dataToUnparse = sectionData;

            // Special handling for palayPricing serialization (re-stringifying moistureRanges)
            if (sectionName === 'palayPricing') {
                dataToUnparse = sectionData.map(item => {
                    // Ensure that a non-empty string is used if moistureRanges exists and needs to be serialized
                    const moistureRangesString = Array.isArray(item.moistureRanges) 
                        ? JSON.stringify(item.moistureRanges) 
                        : item.moistureRanges || '';
                    
                    return {
                        ...item,
                        // Re-run the fix for the triple quote output when writing
                        // This forces PapaParse to output: """[{...}]""" 
                        // which is what your system expects to read back later.
                        moistureRanges: moistureRangesString ? JSON.stringify(moistureRangesString) : ''
                    };
                });
            }
            
            const unparseOptions = {
                columns: headers,
                header: true, 
                skipEmptyLines: false,
                quotes: true
            };
            
            if (sectionData.length === 0) {
                csvSection = Papa.unparse(dataToUnparse, unparseOptions);
                csvSection = csvSection.split('\n')[0]; 
            } else {
                csvSection = Papa.unparse(dataToUnparse, unparseOptions);
            }
        
        // --- Logic for Object-based Sections (e.g., 'pricing') ---
        } else if (sectionData && typeof sectionData === 'object' && !Array.isArray(sectionData)) {
            if (sectionName === 'pricing') {
                const jsonArray = Object.keys(sectionData).map(key => ({ key, value: sectionData[key] }));
                if (jsonArray.length > 0) {
                    csvSection = Papa.unparse(jsonArray);
                } else {
                    csvSection = Papa.unparse([{}], { columns: ['key', 'value'], header: true }).split('\n')[0];
                }
            }
        }
        
        // CRITICAL: Force the CSV header to use the camelCase section name
        csvContent += `[${sectionName}]\n${csvSection}\n\n`;
    });

    return csvContent.trim();
};

// ----------------------------------------------------------------------
// EXPRESS ROUTES
// ----------------------------------------------------------------------

// The targeted CRUD endpoint (Read-Modify-Write)
app.post('/api/manage-data/:listName/:action', async (req, res) => {
    const { listName: clientListName, action } = req.params;
    const item = req.body; // The item to add, update, or delete
    
    // Determine the final internal key, forcing riceMills to camelCase
    const internalListName = (clientListName.toLowerCase() === 'ricemills') ? 'riceMills' : clientListName;

    try {
        // 1. READ: Load the entire current data from the CSV file.
        const allData = await parseMultiSectionCsv(DATA_FILE_PATH);
        
        const isObjectSection = internalListName === 'pricing';

        if (!allData[internalListName] || (!Array.isArray(allData[internalListName]) && !isObjectSection)) {
            return res.status(404).send(`List '${internalListName}' not found or is not a recognized data structure.`);
        }

        let list = allData[internalListName];
        
        // 2. MODIFY: Apply the specific CRUD action.
        if (action === 'add') {
            if (!isObjectSection) {
                list.push(item);
            } else {
                if (item.key) list[item.key] = item.value;
            }
        } 
        else if (action === 'update' || action === 'edit') { 
            if (!isObjectSection) {
                const index = list.findIndex(i => i.id === item.id);
                if (index !== -1) {
                    list[index] = item;
                } else {
                    return res.status(404).send(`Item with ID ${item.id} not found in ${internalListName}.`);
                }
            } else {
                if (item.key) list[item.key] = item.value;
            }
        } else if (action === 'delete') {
            if (!isObjectSection) {
                list = list.filter(i => i.id !== item.id);
            } else {
                if (item.key) delete list[item.key];
            }
        } else {
            return res.status(400).send(`Invalid action: ${action}`);
        }

        // Update the master data object with the modified list
        allData[internalListName] = list;

        // 3. WRITE: Convert the ENTIRE, now-updated data object back to CSV and save.
        const csvString = createCsvString(allData);
        await fs.writeFile(DATA_FILE_PATH, csvString, 'utf8');
        
        console.log(`Action '${action}' on list '${internalListName}' completed successfully.`);
        // Respond with the modified list (which can be used by the frontend to update state)
        return res.status(200).json(list); 

    } catch (error) {
        console.error(`Error during ${action} operation on ${clientListName}:`, error);
        return res.status(500).send(`Failed to process data: ${error.message}`);
    }
});


// The original /api/save-data route (full-state save)
app.post('/api/save-data', async (req, res) => {
    // Ensure the received data also uses 'riceMills' before saving
    const updatedData = req.body;
    if (updatedData.ricemills && !updatedData.riceMills) {
        updatedData.riceMills = updatedData.ricemills;
        delete updatedData.ricemills;
    }
    
    try {
        const csvString = createCsvString(updatedData);
        await fs.writeFile(DATA_FILE_PATH, csvString, 'utf8');
        
        console.log('The server is using this path:', DATA_FILE_PATH);
        console.log('Data saved successfully!');
        res.status(200).send('Data saved successfully!');
    } catch (error) {
        console.error('Error converting data to CSV or writing to file:', error);
        return res.status(500).send('Failed to process data for saving.');
    }
});

app.get('/get-data', async (req, res) => {
    // Define default data outside of the try/catch for cleaner use
    const defaultData = {
        provinces: [], warehouses: [], transactionTypes: [], varieties: [], mtsTypes: [], 
        sdoList: [], pricing: {}, enwfRanges: [], riceMills: [], palayPricing: [], 
        ricePricing: [], logEntries: [], aiDocuments: [], customers: []
    };
    
    try {
        const data = await parseMultiSectionCsv(DATA_FILE_PATH);
        const finalData = { ...defaultData, ...data };
        
        console.log('Data retrieved and formatted successfully!');
        res.status(200).json(finalData);
    } catch (err) {
        if (err.code === 'ENOENT') {
            // If file not found, return a full empty default structure
            return res.status(404).json(defaultData); 
        }
        console.error('Error processing CSV file:', err);
        return res.status(500).send('Failed to retrieve data.');
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});