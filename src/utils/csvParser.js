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

// Helper function to correctly convert snake_case to camelCase.
const toCamelCase = (str) => {
    return str.replace(/_([a-z])/g, (match, p1) => p1.toUpperCase());
};

// Helper function to convert camelCase to snake_case for headers
const toSnakeCase = (str) => {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * Parses a single CSV string into a structured data object.
 * @param {string} csvString The raw CSV data as a string.
 * @returns {object} A structured object containing all the parsed data lists.
 */
export const parseAppData = (csvString) => {
    const data = {
        provinces: [],
        warehouses: [],
        transactionTypes: [],
        varieties: [],
        mtsTypes: [],
        enwfRanges: [],
        pricing: {},
        sdoList: [],
        logEntries: [],
        ricemills: [],
        palayPricing: [],
        ricePricing: [],
    };

    if (!csvString) {
        return data;
    }

    const sections = Papa.parse(csvString.trim(), {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
            const trimmedHeader = header.trim();
            // Specific header transformations for backward compatibility
            if (trimmedHeader === 'owner_representative') return 'ownerRepresentative';
            if (trimmedHeader === 'contact_number') return 'contactNumber';
            if (trimmedHeader === 'moisture_ranges') return 'moistureRanges';
            if (trimmedHeader === 'variety_id') return 'varietyId';
            
            // Log entries specific conversions
            if (trimmedHeader === 'netkgs') return 'netKgs';
            if (trimmedHeader === 'per50') return 'per50';
            if (trimmedHeader === 'transaction_type') return 'transactionType';
            if (trimmedHeader === 'pr_number') return 'prNumber';
            if (trimmedHeader === 'wsr_number') return 'wsrNumber';
            if (trimmedHeader === 'entry_type') return 'entryType';
            if (trimmedHeader === 'moisture_content') return 'moistureContent';
            if (trimmedHeader === 'gross_kgs') return 'grossKgs';
            if (trimmedHeader === 'mts_type') return 'mtsType';
            if (trimmedHeader === 'sack_weight') return 'sackWeight';
            if (trimmedHeader === 'enw_kgs') return 'enwKgs';
            if (trimmedHeader === 'basic_cost') return 'basicCost';
            if (trimmedHeader === 'pricer_cost') return 'pricerCost';
            if (trimmedHeader === 'grand_total') return 'grandTotal';
            if (trimmedHeader === 'sdo_name') return 'sdoName';
            if (trimmedHeader === 'is_logged') return 'isLogged';
            if (trimmedHeader === 'ai_number') return 'aiNumber';
            if (trimmedHeader === 'rice_recovery') return 'riceRecovery';

            return toCamelCase(trimmedHeader);
        },
        delimiter: ',',
    });

    const lines = csvString.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    let currentSection = null;
    let currentCsvData = '';

    lines.forEach(line => {
        if (line.startsWith('[') && line.endsWith(']')) {
            if (currentSection && currentCsvData) {
                const parsed = Papa.parse(currentCsvData, { header: true, skipEmptyLines: true, dynamicTyping: true });
                let normalizedData = parsed.data;

                // Normalize keys from snake_case to camelCase
                normalizedData = normalizedData.map(item => {
                    const newItem = {};
                    for (const key in item) {
                        const newKey = toCamelCase(key.trim());
                        newItem[newKey] = item[key];
                    }
                    return newItem;
                });
                data[currentSection] = normalizedData;
            }
            currentSection = line.substring(1, line.length - 1).trim();
            currentCsvData = '';
        } else if (currentSection) {
            currentCsvData += line + '\n';
        }
    });

    // Process the last section
    if (currentSection && currentCsvData) {
        const parsed = Papa.parse(currentCsvData, { header: true, skipEmptyLines: true, dynamicTyping: true });
        let normalizedData = parsed.data;
        normalizedData = normalizedData.map(item => {
            const newItem = {};
            for (const key in item) {
                const newKey = toCamelCase(key.trim());
                newItem[newKey] = item[key];
            }
            return newItem;
        });
        data[currentSection] = normalizedData;
    }

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
        case 'warehouses': return ['id', 'name', 'province'];
        case 'transactionTypes': return ['id', 'name'];
        case 'varieties': return ['id', 'name', 'grainType'];
        case 'mtsTypes': return ['id', 'name', 'weight', 'grainType'];
        case 'sdoList': return ['id', 'name', 'province'];
        case 'enwfRanges': return ['id', 'moisture', 'enwf'];
        case 'ricemills': return ['id', 'name', 'ownerRepresentative', 'address', 'contactNumber'];
        case 'palayPricing': return ['id', 'varietyId', 'variety', 'moistureRanges'];
        case 'ricePricing': return ['id', 'name', 'price', 'description'];
        case 'logEntries': return logEntryHeaders;
        default: return [];
    }
};

/**
 * Creates a single CSV string from the structured data object.
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
            const csvSection = Papa.unparse(sectionData, { columns: headers });
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