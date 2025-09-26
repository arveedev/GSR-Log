// This module handles all data parsing and serialization for the application.
// It reads from and writes to a specific CSV file format.

import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { generateEnwfData } from '../context/AppDataContext';

// Helper function to fetch the CSV file asynchronously.
const fetchCsv = async () => {
    try {
        const response = await fetch('/gsr_data.csv');
        if (!response.ok) {
            console.error('Failed to fetch CSV file:', response.statusText);
            return '';
        }
        const text = await response.text();
        return text;
    } catch (error) {
        console.error('Error fetching CSV file:', error);
        return '';
    }
};

/**
 * Parses a single CSV string into a structured data object.
 * This is the corrected version that handles sections and complex data.
 * @param {string} csvString The raw CSV data as a string.
 * @returns {object} A structured object containing all the parsed data lists.
 */
export const parseAppData = (csvString) => {
    const data = {};
    if (!csvString) {
        return data;
    }

    const sections = csvString.split('\n[').slice(1);

    sections.forEach(section => {
        const lines = section.split('\n');
        const sectionName = lines[0].replace(']\r', '').replace(']', '').trim();
        const content = lines.slice(1).join('\n');

        if (!content.trim()) {
            data[sectionName] = [];
            return;
        }

        const parsed = Papa.parse(content, { 
            header: true, 
            skipEmptyLines: true,
            // Dynamic typing can sometimes cause issues, so we'll handle it manually
            // dynamicTyping: true, 
        });

        // Manually handle specific data types and normalize keys
        const normalizedData = parsed.data.map(item => {
            const newItem = {};
            for (const key in item) {
                const camelCaseKey = key.trim().replace(/_([a-z])/g, (match, p1) => p1.toUpperCase());
                let value = item[key];
                
                // Specific data type conversions
                if (camelCaseKey === 'price' || camelCaseKey === 'weight' || camelCaseKey === 'enwf') {
                    value = parseFloat(value) || 0;
                }
                
                // Handle isLogged boolean
                if (camelCaseKey === 'isLogged') {
                    value = value === 'true';
                }

                // FIX: Correctly parse the JSON string for moistureRanges
                if (camelCaseKey === 'moistureRanges' && value) {
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        console.error(`Error parsing JSON for moistureRanges:`, e, value);
                        value = []; // Default to an empty array on error
                    }
                }
                
                newItem[camelCaseKey] = value;
            }
            return newItem;
        });

        data[sectionName] = normalizedData;
    });

    return data;
};

// Define the full set of headers with the new camelCase convention
const logEntryHeaders = [
    'id', 'date', 'province', 'warehouse', 'bags', 'netKgs', 'per50', 'variety', 
    'transactionType', 'remarks', 'prNumber', 'wsrNumber', 'name', 'barangay', 
    'municipality', 'entryType', 'moistureContent', 'grossKgs', 'mtsType', 
    'sackWeight', 'enwf', 'enwKgs', 'basicCost', 'pricer', 'pricerCost', 
    'grandTotal', 'sdoName', 'isLogged', 'ricemill', 'aiNumber', 'riceRecovery'
];

// Function to get the headers for a specific section
const getHeadersForSection = (sectionName) => {
    switch (sectionName) {
        case 'provinces': return ['id', 'name'];
        case 'warehouses': return ['id', 'name', 'province', 'warehouseCode'];
        case 'transactionTypes': return ['id', 'name'];
        case 'varieties': return ['id', 'name', 'grainType'];
        case 'mtsTypes': return ['id', 'name', 'weight', 'grainType'];
        case 'sdoList': return ['id', 'name', 'province'];
        case 'enwfRanges': return ['id', 'moisture', 'enwf'];
        case 'ricemills': return ['id', 'name', 'owner', 'address', 'contactNumber'];
        case 'palayPricing': return ['id', 'varietyId', 'variety', 'moistureRanges'];
        case 'ricePricing': return ['id', 'name', 'price', 'description'];
        case 'logEntries': return logEntryHeaders;
        default: return [];
    }
};

/**
 * Creates a single CSV string from the structured data object.
 * This is the corrected version that handles complex data serialization.
 * @param {object} data The structured data object.
 * @returns {string} The raw CSV data as a string.
 */
export const createCsvString = (data) => {
    let output = '';
    const sectionOrder = [
        'provinces', 'warehouses', 'transactionTypes', 'varieties', 
        'mtsTypes', 'sdoList', 'pricing', 'enwfRanges', 'ricemills', 
        'palayPricing', 'ricePricing', 'logEntries'
    ];

    sectionOrder.forEach(sectionName => {
        const sectionData = data[sectionName];
        if (Array.isArray(sectionData) && sectionData.length > 0) {
            const headers = getHeadersForSection(sectionName);
            if (headers.length === 0) return;

            // FIX: Correctly format data before unparsing, especially JSON
            const formattedData = sectionData.map(item => {
                const newItem = { ...item };
                if (sectionName === 'palayPricing' && item.moistureRanges) {
                    newItem.moistureRanges = JSON.stringify(item.moistureRanges);
                }
                return newItem;
            });
            
            const csvSection = Papa.unparse(formattedData, {
                columns: headers,
                quotes: true, // Force quotes for all fields
            });

            output += `[${sectionName}]\n${csvSection}\n\n`;
        } else if (sectionData && !Array.isArray(sectionData) && Object.keys(sectionData).length > 0) {
            // Handle the 'pricing' section which is an object
            const jsonArray = Object.keys(sectionData).map(key => ({ key, value: sectionData[key] }));
            const csvSection = Papa.unparse(jsonArray);
            output += `[${sectionName}]\n${csvSection}\n\n`;
        }
    });

    return output.trim();
};

export const loadAppData = async () => {
    const csvString = await fetchCsv();
    const parsedData = parseAppData(csvString);

    if (!parsedData.enwfRanges || !parsedData.enwfRanges[0] || parsedData.enwfRanges[0].moisture === undefined) {
        parsedData.enwfRanges = generateEnwfData();
    }
    
    // Ensure lists are always initialized as arrays
    if (!parsedData.varieties) {
        parsedData.varieties = [];
    }
    if (!parsedData.mtsTypes) {
        parsedData.mtsTypes = [];
    }
    if (!parsedData.ricemills) {
        parsedData.ricemills = [];
    }
    if (!parsedData.palayPricing) {
        parsedData.palayPricing = [];
    }
    if (!parsedData.ricePricing) {
        parsedData.ricePricing = [];
    }
    if (!parsedData.logEntries) {
        parsedData.logEntries = [];
    }

    return parsedData;
};