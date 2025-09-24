import React, { createContext, useContext, useState, useEffect } from 'react';
// Import utility functions for parsing and creating CSV strings.
import { createCsvString } from '../utils/csvParser';
import { v4 as uuidv4 } from 'uuid'; // Import uuidv4 for generating unique IDs

// Create a new Context. This is what components will use to access the data.
export const AppDataContext = createContext(null);

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

    // New function to save data on the server
    const saveAppDataOnServer = async (updatedData) => {
        try {
            const response = await fetch('http://localhost:3001/api/save-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });

            if (!response.ok) {
                throw new Error(`Server error! Status: ${response.status}`);
            }

            console.log('Data successfully saved on the server.');
        } catch (error) {
            console.error('Error saving data:', error);
            // You might want to handle this error in the UI, e.g., show a toast notification
        }
    };

    // This single useEffect handles all initial data loading from the server.
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                let appData;
                
                // Fetch data from the backend
                const response = await fetch('http://localhost:3001/get-data');
                
                if (response.status === 404) {
                    console.log('No data file found on the server. Starting with default empty data.');
                    appData = {};
                } else if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                } else {
                    appData = await response.json();
                }

                // FIX: Conditionally initialize default data to prevent overwriting existing data.
                const finalData = {
                    provinces: appData.provinces || [],
                    warehouses: appData.warehouses || [],
                    transactionTypes: appData.transactionTypes || [],
                    varieties: appData.varieties || [],
                    mtsTypes: appData.mtsTypes || [],
                    sdoList: appData.sdoList || [],
                    pricing: appData.pricing || {},
                    enwfRanges: appData.enwfRanges || [],
                    logEntries: appData.logEntries || [],
                    grainTypes: appData.grainTypes || ['Palay', 'Rice', 'Corn'],
                    ricemills: appData.ricemills || [],
                    palayPricing: appData.palayPricing || [],
                    ricePricing: appData.ricePricing || [],
                };
                
                // Normalize ricemills data keys to use camelCase
                finalData.ricemills = finalData.ricemills.map(item => ({
                    ...item,
                    contactNumber: item.contactNumber || item.contact_number,
                    contact_number: undefined,
                }));
                
                // Normalize palayPricing data by correctly parsing the JSON string and converting keys
                finalData.palayPricing = finalData.palayPricing.map(item => ({
                    ...item,
                    varietyId: item.varietyId || item.variety_id,
                    variety_id: undefined,
                }));

                // Normalize logEntries data keys to use camelCase
                const normalizedLogEntries = finalData.logEntries.map(entry => {
                    return {
                        ...entry,
                        id: entry.id || uuidv4(),
                        netKgs: entry.netKgs || entry.netkgs || 0,
                        per50: entry.per50 || entry.per_50 || 0,
                        prNumber: entry.prNumber || entry.pr_number || '',
                        wsrNumber: entry.wsrNumber || entry.wsr_number || '',
                        entryType: entry.entryType || entry.entry_type || '',
                        moistureContent: entry.moistureContent || entry.moisture_content || '',
                        grossKgs: entry.grossKgs || entry.gross_kgs || 0,
                        mtsType: entry.mtsType || entry.mts_type || '',
                        sackWeight: entry.sackWeight || entry.sack_weight || 0,
                        enwKgs: entry.enwKgs || entry.enw_kgs || 0,
                        basicCost: entry.basicCost || entry.basic_cost || 0,
                        pricerCost: entry.pricerCost || entry.pricer_cost || 0,
                        grandTotal: entry.grandTotal || entry.grand_total || 0,
                        sdoName: entry.sdoName || entry.sdo_name || '',
                        isLogged: entry.isLogged || entry.is_logged || false,
                        aiNumber: entry.aiNumber || entry.ai_number || '',
                        riceRecovery: entry.riceRecovery || entry.rice_recovery || 0,
                    };
                });
                
                finalData.logEntries = normalizedLogEntries;

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
    
    // Function to add a new log entry.
    const addLogEntry = (newEntry) => {
        setData(prevData => {
            const updatedLogEntries = [...prevData.logEntries, { ...newEntry, id: uuidv4() }];
            const newData = { ...prevData, logEntries: updatedLogEntries };
            saveAppDataOnServer(newData); // Save to server
            return newData;
        });
    };

    // Function to update an existing log entry.
    const updateLogEntry = (updatedEntry) => {
        setData(prevData => {
            const updatedLogEntries = prevData.logEntries.map(entry =>
                entry.id === updatedEntry.id ? updatedEntry : entry
            );
            const newData = { ...prevData, logEntries: updatedLogEntries };
            saveAppDataOnServer(newData); // Save to server
            return newData;
        });
    };
    
    // Function to delete a log entry.
    const deleteLogEntry = (entryToDelete) => {
        setData(prevData => {
            const updatedLogEntries = prevData.logEntries.filter(entry => entry.id !== entryToDelete.id);
            const newData = { ...prevData, logEntries: updatedLogEntries };
            saveAppDataOnServer(newData); // Save to server
            return newData;
        });
    };

    // Function to update the entire application data state
    const updateAppData = (updatedValues) => {
        setData(prevData => {
            // This is the correct fix: merge the existing data with the updated values.
            const newData = { ...prevData, ...updatedValues };
            saveAppDataOnServer(newData); // Save to server
            return newData;
        });
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