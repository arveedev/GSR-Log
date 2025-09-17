// This file imports necessary hooks from React and external libraries.
import React, { useState, useMemo } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
// useAppData provides access to the application's global state.
import { useAppData } from '../../hooks/useAppData';
// usePDF is a custom hook from the 'react-to-pdf' library for exporting content as a PDF.
import { usePDF } from 'react-to-pdf';

// This GlobalStyle component injects CSS rules specifically for printing.
const PrintStyles = createGlobalStyle`
    @page {
        size: A4 portrait;
        margin: 0;
    }
    // This rule ensures colors and backgrounds are printed exactly as they appear on screen.
    body {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
    }
`;

// A color palette for consistent, repeatable styling based on data.
const colorPalette = {
    main: ['#34495e', '#3498db', '#2980b9', '#1abc9c', '#16a085'],
    subtle: ['#ecf0f1', '#eaf6fa', '#e3edf3', '#e4f6f4', '#e2f4f2'],
    variety: ['#f6c589', '#f2b57b', '#f9d99c', '#ffe18e', '#fbd18b']
};

// This function generates a consistent color based on a given string (e.g., province name).
// It uses a simple hash function to map a string to a specific color in the palette.
const getConsistentColor = (str) => {
    const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = hash % colorPalette.main.length;
    return {
        main: colorPalette.main[index],
        subtle: colorPalette.subtle[index],
        variety: colorPalette.variety[index]
    };
};

