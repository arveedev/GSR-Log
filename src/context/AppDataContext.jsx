import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
// We no longer need parseAppData from csvParser because the server sends JSON.
import { createCsvString } from '../utils/csvParser';
import { v4 as uuidv4 } from 'uuid';

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

    /**
     * SAFE Centralized function to save data on the server using the RMW pattern.
     * This replaces the unsafe 'saveAppDataOnServer'.
     * @param {string} listName The key of the list being modified (e.g., 'riceMills', 'logEntries').
     * @param {string} action The action being performed ('add', 'update', 'delete').
     * @param {Object} item The single item object being added, updated, or deleted.
     */
    const updateServerData = useCallback(async (listName, action, item) => {
        try {
            // NOTE: listName here is already the desired camelCase key (e.g., 'riceMills')
            const response = await fetch(`http://localhost:3001/api/manage-data/${listName}/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(item),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server update failed for ${listName}/${action}! Status: ${response.status} - ${errorText}`);
            }

            // The server returns the FULL updated array for that list (e.g., all logEntries)
            const updatedList = await response.json(); 
            
            // Safely update the local state using the server's response.
            setData(prevData => {
                if (!prevData) return null;

                // CRITICAL FIX: Ensure the key used for local state update is ALWAYS camelCase ('riceMills'),
                // regardless of what the server may have returned.
                const keyToUpdate = (listName.toLowerCase() === 'ricemills') ? 'riceMills' : listName;

                // We must also defensively clear the incorrect lowercase key if it exists in the previous state.
                const newData = { ...prevData, [keyToUpdate]: updatedList };

                if (listName.toLowerCase() === 'ricemills' && newData.ricemills) {
                     // Delete the problematic lowercase key if it somehow got into state
                    delete newData.ricemills;
                }

                return newData; 
            });

            console.log(`Data successfully updated on the server for ${listName}/${action}.`);
            return true; // Indicate success
        } catch (error) {
            console.error('Error saving data:', error);
            // Optionally, set an error state here or alert the user
            return false; // Indicate failure
        }
    }, [setData]); // Dependency on setData

    // NOTE: saveAppDataOnServer is removed entirely as it's the source of the bug.

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

                // Define a base data structure to ensure all keys are always present
                const baseData = {
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
                    riceMills: [], // <-- CORRECT CASE
                    palayPricing: [],
                    ricePricing: [],
                    aiDocuments: [],
                    customers: [],
                };
                
                // CRITICAL FIX (LOAD): Consolidate 'ricemills' (lowercase from server file) 
                // into 'riceMills' (camelCase, preferred internal key) before merging.
                const normalizedAppData = { ...appData };
                if (normalizedAppData.ricemills && !normalizedAppData.riceMills) {
                    normalizedAppData.riceMills = normalizedAppData.ricemills;
                    delete normalizedAppData.ricemills; // Remove the problematic key
                }
                
                const finalData = {
                    ...baseData,
                    ...normalizedAppData, // Use the normalized data
                };
                
                // Normalization logic (KEEPING THIS AS IS)
                finalData.riceMills = finalData.riceMills.map(item => {
                    const newItem = { ...item };
                    if (newItem.contact_number) {
                        newItem.contactNumber = newItem.contact_number;
                        delete newItem.contact_number;
                    }
                    return newItem;
                });

                finalData.warehouses = finalData.warehouses.map(item => {
                    const newItem = { ...item };
                    if (newItem.warehouse_code) {
                        newItem.warehouseCode = newItem.warehouse_code;
                        delete newItem.warehouse_code;
                    }
                    return newItem;
                });
                
                finalData.palayPricing = finalData.palayPricing.map(item => {
                    const newItem = { ...item };
                    if (newItem.variety_id) {
                        newItem.varietyId = newItem.variety_id;
                        delete newItem.variety_id;
                    }
                    return newItem;
                });

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

                const normalizedCustomers = finalData.customers.map(customer => ({
                    name: customer.name,
                    address: customer.address,
                }));

                const uniqueCustomers = Array.from(new Map(normalizedCustomers.map(item => [JSON.stringify(item), item])).values());
                finalData.customers = uniqueCustomers;
                
                if (!finalData.enwfRanges || finalData.enwfRanges.length === 0 || finalData.enwfRanges[0].moisture === undefined) {
                    finalData.enwfRanges = generateEnwfData();
                }

                setData(finalData);
                // We should only use the NEW safe server function if we initialize data.
                // We cannot use updateServerData here as it relies on state setter.
                // You must ensure that the server handles saving of default data upon 404 response.
                if (response.status === 404) {
                    // This is a special case. Since updateServerData is designed for lists, 
                    // we keep the old-style call here to save the entire initial structure
                    // only if the file didn't exist, which is safer than no save at all.
                    // This is the *only* time this full save should be allowed.
                    fullSaveInitialData(finalData); 
                }

            } catch (err) {
                console.error("Failed to load data:", err);
                setError(err);
                // This ensures that even on a loading error, the state is fully formed
                const baseData = {
                    provinces: [], warehouses: [], varieties: [], transactionTypes: [], logEntries: [],
                    mtsTypes: [], enwfRanges: generateEnwfData(), sdoList: [], pricing: {},
                    grainTypes: ['Palay', 'Rice', 'Corn'], riceMills: [], palayPricing: [], ricePricing: [],
                    aiDocuments: [], customers: [],
                };
                setData(baseData);
                // Don't attempt to save baseData if loading failed, unless absolutely necessary
                // fullSaveInitialData(baseData);
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []); // Empty dependency array ensures this runs only once.
    
    // TEMPORARY FULL SAVE for initial load (to be decommissioned once server handles this better)
    const fullSaveInitialData = async (initialData) => {
        try {
            await fetch('http://localhost:3001/api/save-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(initialData),
            });
            console.log('Initial data structure saved to server.');
        } catch (error) {
            console.error('Error saving initial data:', error);
        }
    };

    // Function to add a new log entry.
    const addLogEntry = async (newEntry) => { // ADDED 'async'
        await updateServerData('logEntries', 'add', { ...newEntry, id: uuidv4() });
    };

    // Function to update an existing log entry.
    const updateLogEntry = async (updatedEntry) => { // ADDED 'async'
        await updateServerData('logEntries', 'update', updatedEntry);
    };
    
    // Function to delete a log entry.
    const deleteLogEntry = async (entryToDelete) => { // ADDED 'async'
        await updateServerData('logEntries', 'delete', entryToDelete);
    };

    // Function to add a new AI document.
    const addAiDocument = async (newDocument) => { // ADDED 'async'
        await updateServerData('aiDocuments', 'add', { ...newDocument, id: uuidv4(), isLogged: false });
    };

    // Function to update an existing AI document.
    const updateAiDocument = async (updatedDocument) => { // ADDED 'async'
        await updateServerData('aiDocuments', 'update', updatedDocument);
    };
    
    // Function to update the customers list (for auto-learning).
    const updateCustomersList = async (newCustomer) => { // ADDED 'async'
        if (!data) return;
        const isExisting = data.customers.some(
            c => c.name === newCustomer.name && c.address === newCustomer.address
        );

        if (!isExisting) {
            await updateServerData('customers', 'add', newCustomer);
        }
    };

    // Function to update the entire application data state (DECOMMISSIONED)
    // NOTE: This function is now deprecated. Components should use the new 
    // updateServerData directly or the other specific handlers (add/update/delete)
    // for specific lists (e.g., riceMills, varieties) within the Manage Data tab.
    // We are keeping it here but logging an error to alert developers not to use it for data lists.
    const updateAppData = (updatedValues) => {
        console.error("WARNING: updateAppData is DEPRECATED for list changes (like ricemills, varieties). Use updateServerData directly instead.");
        setData(prevData => {
            if (!prevData) {
                return null;
            }
            // For non-list updates (like configuration or single values), 
            // the full save must still be used, but this is extremely risky.
            const newData = { ...prevData, ...updatedValues };
            fullSaveInitialData(newData); // Using the full-save temporary helper
            return newData;
        });
    };
    
    // Function to export all data to a CSV file. (KEEPING AS IS)
    const exportData = () => {
        if (!data) {
            console.error("No data to export.");
            return;
        }
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
        // New safe function available for CRUD operations in Manage Data tab
        updateServerData, 
        addAiDocument,
        updateAiDocument,
        updateCustomersList,
    };
    
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