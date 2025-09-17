// This file sets up a React Context to manage the application's global state.
// It handles data loading, saving to local storage, and provides functions to manipulate the data.

import React, { createContext, useContext, useState, useEffect } from 'react';
// Import utility functions for parsing and creating CSV strings.
import { parseAppData, createCsvString } from '../utils/csvParser';

// Create a new Context. This is what components will use to access the data.
export const AppDataContext = createContext(null);

// Define the key for storing data in localStorage.
const APP_DATA_STORAGE_KEY = 'gsr_log_app_data';

// Helper function to generate a unique ID using a timestamp and a random string.
// This is used to uniquely identify each log entry.
const generateUniqueId = () => {
    return Date.now() + Math.random().toString(36).substring(2, 9);
};

// This asynchronous function determines the initial state of the application's data.
const getInitialData = async () => {
    // First, try to get saved data from localStorage for persistence.
    const savedData = localStorage.getItem(APP_DATA_STORAGE_KEY);
    
    if (savedData) {
        // If data is in localStorage, use it.
        try {
            const parsedData = JSON.parse(savedData);
            // Ensure any existing entries without an ID are given one on load.
            if (parsedData.logEntries) {
                parsedData.logEntries = parsedData.logEntries.map(entry => {
                    if (!entry.id) {
                        return { ...entry, id: generateUniqueId() };
                    }
                    return entry;
                });
            }
            return parsedData;
        } catch (e) {
            console.error("Failed to parse saved data from localStorage", e);
        }
    }
    
    // If no data is in localStorage, attempt to load from the CSV file.
    try {
        const appData = await parseAppData();
        // Assign unique IDs to data loaded from CSV to prepare it for state management.
        const logEntriesWithIds = appData.logEntries.map(entry => ({
            ...entry,
            id: generateUniqueId()
        }));
        
        // Return the full data from the CSV, including the new log entries and any other data.
        return {
            ...appData,
            logEntries: logEntriesWithIds
        };
        
    } catch (err) {
        console.error("Failed to load data from CSV", err);
        // If CSV loading fails, return a safe, empty default to prevent the app from crashing.
        return {
            provinces: [],
            warehouses: [],
            varieties: [],
            transactionTypes: [],
            logEntries: [],
        };
    }
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
        const loadData = async () => {
            const initialData = await getInitialData();
            setData(initialData);
            setLoading(false);
        };
        loadData();
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
    
    // Function to add a new log entry to the state.
    const addLogEntry = (newEntry) => {
        setData(prevData => ({
            ...prevData,
            // Create a new array with the new entry added.
            logEntries: [...prevData.logEntries, { ...newEntry, id: generateUniqueId() }],
        }));
    };

    // Function to update an existing log entry by its ID.
    const updateLogEntry = (updatedEntry) => {
        setData(prevData => ({
            ...prevData,
            // Map over the array to replace the entry with a matching ID.
            logEntries: prevData.logEntries.map(entry =>
                entry.id === updatedEntry.id ? updatedEntry : entry
            ),
        }));
    };

    // Function to delete a log entry by its ID.
    const deleteLogEntry = (entryToDelete) => {
        setData(prevData => ({
            ...prevData,
            // Filter the array to remove the entry with a matching ID.
            logEntries: prevData.logEntries.filter(entry => entry.id !== entryToDelete.id),
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

    // Function to update other parts of the application data (e.g., provinces, varieties).
    const updateAppData = (updatedValues) => {
        setData(prevData => ({
            ...prevData,
            ...updatedValues
        }));
    };

    // The value object contains all the state and functions that will be made available to components.
    const value = {
        data,
        loading,
        error,
        addLogEntry,
        updateLogEntry,
        deleteLogEntry,
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