// This file sets up a React Context to manage the application's global state.
// It handles data loading, saving to local storage, and provides functions to manipulate the data.

import React, { createContext, useContext, useState, useEffect } from 'react';
// Import utility functions for parsing and creating CSV strings.
// IMPORTANT: We now use loadAppData, which handles both fetching and parsing.
import { loadAppData, createCsvString } from '../utils/csvParser';
import { v4 as uuidv4 } from 'uuid'; // Import uuidv4 for generating unique IDs

// Create a new Context. This is what components will use to access the data.
export const AppDataContext = createContext(null);

// Define the key for storing data in localStorage.
const APP_DATA_STORAGE_KEY = 'gsr_log_app_data';

/**
 * Generates the granular ENWF multipliers from 22.0 to 29.9.
 * @returns {Array<Object>} An array of objects with 'moisture', 'enwf', and 'id' properties.
 */
export const generateEnwfData = () => {
    const data = [];
    let currentMultiplier = 1.040;
    
    // We loop from 220 to 299 to represent 22.0 to 29.9
    for (let i = 220; i <= 299; i++) {
        const moisture = i / 10;
        const multiplier = parseFloat(currentMultiplier.toFixed(3));
        
        data.push({
            id: uuidv4(), // FIX: Add a unique ID to each generated item
            moisture: moisture.toFixed(1),
            enwf: multiplier,
        });

        // The multiplier decreases by 0.001 for each step.
        currentMultiplier -= 0.001;
    }
    return data;
};

// This component provides the context to all its children.
export const AppDataContextProvider = ({ children }) => {
    // State to hold the application data, initially null.
    const [data, setData] = useState(null);
    // State to track if the data is still loading.
    const [loading, setLoading] = useState(true);
    // State to hold any errors that occur during data fetching.
    const [error, setError] = useState(null);

    // This single useEffect handles all initial data loading when the component first mounts.
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                let appData;
                const savedData = localStorage.getItem(APP_DATA_STORAGE_KEY);
                
                if (savedData) {
                    appData = JSON.parse(savedData);
                } else {
                    appData = await loadAppData();
                }

                // Ensure all necessary lists exist with default values if they are missing
                const defaultData = {
                    provinces: [],
                    warehouses: [],
                    transactionTypes: [],
                    varieties: [],
                    mtsTypes: [],
                    sdoList: [],
                    pricing: {},
                    enwfRanges: [],
                    logEntries: [],
                    grainTypes: ['Palay', 'Rice', 'Corn'],
                    // ✅ NEW: Add an empty array for ricemills to the default data structure.
                    ricemills: [],
                };
                
                const finalData = { ...defaultData, ...appData };

                // FIX: Normalize logEntries to ensure all keys exist and have a value.
                // This is the most crucial step to solve the "undefined" problem.
                const normalizedLogEntries = finalData.logEntries.map(entry => {
                    const normalizedEntry = { ...entry };
                    // List of expected keys that might be missing
                    const requiredKeys = [
                        'transactionType', 'remarks', 'prNumber', 'wsrNumber', 'name', 
                        'barangay', 'municipality', 'entryType', 'moistureContent', 
                        'grossKgs', 'mtsType', 'sackWeight', 'enwf', 'enwKgs', 
                        'basicCost', 'pricer', 'pricerCost', 'grandTotal', 'sdoName', 
                        'isLogged', 'ricemill', 'aiNumber', 'riceRecovery'
                    ];

                    // For each required key, if it's not present or undefined, set it to an empty string.
                    requiredKeys.forEach(key => {
                        if (normalizedEntry[key] === undefined) {
                            normalizedEntry[key] = '';
                        }
                    });

                    // Ensure a unique ID is present
                    normalizedEntry.id = normalizedEntry.id || uuidv4();

                    return normalizedEntry;
                });
                
                finalData.logEntries = normalizedLogEntries;

                // Override the ENWF data with the new, granular data if it's missing or in the old format.
                if (!finalData.enwfRanges || finalData.enwfRanges.length === 0 || finalData.enwfRanges[0].moisture === undefined) {
                    // FIX: Re-run generateEnwfData to ensure a unique ID is assigned to each item.
                    finalData.enwfRanges = generateEnwfData();
                }

                setData(finalData);

            } catch (err) {
                console.error("Failed to load data:", err);
                setError(err);
                // On error, set a safe, empty default to prevent app from crashing.
                setData({
                    provinces: [],
                    warehouses: [],
                    varieties: [],
                    transactionTypes: [],
                    logEntries: [],
                    mtsTypes: [],
                    enwfRanges: generateEnwfData(), // Use the new function on error
                    sdoList: [],
                    pricing: {},
                    grainTypes: ['Palay', 'Rice', 'Corn'],
                    // ✅ NEW: Add an empty array for ricemills to the error fallback.
                    ricemills: [],
                });
            } finally {
                // This ensures loading is set to false regardless of success or failure.
                setLoading(false);
            }
        };
        loadInitialData();
    }, []); // Empty dependency array ensures this runs only once.

    // Effect to save data to localStorage whenever it changes.
    useEffect(() => {
        if (data) {
            try {
                localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(data));
            } catch (e) {
                console.error("Failed to save data to localStorage", e);
            }
        }
    }, [data]); // Dependency array ensures this runs whenever 'data' changes.
    
    // Function to update the entire application data state
    const updateAppData = (updatedValues) => {
        setData(prevData => ({
            ...prevData,
            ...updatedValues
        }));
    };
    
    // Function to export all data to a CSV file.
    const exportData = () => {
        const csvString = createCsvString(data);
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'gsr_data.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // The value object contains all the state and functions that will be made available to components.
    const value = {
        data,
        loading,
        error,
        exportData,
        updateAppData,
    };
    
    // Renders a loading message while data is being fetched.
    if (loading) {
        return <div>Loading...</div>;
    }
    
    // Renders an error message if data fetching fails.
    if (error) {
        return <div>Error: {error.message}</div>;
    }

    // Provides the value to all child components.
    return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

// This is a custom hook to simplify accessing the context.
export const useAppData = () => {
    const context = useContext(AppDataContext);
    // Throws an error if the hook is used outside of the context provider.
    if (context === undefined) {
        throw new Error('useAppData must be used within an AppDataContextProvider');
    }
    return context;
};