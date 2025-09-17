// This module handles all data parsing and serialization for the application.
// It reads from and writes to a specific CSV file format.

// PapaParse is a robust CSV parser library that handles various data complexities.
import Papa from 'papaparse';

// Helper function to fetch the CSV file asynchronously.
const fetchCsv = async () => {
    // The fetch API reads the CSV file from the public directory.
    const response = await fetch('/gsr_data.csv');
    const reader = response.body.getReader();
    const result = await reader.read();
    const decoder = new TextDecoder('utf-8');
    // Decode the data into a readable string.
    const csv = decoder.decode(result.value);
    return csv;
};

// Main function to parse and structure the data from the CSV file.
// It returns a categorized JavaScript object.
export const parseAppData = async () => {
    const csvString = await fetchCsv();
    
    // Use a custom header to ensure we capture all columns in the correct order.
    const headerOrder = ['date', 'province', 'warehouse', 'bags', 'netkgs', 'per50', 'variety', 'transaction_type', 'remarks'];

    // Initialize the main data structure to be populated.
    const parsedData = {
        provinces: [],
        warehouses: [],
        varieties: [],
        transactionTypes: [],
        logEntries: [],
    };
    
    // A flag to switch from parsing lookup data to log entries.
    let isLogSection = false;
    // Split the CSV string into an array of lines, remove whitespace, and filter out empty lines.
    const lines = csvString.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    lines.forEach(line => {
        // Split each line by commas to inspect its content.
        const row = line.split(',');
        
        // This condition identifies the start of the log entries section,
        // which is marked by a specific header row.
        if (row.includes('date') && row.includes('province') && row.includes('warehouse')) {
            isLogSection = true;
            return; // Skip the header row itself.
        }
        
        // If we are still in the lookup data section...
        if (!isLogSection) {
            const type = row[0];
            const name = row[1];
            
            // Use a switch statement to categorize the data based on the first column.
            switch (type) {
                case 'province':
                    parsedData.provinces.push({ name });
                    break;
                case 'warehouse':
                    // FIX: This line corrects a previous bug. 'parent' was changed to 'province'
                    // to align the data structure with the rest of the application.
                    const province = row[2] || '';
                    parsedData.warehouses.push({ name, province });
                    break;
                case 'variety':
                    parsedData.varieties.push({ name });
                    break;
                case 'transaction_type':
                    parsedData.transactionTypes.push({ name });
                    break;
                default:
                    // Ignore any unrecognized rows.
                    break;
            }
        } else {
            // Once we are in the log entries section, use PapaParse.
            // PapaParse is essential here because it correctly handles commas inside quoted fields.
            const values = Papa.parse(line).data[0];
            const entry = {};
            // Map the parsed values to the correct headers to form the log entry object.
            headerOrder.forEach((header, index) => {
                entry[header] = values[index];
            });
            parsedData.logEntries.push(entry);
        }
    });

    return parsedData;
};

// New function to convert our structured data back into a CSV string.
export const createCsvString = (data) => {
    // Manually construct the CSV string for the lookup data section.
    let lookupCsv = '';
    data.provinces.forEach(p => lookupCsv += `province,${p.name}\n`);
    // FIX: This line was corrected to use 'w.province' instead of 'w.parent'
    // to match the data structure and ensure correct serialization.
    data.warehouses.forEach(w => lookupCsv += `warehouse,${w.name},${w.province}\n`);
    data.varieties.forEach(v => lookupCsv += `variety,${v.name}\n`);
    data.transactionTypes.forEach(t => lookupCsv += `transaction_type,${t.name}\n`);
    
    const headerOrder = ['date', 'province', 'warehouse', 'bags', 'netkgs', 'per50', 'variety', 'transaction_type', 'remarks'];
    // Use PapaParse's 'unparse' function for the log entries. This is safer than
    // manual concatenation as it correctly handles quoting and escaping.
    const logEntriesCsv = Papa.unparse({
        fields: headerOrder,
        data: data.logEntries,
    });

    // Combine the lookup data and the log entries into a single CSV string.
    return lookupCsv + '\n' + logEntriesCsv;
};