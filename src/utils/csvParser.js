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
    };

    if (!csvString) {
        return data;
    }

    const lines = csvString.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    let currentSection = null;
    let headers = [];

    // FIX: Updated helper function to correctly convert snake_case to camelCase.
    const toCamelCase = (str) => {
        if (str.toLowerCase() === 'moisture') {
            return 'range';
        }
        // This regex now correctly finds underscores and capitalizes the next letter.
        return str.replace(/_([a-z])/g, (match, p1) => p1.toUpperCase());
    };

    lines.forEach(line => {
        if (line.startsWith('[') && line.endsWith(']')) {
            currentSection = line.substring(1, line.length - 1).trim();
            headers = [];
            return;
        }

        if (currentSection) {
            const row = Papa.parse(line).data[0];

            if (row.length === 0 || (row.length === 1 && row[0] === '')) {
                return;
            }

            if (headers.length === 0) {
                headers = row.map(header => toCamelCase(header.trim()));
                return;
            }

            if (headers.length > 0) {
                const item = {};
                headers.forEach((header, index) => {
                    let value = row[index] !== undefined ? row[index].trim() : '';
                    if (!isNaN(parseFloat(value)) && isFinite(value) && value !== '') {
                        value = parseFloat(value);
                    }
                    item[header] = value;
                });
                
                // FIX: Add a unique ID if one doesn't already exist.
                item.id = item.id || uuidv4();
                
                if (data[currentSection]) {
                    if (currentSection === 'pricing') {
                        const pricingType = item.type;
                        if (pricingType) {
                            data.pricing[pricingType] = item.price;
                        }
                    } else {
                        data[currentSection].push(item);
                    }
                }
            }
        }
    });

    return data;
};

export const createCsvString = (data) => {
    let output = '';

    const sections = {
        provinces: { headers: ['id', 'name'] },
        warehouses: { headers: ['id', 'name', 'province'] },
        transactionTypes: { headers: ['id', 'name'] },
        varieties: { headers: ['id', 'name', 'grain_type'] },
        mtsTypes: { headers: ['id', 'name', 'weight', 'grain_type'] },
        sdoList: { headers: ['id', 'name', 'province'] },
        pricing: { headers: ['id', 'type', 'price'] },
        enwfRanges: { headers: ['id', 'moisture', 'enwf'] },
        ricemills: { headers: ['id', 'name', 'owner_representative', 'address', 'contact_number'] },
    };

    for (const sectionName in sections) {
        if (data[sectionName]) {
            output += `[${sectionName}]\n`;
            output += sections[sectionName].headers.join(',') + '\n';
            if (sectionName === 'pricing') {
                for (const key in data.pricing) {
                    const pricingItem = data.pricing[key];
                    output += `${pricingItem.id || uuidv4()},${key},${pricingItem.price}\n`;
                }
            } else {
                data[sectionName].forEach(item => {
                    const row = sections[sectionName].headers.map(header => {
                        const camelCaseHeader = header.replace(/_./g, (char) => char[1].toUpperCase());
                        return item[camelCaseHeader] || '';
                    });
                    output += row.join(',') + '\n';
                });
            }
            output += '\n';
        }
    }
    
    // FIX: Normalize logEntries to ensure all headers are present before unparsing.
    const logHeaders = ['id', 'date', 'province', 'warehouse', 'bags', 'netkgs', 'per50', 'variety', 'transaction_type', 'remarks', 'pr_number', 'wsr_number', 'name', 'barangay', 'municipality', 'entry_type', 'moisture_content', 'gross_kgs', 'mts_type', 'sack_weight', 'enwf', 'enw_kgs', 'basic_cost', 'pricer', 'pricer_cost', 'grand_total', 'sdo_name', 'is_logged', 'ricemill', 'ai_number', 'rice_recovery'];

    const normalizedLogEntries = data.logEntries.map(entry => {
        const normalizedEntry = {};
        logHeaders.forEach(header => {
            const camelCaseHeader = header.replace(/_([a-z])/g, (match, p1) => p1.toUpperCase());
            normalizedEntry[header] = entry[camelCaseHeader] || entry[header] || '';
        });
        return normalizedEntry;
    });

    const logEntriesCsv = Papa.unparse({
        fields: logHeaders,
        data: normalizedLogEntries,
    });
    
    output += `[logEntries]\n`;
    output += logEntriesCsv;

    return output;
};
export const loadAppData = async () => {
    const csvString = await fetchCsv();
    const parsedData = parseAppData(csvString);

    if (!parsedData.enwfRanges || !parsedData.enwfRanges[0] || parsedData.enwfRanges[0].range === undefined) {
        parsedData.enwfRanges = generateEnwfData();
    }
    
    parsedData.varieties = parsedData.varieties.map(v => ({
        ...v,
        grainType: v.grainType || ''
    }));
    
    if (!parsedData.ricemills) {
        parsedData.ricemills = [];
    }

    return parsedData;
};