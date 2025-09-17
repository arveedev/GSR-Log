// This custom hook stores state in localStorage to persist across sessions.
// It is a powerful pattern that combines useState and useEffect for data persistence.

import { useState, useEffect } from 'react';

/**
 * A custom hook that works like useState, but its state is automatically
 * saved to and loaded from the browser's localStorage.
 *
 * @param {string} key The key used to store the data in localStorage.
 * @param {any} initialState The default value to use if no data is found in localStorage.
 * @returns {[any, Function]} A stateful value and a function to update it, just like useState.
 */
export const usePersistentState = (key, initialState) => {
  // Initialize state using a function to lazily read from localStorage.
  // This ensures the localStorage read only happens once on the initial render.
  const [state, setState] = useState(() => {
    try {
      const storedValue = localStorage.getItem(key);
      // If a value exists in localStorage, parse it from JSON.
      // Otherwise, use the provided initialState.
      return storedValue ? JSON.parse(storedValue) : initialState;
    } catch (error) {
      // Robust error handling in case localStorage is disabled or data is corrupted.
      console.error('Error parsing localStorage key:', key, error);
      return initialState;
    }
  });

  // This effect runs every time the 'state' or 'key' changes.
  // Its purpose is to synchronize the state with localStorage.
  useEffect(() => {
    try {
      // Serialize the state to a JSON string before saving it.
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      // Error handling for cases where localStorage might be full or inaccessible.
      console.error('Error setting localStorage key:', key, error);
    }
  }, [key, state]); // The dependency array ensures this effect re-runs only when these values change.

  // The hook returns the same array as the standard useState hook,
  // making it a seamless drop-in replacement.
  return [state, setState];
};