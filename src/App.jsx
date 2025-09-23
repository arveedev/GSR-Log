// This is the main application component. It manages the app's overall structure,
// including the tab-based navigation, and handles initial loading and error states.

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
// The AppDataContextProvider wraps the entire app, providing access to global state.
import { AppDataContextProvider } from './context/AppDataContext';
// The useAppData hook is used here to access global state for loading and errors.
// NOTE: 'exportData' has been removed as it's no longer needed.
import { useAppData } from './hooks/useAppData';
// Import all the tab components to be rendered.
import LogEntry from './components/tabs/LogEntry.jsx';
import LogHistory from './components/tabs/LogHistory.jsx';
import DailySummary from './components/tabs/DailySummary';
import ManageData from './components/tabs/ManageData';
// NEW: Import the PalayDelivery component.
import PalayDelivery from './components/tabs/PalayDelivery';

function App() {
    // State to track which tab is currently active.
    const [activeTab, setActiveTab] = useState('logEntry');
    // Access loading and error from the global data context.
    // NOTE: The 'exportData' function is no longer destructured here.
    const { loading, error } = useAppData();

    // State to control the position and width of the animated underline beneath the active tab.
    const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

    // Refs are used to get a direct reference to the DOM elements of the tab buttons.
    // This allows us to measure their position and width.
    const tabRefs = {
        logEntry: useRef(null),
        logHistory: useRef(null),
        dailySummary: useRef(null),
        manageData: useRef(null),
        // NEW: Add a ref for the new Palay Delivery tab.
        palayDelivery: useRef(null),
    };

    // This effect runs whenever the activeTab changes.
    // It measures the active tab button's size and position to update the underline.
    useEffect(() => {
        const activeRef = tabRefs[activeTab];
        if (activeRef && activeRef.current) {
            const { offsetLeft, clientWidth } = activeRef.current;
            setUnderlineStyle({
                left: offsetLeft,
                width: clientWidth,
            });
        }
    }, [activeTab]); // Dependency array ensures this runs only when activeTab changes.

    // A helper function to conditionally render the correct component based on the active tab state.
    const renderTab = () => {
        switch (activeTab) {
            case 'logEntry':
                return <LogEntry />;
            case 'logHistory':
                return <LogHistory />;
            case 'dailySummary':
                return <DailySummary />;
            case 'manageData':
                return <ManageData />;
            // NEW: Add a case to render the PalayDelivery component.
            case 'palayDelivery':
                return <PalayDelivery />;
            default:
                return <LogEntry />;
        }
    };

    // Renders a loading screen if the app data is still being fetched.
    if (loading) return <LoadingScreen>Loading app data...</LoadingScreen>;
    // Renders an error screen if there was an issue loading the data.
    if (error) return <ErrorScreen>Error loading data: {error.message}</ErrorScreen>;

    return (
        <Container>
            <Header>
                GSR Log App
            </Header>
            <TabNavigation>
                {/* The animated underline whose style is controlled by the useEffect hook */}
                <ActiveTabUnderline style={underlineStyle} />
                {/* Tab buttons for navigation. Each one has a ref and sets the activeTab state. */}
                <TabButton ref={tabRefs.logEntry} $active={activeTab === 'logEntry'} onClick={() => setActiveTab('logEntry')}>Log Entry</TabButton>
                {/* NEW: Add the Palay Delivery tab button. */}
                <TabButton ref={tabRefs.palayDelivery} $active={activeTab === 'palayDelivery'} onClick={() => setActiveTab('palayDelivery')}>Palay Delivery</TabButton>
                <TabButton ref={tabRefs.logHistory} $active={activeTab === 'logHistory'} onClick={() => setActiveTab('logHistory')}>History</TabButton>
                <TabButton ref={tabRefs.dailySummary} $active={activeTab === 'dailySummary'} onClick={() => setActiveTab('dailySummary')}>Summary</TabButton>
                <TabButton ref={tabRefs.manageData} $active={activeTab === 'manageData'} onClick={() => setActiveTab('manageData')}>Manage</TabButton>
            </TabNavigation>
            <ContentArea>
                {/* This wrapper provides a transition animation when the content changes */}
                <AnimatedTabContent key={activeTab}>
                    {renderTab()}
                </AnimatedTabContent>
            </ContentArea>
        </Container>
    );
}

// --- Styled Components ---

const Container = styled.div`
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: #f7f9fc;
    font-size: 18px; /* <-- This is the key change */
`;

const Header = styled.header`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background-color: #fff;
    text-align: center;
    font-size: 1.5em;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    color: #333;
    
    @media print {
        display: none;
    }
`;

// NOTE: The 'ExportButton' component has been removed as it is no longer needed.

const TabNavigation = styled.nav`
    display: flex;
    justify-content: space-around;
    background-color: #eef1f5;
    border-bottom: 1px solid #ddd;
    position: relative;
    
    @media print {
        display: none;
    }
`;

const ActiveTabUnderline = styled.div`
    position: absolute;
    bottom: 0;
    height: 3px;
    background-color: #3498db;
    transition: left 0.3s ease, width 0.3s ease;
`;

const TabButton = styled.button`
    flex: 1;
    padding: 15px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 1em;
    font-weight: bold;
    color: #666;
    transition: color 0.3s ease;

    &:hover {
        color: #000;
    }
    
    ${({ $active }) => $active && `
        background-color: #fff;
        color: #2c3e50;
    `}
`;

const ContentArea = styled.main`
    flex: 1;
    padding: 20px;
    position: relative;
`;

const LoadingScreen = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-size: 1.2em;
    color: #555;
`;

const ErrorScreen = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-size: 1.2em;
    color: #e74c3c;
    font-weight: bold;
`;

const AnimatedTabContent = styled.div`
    animation: slideIn 0.5s forwards ease-in-out;

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;

// This wrapper component provides the global data context to the entire App component tree.
const AppWrapper = () => (
    <AppDataContextProvider>
      <App />
    </AppDataContextProvider>
);

export default AppWrapper;