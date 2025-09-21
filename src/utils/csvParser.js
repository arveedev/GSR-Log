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
  if (str.toLowerCase() === 'moisture') {
    return 'range';
  }
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

  const lines = csvString.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  let currentSection = null;
  let headers = [];

  lines.forEach(line => {
    if (line.startsWith('[') && line.endsWith(']')) {
      currentSection = line.substring(1, line.length - 1).trim();
      headers = [];
      return;
    }

    if (currentSection) {
      const parsed = Papa.parse(line).data[0];
      const row = parsed;

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
          
          if (header === 'moistureRanges') {
            try {
              // Parse the JSON string back into an array
              value = JSON.parse(value);
            } catch (e) {
              console.error("Failed to parse moistureRanges:", value, e);
              value = [];
            }
          } else if (header === 'price' && !isNaN(parseFloat(value))) {
            value = parseFloat(value);
          } else if (!isNaN(parseFloat(value)) && isFinite(value) && value !== '') {
            value = parseFloat(value);
          }
          item[header] = value;
        });

        item.id = item.id || uuidv4();
        
        if (data[currentSection]) {
          data[currentSection].push(item);
        }
      }
    }
  });
  
  return data;
};

// Helper function to escape values for CSV
const escapeCsvValue = (value) => {
  let strValue = String(value);
  if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
    const escapedValue = strValue.replace(/"/g, '""');
    return `"${escapedValue}"`;
  }
  return strValue;
};

/**
 * Creates a single CSV string from the structured data object.
 * @param {object} data The structured data object.
 * @returns {string} The raw CSV data as a string.
 */
export const createCsvString = (data) => {
  let output = '';

  const sections = {
    provinces: { headers: ['id', 'name'] },
    warehouses: { headers: ['id', 'name', 'province'] },
    transactionTypes: { headers: ['id', 'name'] },
    varieties: { headers: ['id', 'name', 'grain_type'] },
    mtsTypes: { headers: ['id', 'name', 'weight', 'grain_type'] },
    sdoList: { headers: ['id', 'name', 'province'] },
    enwfRanges: { headers: ['id', 'moisture', 'enwf'] },
    ricemills: { headers: ['id', 'name', 'owner_representative', 'address', 'contact_number'] },
    palayPricing: { headers: ['id', 'variety_id', 'variety', 'moisture_ranges'] },
    ricePricing: { headers: ['id', 'name', 'price', 'description'] },
    logEntries: { headers: ['id', 'date', 'province', 'warehouse', 'bags', 'netkgs', 'per50', 'variety', 'transaction_type', 'remarks', 'pr_number', 'wsr_number', 'name', 'barangay', 'municipality', 'entry_type', 'moisture_content', 'gross_kgs', 'mts_type', 'sack_weight', 'enwf', 'enw_kgs', 'basic_cost', 'pricer', 'pricer_cost', 'grand_total', 'sdo_name', 'is_logged', 'ricemill', 'ai_number', 'rice_recovery'] }
  };

  for (const sectionName in sections) {
    if (Array.isArray(data[sectionName]) && data[sectionName].length > 0) {
      const sectionHeaders = sections[sectionName].headers;
      output += `[${sectionName}]\n`;
      output += sectionHeaders.join(',') + '\n';
      
      data[sectionName].forEach(item => {
        const row = sectionHeaders.map(header => {
          const camelCaseHeader = toCamelCase(header);
          let value = item[camelCaseHeader];

          if (camelCaseHeader === 'moistureRanges') {
            // Stringify the array into a JSON string
            value = JSON.stringify(value);
          } else if (camelCaseHeader === 'price' && typeof value === 'number') {
            value = value.toFixed(2);
          }
          
          return escapeCsvValue(value !== undefined ? value : '');
        });
        output += row.join(',') + '\n';
      });
      output += '\n';
    }
  }

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
  if (!parsedData.palayPricing) {
    parsedData.palayPricing = [];
  }
  if (!parsedData.ricePricing) {
    parsedData.ricePricing = [];
  }

  return parsedData;
};