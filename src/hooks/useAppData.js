// This file defines a custom React Hook for accessing the application's global state.
// This pattern simplifies data access and ensures components are used correctly.

import { useContext } from 'react';
import { AppDataContext } from '../context/AppDataContext';
// Note: The createCsvString import is not used here but may be a remnant from previous versions.
import { createCsvString } from '../utils/csvParser';

/**
 * A custom hook to provide easy access to the application's data context.
 * It's a clean way to retrieve state and functions from AppDataContextProvider.
 *
 * @returns {object} The application data, loading state, error, and helper functions.
 */
export const useAppData = () => {
    // useContext retrieves the value provided by the nearest AppDataContext.Provider.
    const context = useContext(AppDataContext);
    
    // This is a crucial error-handling step. It ensures the hook is
    // only used within a component tree that is wrapped by the provider.
    // If not, it throws a descriptive error, preventing silent failures.
    if (context === undefined) {
        throw new Error('useAppData must be used within an AppDataContextProvider');
    }

    // Destructure the values and functions from the context object for direct use.
    // The exportData function is now provided by the context provider, making it
    // accessible to any component using this hook.
    const { data, loading, error, addLogEntry, updateLogEntry, deleteLogEntry, exportData, updateAppData } = context;

    // Return the destructured values and functions, making them available
    // to any component that calls this hook.
    return {
        data,
        loading,
        error,
        addLogEntry,
        updateLogEntry,
        deleteLogEntry,
        exportData,
        updateAppData
    };
};