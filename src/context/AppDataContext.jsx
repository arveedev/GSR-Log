// This file sets up a React Context to manage the application's global state.
// It handles data loading, saving to local storage, and provides functions to manipulate the data.

import React, { createContext, useContext, useState, useEffect } from 'react';
// Import utility functions for parsing and creating CSV strings.
import { createCsvString } from '../utils/csvParser';
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
            id: uuidv4(),
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
                    const response = await fetch('http://localhost:3001/get-data');
                    if (response.status === 404) {
                        console.log('No data file found on the server. Starting with default empty data.');
                        appData = {};
                    } else if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    } else {
                        appData = await response.json();
                    }
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
                    ricemills: [],
                    palayPricing: [],
                    ricePricing: [],
                };
                
                const finalData = { ...defaultData, ...appData };

                // Fix: Normalize varieties and mtsTypes data to use camelCase for grainType
                finalData.varieties = finalData.varieties.map(item => ({
                    ...item,
                    grainType: item.grainType || item.grain_type,
                    grain_type: undefined,
                }));
                finalData.mtsTypes = finalData.mtsTypes.map(item => ({
                    ...item,
                    grainType: item.grainType || item.grain_type,
                    grain_type: undefined,
                }));

                // Fix: Normalize ricemills data to use camelCase for ownerRepresentative
                finalData.ricemills = finalData.ricemills.map(item => ({
                    ...item,
                    ownerRepresentative: item.ownerRepresentative || item.owner_representative,
                    owner_representative: undefined,
                }));
                
                // Fix: Normalize logEntries to ensure all keys exist and have a value.
                const normalizedLogEntries = finalData.logEntries.map(entry => {
                    return {
                        ...entry,
                        id: entry.id || uuidv4(),
                        transactionType: entry.transactionType || entry.transaction_type || '',
                        prNumber: entry.prNumber || entry.pr_number || '',
                        wsrNumber: entry.wsrNumber || entry.wsr_number || '',
                        entryType: entry.entryType || entry.entry_type || '',
                        moistureContent: entry.moistureContent || entry.moisture_content || '',
                        grossKgs: entry.grossKgs || entry.gross_kgs || '',
                        mtsType: entry.mtsType || entry.mts_type || '',
                        sackWeight: entry.sackWeight || entry.sack_weight || '',
                        enwKgs: entry.enwKgs || entry.enw_kgs || '',
                        basicCost: entry.basicCost || entry.basic_cost || '',
                        pricerCost: entry.pricerCost || entry.pricer_cost || '',
                        grandTotal: entry.grandTotal || entry.grand_total || '',
                        sdoName: entry.sdoName || entry.sdo_name || '',
                        isLogged: entry.isLogged || entry.is_logged || false,
                        aiNumber: entry.aiNumber || entry.ai_number || '',
                        riceRecovery: entry.riceRecovery || entry.rice_recovery || '',
                    };
                });
                
                finalData.logEntries = normalizedLogEntries;

                // FIX: Normalize palayPricing data by correctly parsing the JSON string
                finalData.palayPricing = finalData.palayPricing.map(item => {
                    let moistureRanges = item.moistureRanges;
                    
                    // Check if the old key 'moisture_ranges' exists and is a string
                    if (!moistureRanges && item.moisture_ranges && typeof item.moisture_ranges === 'string') {
                         try {
                             // Correctly parse the JSON string into an array of objects
                             moistureRanges = JSON.parse(item.moisture_ranges);
                         } catch (e) {
                             console.error("Failed to parse moisture_ranges JSON string:", e);
                             moistureRanges = []; // Default to an empty array on error
                         }
                    }
                    
                    return {
                        ...item,
                        moistureRanges: moistureRanges || [], // Ensure it's always an array
                        moisture_ranges: undefined, // Clean up the old key
                    };
                });


                if (!finalData.enwfRanges || finalData.enwfRanges.length === 0 || finalData.enwfRanges[0].moisture === undefined) {
                    finalData.enwfRanges = generateEnwfData();
                }

                setData(finalData);

            } catch (err) {
                console.error("Failed to load data:", err);
                setError(err);
                setData({
                    provinces: [], warehouses: [], varieties: [], transactionTypes: [], logEntries: [],
                    mtsTypes: [], enwfRanges: generateEnwfData(), sdoList: [], pricing: {},
                    grainTypes: ['Palay', 'Rice', 'Corn'], ricemills: [], palayPricing: [], ricePricing: []
                });
            } finally {
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
    }, [data]);
    
    // Function to add a new log entry.
    const addLogEntry = (newEntry) => {
        setData(prevData => ({
            ...prevData,
            logEntries: [...prevData.logEntries, { ...newEntry, id: uuidv4() }],
        }));
    };

    // Function to update an existing log entry.
    const updateLogEntry = (updatedEntry) => {
        setData(prevData => ({
            ...prevData,
            logEntries: prevData.logEntries.map(entry =>
                entry.id === updatedEntry.id ? updatedEntry : entry
            ),
        }));
    };
    
    // Function to delete a log entry.
    const deleteLogEntry = (entryToDelete) => {
        setData(prevData => ({
            ...prevData,
            logEntries: prevData.logEntries.filter(entry => entry.id !== entryToDelete.id),
        }));
    };

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
        addLogEntry,
        updateLogEntry,
        deleteLogEntry,
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