// Formats a date or a date range into a readable string.
const formatDateRange = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const startMonth = startDate.toLocaleString('default', { month: 'long' });
    const endMonth = endDate.toLocaleString('default', { month: 'long' });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();

    if (start === end) {
        // If start and end dates are the same, show a single date.
        return `${startMonth} ${startDay}, ${startYear}`;
    } else if (startYear === endYear && startMonth === endMonth) {
        // If dates are in the same month and year.
        return `${startMonth} ${startDay}-${endDay}, ${startYear}`;
    } else if (startYear === endYear) {
        // If dates are in the same year but different months.
        return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${endYear}`;
    } else {
        // If dates span multiple years.
        return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
    }
};

const DailySummary = () => {
    // Access global application data.
    const { data } = useAppData();
    // State for the start and end dates, defaulting to today's date.
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    // usePDF hook to enable PDF export. `toPDF` is the function to trigger export,
    // and `targetRef` is a ref to the component we want to convert.
    const { toPDF, targetRef } = usePDF({ filename: `GSR-Summary-${startDate}_to_${endDate}.pdf` });

    // useMemo caches the summary data to prevent expensive recalculations on every render.
    // It only re-runs when the log entries, start date, or end date change.
    const summaryData = useMemo(() => {
        const groupedData = {};

        // First, filter the entries to include only those within the selected date range.
        const filteredEntries = data.logEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1); // Make the end date inclusive
            return entryDate >= start && entryDate < end;
        });

        // Next, group the filtered entries into a nested object structure.
        filteredEntries.forEach(entry => {
            const { province, warehouse, transaction_type, variety, bags, netkgs, per50 } = entry;
            
            // We use a nested object structure to group data.
            if (!groupedData[province]) {
                groupedData[province] = {};
            }
            if (!groupedData[province][warehouse]) {
                groupedData[province][warehouse] = {};
            }
            if (!groupedData[province][warehouse][transaction_type]) {
                groupedData[province][warehouse][transaction_type] = {};
            }
            if (!groupedData[province][warehouse][transaction_type][variety]) {
                groupedData[province][warehouse][transaction_type][variety] = {
                    totals: { bags: 0, netkgs: 0, per50: 0 }
                };
            }
            
            // Add to totals, converting string values to floats.
            groupedData[province][warehouse][transaction_type][variety].totals.bags += parseFloat(bags);
            groupedData[province][warehouse][transaction_type][variety].totals.netkgs += parseFloat(netkgs);
            groupedData[province][warehouse][transaction_type][variety].totals.per50 += parseFloat(per50);
        });
        
        return groupedData;
    }, [data.logEntries, startDate, endDate]);
    
    // Standard window.print() function to open the browser's print dialog.
    const handlePrint = () => {
        window.print();
    };

    // Triggers the PDF export using the usePDF hook.
    const handleExportPDF = () => {
        toPDF();
    };
    
    // Checks if there are any entries to display.
    const hasEntries = Object.keys(summaryData).length > 0;

    // The component's rendered output.
    return (
        <SummaryContainer>
            {/* Inject the print-specific global styles. */}
            <PrintStyles />
            <SummaryHeader>Daily Summary</SummaryHeader>
            
            {/* Date selection interface. */}
            <DateSelection>
                <label htmlFor="start-date">Start Date:</label>
                <input 
                    type="date" 
                    id="start-date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                />
                <label htmlFor="end-date">End Date:</label>
                <input 
                    type="date" 
                    id="end-date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                />
            </DateSelection>

            {/* This is the content that will be converted to a PDF or printed. */}
            <SummaryContent ref={targetRef}>
                <ReportTitle>
                    <h2>GSR Daily Report</h2>
                    <h3>{formatDateRange(startDate, endDate)}</h3>
                </ReportTitle>
                {/* Conditionally render the summary data or a "no entries" message. */}
                {hasEntries ? (
                    // Nested mapping to iterate through the grouped data structure.
                    Object.keys(summaryData).map(province => {
                        const provinceColors = getConsistentColor(province);
                        return (
                            <Section key={province}>
                                <SectionTitle $backgroundColor={provinceColors.subtle}>
                                    <SectionBorder $color={provinceColors.main} />
                                    <h3>Province: {province}</h3>
                                </SectionTitle>
                                {Object.keys(summaryData[province]).map(warehouse => {
                                    const warehouseColors = getConsistentColor(warehouse);
                                    return (
                                        <Section key={warehouse} $indent>
                                            <SectionTitle $backgroundColor={warehouseColors.subtle}>
                                                <SectionBorder $color={warehouseColors.main} />
                                                <h4>Warehouse: {warehouse}</h4>
                                            </SectionTitle>
                                            {Object.keys(summaryData[province][warehouse]).map(transaction => {
                                                const transactionColors = getConsistentColor(transaction);
                                                return (
                                                    <Section key={transaction} $indent>
                                                        <SectionTitle $backgroundColor={transactionColors.subtle}>
                                                            <SectionBorder $color={transactionColors.main} />
                                                            <h5>Transaction: {transaction}</h5>
                                                        </SectionTitle>
                                                        {Object.keys(summaryData[province][warehouse][transaction]).map(variety => {
                                                            const varietyColors = getConsistentColor(variety);
                                                            const varietyData = summaryData[province][warehouse][transaction][variety];
                                                            return (
                                                                <Section key={variety} $indent>
                                                                    <VarietyHeader $backgroundColor={varietyColors.subtle}>
                                                                        <SectionBorder $color={varietyColors.main} />
                                                                        <h6>Variety: {variety}</h6>
                                                                        <VarietyTotals>
                                                                            <span>Bags: <strong>{varietyData.totals.bags.toFixed(3)}</strong></span>
                                                                            <span>Net Kgs: <strong>{varietyData.totals.netkgs.toFixed(3)}</strong></span>
                                                                            <span>Per 50: <strong>{varietyData.totals.per50.toFixed(3)}</strong></span>
                                                                        </VarietyTotals>
                                                                    </VarietyHeader>
                                                                </Section>
                                                            );
                                                        })}
                                                    </Section>
                                                );
                                            })}
                                        </Section>
                                    );
                                })}
                            </Section>
                        );
                    })
                ) : (
                    <p>No entries found for the selected date range.</p>
                )}
            </SummaryContent>

            {/* Button container for print and PDF actions. Hidden when printing. */}
            <ButtonContainer>
                {hasEntries && (
                    <>
                        <PrintButton onClick={handlePrint}>Print</PrintButton>
                        <PDFButton onClick={handleExportPDF}>Export PDF</PDFButton>
                    </>
                )}
            </ButtonContainer>
        </SummaryContainer>
    );
};

export default DailySummary;

// --- Styled Components ---

const SummaryContainer = styled.div`
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    overflow: hidden;

    // Print-specific styles
    @media print {
        padding: 20mm;
        margin: 0;
        box-shadow: none;
        border: none;
        width: 210mm;
        height: 297mm;
    }
`;

const SummaryHeader = styled.h2`
    text-align: center;
    color: #2c3e50;
    margin-bottom: 20px;

    @media print {
        display: none;
    }
`;

const DateSelection = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    
    label {
        font-weight: bold;
        color: #555;
    }
    
    input {
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        
        // Added animation for focus state.
        transition: all 0.2s ease-in-out;
        &:focus {
            outline: none;
            border-color: #3498db;
            box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.5);
        }
    }

    @media print {
        display: none;
    }
`;

const SummaryContent = styled.div`
    border: 1px solid #eee;
    padding: 20px;
    border-radius: 8px;
    min-height: 200px;
    margin-bottom: 20px;

    @media print {
        border: none;
        padding: 0;
    }
`;

const ReportTitle = styled.div`
    text-align: center;
    margin-bottom: 20px;
    
    h2, h3 {
        margin: 0;
    }
`;

const Section = styled.div`
    margin-bottom: 15px;
    
    ${({ $indent }) => $indent && `
        margin-left: 20px;
    `}
`;

const SectionTitle = styled.div`
    display: flex;
    align-items: center;
    background-color: ${({ $backgroundColor }) => $backgroundColor};
    padding: 10px 15px;
    margin-bottom: 10px;
    border-radius: 5px;
    
    h3, h4, h5 {
        margin: 0;
    }
`;

const SectionBorder = styled.div`
    width: 4px;
    height: 100%;
    background-color: ${({ $color }) => $color};
    margin-right: 15px;
`;

const VarietyHeader = styled(SectionTitle)`
    background-color: ${({ $backgroundColor }) => $backgroundColor};
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    
    h6 {
        flex-grow: 1;
        font-size: 1em;
        font-weight: bold;
    }
`;

const VarietyTotals = styled.div`
    display: flex;
    gap: 20px;
    font-size: 0.9em;
    font-weight: bold;
    
    span {
        white-space: nowrap;
    }
`;

const ButtonContainer = styled.div`
    display: flex;
    gap: 10px;

    @media print {
        display: none;
    }
`;

const PrintButton = styled.button`
    flex: 1;
    padding: 12px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1em;
    font-weight: bold;
    
    // Added animations for a responsive feel.
    transition: all 0.2s ease-in-out;
    &:hover {
        background-color: #2980b9;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    &:active {
        transform: translateY(1px);
    }
`;

const PDFButton = styled.button`
    flex: 1;
    padding: 12px;
    background-color: #2ecc71;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1em;
    font-weight: bold;
    
    // Added animations for a responsive feel.
    transition: all 0.2s ease-in-out;
    &:hover {
        background-color: #27ae60;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    &:active {
        transform: translateY(1px);
    }
`;