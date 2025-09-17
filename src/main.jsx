// This file is the main entry point for the entire React application.
// It initializes the React DOM and renders the root component.

import React from 'react';
import ReactDOM from 'react-dom/client';
// Import the main App component of the application.
import App from './App.jsx'; // Make sure the file extension is .jsx

// ReactDOM.createRoot is the modern way to create a root for a React application.
// It targets the HTML element with the id 'root', which is where the entire
// application's component tree will be mounted and rendered.
ReactDOM.createRoot(document.getElementById('root')).render(
  // React.StrictMode is a development-only tool. It helps you find potential
  // problems in your application by performing checks and warnings.
  <React.StrictMode>
    {/* The main App component is rendered here, which contains all the
        other components, logic, and styling for the application. */}
    <App />
  </React.StrictMode>,
);