// This file imports necessary hooks from React and external libraries.
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
// Import v4 from the uuid library to generate unique IDs
import { v4 as uuidv4 } from 'uuid';
// useAppData provides access to the application's global state and functions.
import { useAppData } from '../../hooks/useAppData';
// usePersistentState is a custom hook to store values in localStorage, making them persist after page reloads.
import { usePersistentState } from '../../hooks/usePersistentState';

// A helper variable to get today's date in 'YYYY-MM-DD' format.
const today = new Date().toISOString().split('T')[0];

const LogEntry = () => {
    // We now need access to the entire data object and the updateAppData function.
    const { data, updateAppData } = useAppData();
    
    // Filter and find the unlogged entries. We are looking for entries created
    // by the Palay Delivery form, which have isLogged = 'false'.
    const unloggedDeliveries = data.logEntries.filter(entry => entry.isLogged === 'false');

    // State to hold the unlogged entry data when a user clicks on it for logging.
    const [selectedUnloggedEntry, setSelectedUnloggedEntry] = useState(null);

    // Sort the data alphabetically once for dropdowns
    const sortedProvinces = [...data.provinces].sort((a, b) => a.name.localeCompare(b.name));
    const sortedTransactionTypes = [...data.transactionTypes].sort((a, b) => a.name.localeCompare(b.name));
    const sortedVarieties = [...data.varieties].sort((a, b) => a.name.localeCompare(b.name));
    const sortedRicemills = [...data.ricemills].sort((a, b) => a.name.localeCompare(b.name));

    // --- State Management ---
    // These dropdowns use the custom usePersistentState hook.
    // This means their last selected value will be remembered by the browser.
    const [province, setProvince] = usePersistentState('lastProvince', '');
    const [warehouse, setWarehouse] = usePersistentState('lastWarehouse', '');
    const [variety, setVariety] = usePersistentState('lastVariety', '');
    const [transactionType, setTransactionType] = usePersistentState('lastTransactionType', '');
    const [ricemill, setRicemill] = useState('');
    const [aiNumber, setAiNumber] = useState('');

    // These fields use standard React useState, so their values reset when the form is submitted.
    const [date, setDate] = useState(today);
    const [bags, setBags] = useState('');
    const [netkgs, setNetkgs] = useState('');
    const [per50, setPer50] = useState('');
    const [remarks, setRemarks] = useState('');
    // New state variables for additional fields from the Palay Delivery form
    const [prNumber, setPrNumber] = useState('');
    const [wsrNumber, setWsrNumber] = useState('');
    const [name, setName] = useState('');
    const [barangay, setBarangay] = useState('');
    const [municipality, setMunicipality] = useState('');
    const [entryType, setEntryType] = useState('');
    const [moistureContent, setMoistureContent] = useState('');
    const [grossKgs, setGrossKgs] = useState('');
    const [mtsType, setMtsType] = useState('');
    const [sackWeight, setSackWeight] = useState('');
    const [enwf, setEnwf] = useState('');
    const [enwKgs, setEnwKgs] = useState('');
    const [basicCost, setBasicCost] = useState('');
    const [pricerCost, setPricerCost] = useState('');
    const [grandTotal, setGrandTotal] = useState('');
    const [sdoName, setSdoName] = useState('');

    // State for controlling the success message's visibility.
    const [isSuccess, setIsSuccess] = useState(false);

    // --- Helper Functions & Effects ---

    // This useEffect hook runs whenever the 'netkgs' state changes.
    // It automatically calculates the 'per50' value.
    useEffect(() => {
        // Check if netkgs has a value, then perform the calculation.
        const calculatedPer50 = netkgs ? (parseFloat(netkgs) / 50).toFixed(3) : '';
        // Update the 'per50' state with the calculated value.
        setPer50(calculatedPer50);
    }, [netkgs]); // The dependency array ensures this effect only runs when netkgs changes.

    // Now, we filter and sort the warehouses correctly based on the 'province' property.
    const filteredWarehouses = data.warehouses
        .filter((w) => w.province === province)
        .sort((a, b) => a.name.localeCompare(b.name));

    // This useEffect ensures the 'warehouse' state is reset if the selected 'province' changes
    // to prevent an invalid combination (e.g., selecting a warehouse from a different province).
    useEffect(() => {
        // If a warehouse is currently selected AND it's not in the new filtered list of warehouses...
        if (warehouse && !filteredWarehouses.some(w => w.name === warehouse)) {
            // ...then reset the warehouse state to an empty string.
            setWarehouse('');
        }
    }, [province, warehouse, filteredWarehouses, setWarehouse]); // Dependencies ensure this runs when relevant state changes.

    // New: This function populates the form with the selected unlogged entry's data.
    const handleSelectEntryForLogging = (entry) => {
        setSelectedUnloggedEntry(entry);
        setDate(entry.date);
        setProvince(entry.province || '');
        setWarehouse(entry.warehouse || '');
        setTransactionType(entry.transaction_type || '');
        setVariety(entry.variety || '');
        setBags(entry.bags || '');
        setNetkgs(entry.netkgs || '');
        // ✅ FIX: Populate the per50 field from the selected entry.
        setPer50(entry.per50 || ''); 
        setRemarks(entry.remarks || '');
        
        // Populate all the new fields from the Palay Delivery form.
        setPrNumber(entry.pr_number || '');
        setWsrNumber(entry.wsr_number || '');
        setName(entry.name || '');
        setBarangay(entry.barangay || '');
        setMunicipality(entry.municipality || '');
        setEntryType(entry.entry_type || '');
        setMoistureContent(entry.moisture_content || '');
        setGrossKgs(entry.gross_kgs || '');
        setMtsType(entry.mts_type || '');
        setSackWeight(entry.sack_weight || '');
        setEnwf(entry.enwf || '');
        setEnwKgs(entry.enw_kgs || '');
        setBasicCost(entry.basic_cost || '');
        setPricerCost(entry.pricer_cost || '');
        setGrandTotal(entry.grand_total || '');
        setSdoName(entry.sdo_name || '');
        setRicemill(entry.ricemill || '');
        setAiNumber(entry.ai_number || '');
    };
    
    // New: Function to clear the form and reset the selection.
    const clearFormAndSelection = () => {
        setSelectedUnloggedEntry(null);
        setDate(today);
        setBags('');
        setNetkgs('');
        setPer50('');
        setRemarks('');
        setPrNumber('');
        setWsrNumber('');
        setName('');
        setBarangay('');
        setMunicipality('');
        setEntryType('');
        setMoistureContent('');
        setGrossKgs('');
        setMtsType('');
        setSackWeight('');
        setEnwf('');
        setEnwKgs('');
        setBasicCost('');
        setPricerCost('');
        setGrandTotal('');
        setSdoName('');
        setRicemill('');
        setAiNumber('');
    };

    // The main function to handle form submission.
    const handleAdd = (e) => {
        // Prevents the default browser form submission, which would cause a page reload.
        e.preventDefault();
        // A quick check to ensure all required fields are filled before submitting.
        if (!province || !warehouse || !bags || !netkgs || !variety || !transactionType) {
            alert('Please fill out all required fields.');
            return; // Stop the function if fields are missing.
        }
        
        // ✅ NEW: Add validation for the AI Number if the transaction is 'Milling'
        if (transactionType === 'MILLING') {
            if (!ricemill || !aiNumber) {
                alert('Please provide a Ricemill name and AI Number for Milling transactions.');
                return;
            }
            // Check for AI Number duplication
            const isDuplicate = data.logEntries.some(entry => entry.ai_number === aiNumber);
            if (isDuplicate) {
                alert('This AI Number already exists. Please enter a unique number.');
                return;
            }
        }

        // This is the new logic for handling both regular entries and logging unlogged entries.
        if (selectedUnloggedEntry) {
            // Find the index of the entry to be logged.
            const entryIndex = data.logEntries.findIndex(
                entry => entry.pr_number === selectedUnloggedEntry.pr_number && entry.date === selectedUnloggedEntry.date
            );
            
            if (entryIndex !== -1) {
                // Create a new object to update the existing entry's isLogged status.
                const updatedEntry = { 
                    ...data.logEntries[entryIndex],
                    isLogged: 'true',
                    ricemill: ricemill,
                    ai_number: aiNumber,
                };
                // Create a new array with the updated entry.
                const updatedLogEntries = [...data.logEntries];
                updatedLogEntries[entryIndex] = updatedEntry;
                // Save the new array to the global state.
                updateAppData({ logEntries: updatedLogEntries });
            }
        } else {
            // This is the original logic for adding a new regular entry.
            const newEntry = {
                // ✅ FIX: Assign a new UUID to the 'id' field
                id: uuidv4(),
                date,
                province,
                warehouse,
                bags,
                netkgs,
                per50,
                variety,
                transaction_type: transactionType,
                remarks,
                ricemill: ricemill,
                ai_number: aiNumber,
            };
            
            // Add the new entry to the application's data.
            const updatedLogEntries = [...data.logEntries, newEntry];
            updateAppData({ logEntries: updatedLogEntries });
        }

        // Show a success message to the user.
        setIsSuccess(true);
        // Use setTimeout to automatically hide the message after 3 seconds.
        setTimeout(() => {
            setIsSuccess(false);
        }, 3000);

        // Reset fields that are not meant to be persistent.
        clearFormAndSelection();
    };

    // --- UI Components (JSX) ---
    // This is the structure and content of the Log Entry tab.
    return (
        <FormContainer>
            <FormHeader>Add New Entry</FormHeader>
            {/* New: Display unlogged deliveries if there are any */}
            {unloggedDeliveries.length > 0 && (
                <UnloggedSection>
                    <SectionTitle>Unlogged Palay Deliveries</SectionTitle>
                    <UnloggedList>
                        {unloggedDeliveries.map((entry, index) => (
                            <UnloggedItem key={index} onClick={() => handleSelectEntryForLogging(entry)}>
                                <strong>Date:</strong> {entry.date} <br/>
                                <strong>PR No.:</strong> {entry.pr_number} <br/>
                                <strong>Name:</strong> {entry.name} <br/>
                                <LogButton>Log This Entry</LogButton>
                            </UnloggedItem>
                        ))}
                    </UnloggedList>
                </UnloggedSection>
            )}

            {/* Conditionally render the success message if isSuccess is true. */}
            {isSuccess && <SuccessMessage>Entry added successfully!</SuccessMessage>}
            
            {/* New: Conditional button to clear form selection */}
            {selectedUnloggedEntry && (
                <ClearButton onClick={clearFormAndSelection}>Clear Selection</ClearButton>
            )}

            <Form onSubmit={handleAdd}>
                {/* Each FormRow contains a label and an input field. */}
                <FormRow>
                    <label htmlFor="date">Date:</label>
                    <DatePicker type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </FormRow>

                <FormRow>
                    <label htmlFor="province">Province:</label>
                    <Select value={province} onChange={(e) => setProvince(e.target.value)} required>
                        <option value="">Select Province</option>
                        {/* Map through the now-sorted provinces. */}
                        {sortedProvinces.map((p, index) => (
                            <option key={index} value={p.name}>{p.name}</option>
                        ))}
                    </Select>
                </FormRow>

                <FormRow>
                    <label htmlFor="warehouse">Warehouse:</label>
                    <Select
                        value={warehouse}
                        onChange={(e) => setWarehouse(e.target.value)}
                        disabled={!province} // Disable this dropdown if no province is selected.
                        required
                    >
                        <option value="">Select Warehouse</option>
                        {/* Map through the now-sorted and filtered warehouses. */}
                        {filteredWarehouses.map((w, index) => (
                            <option key={index} value={w.name}>{w.name}</option>
                        ))}
                    </Select>
                </FormRow>

                <FormRow>
                    <label htmlFor="transaction_type">Transaction Type:</label>
                    <Select value={transactionType} onChange={(e) => setTransactionType(e.target.value)} required>
                        <option value="">Select Type</option>
                        {/* Map through the now-sorted transaction types. */}
                        {sortedTransactionTypes.map((t, index) => (
                            <option key={index} value={t.name}>{t.name}</option>
                        ))}
                    </Select>
                </FormRow>

                {/* ✅ NEW: Conditionally render Ricemill and AI Number fields based on transactionType */}
                {transactionType === 'MILLING' && (
                    <>
                        <FormRow>
                            <label htmlFor="ricemill">Ricemill Name:</label>
                            <Select value={ricemill} onChange={(e) => setRicemill(e.target.value)} required>
                                <option value="">Select Ricemill</option>
                                {/* Map through the now-sorted ricemills */}
                                {sortedRicemills.map((r, index) => (
                                    <option key={index} value={r.name}>{r.name}</option>
                                ))}
                            </Select>
                        </FormRow>
                        <FormRow>
                            <label htmlFor="ai_number">AI Number:</label>
                            <Input type="text" value={aiNumber} onChange={(e) => setAiNumber(e.target.value)} required />
                        </FormRow>
                    </>
                )}

                <FormRow>
                    <label htmlFor="variety">Variety:</label>
                    <Select value={variety} onChange={(e) => setVariety(e.target.value)} required>
                        <option value="">Select Variety</option>
                        {/* Map through the now-sorted varieties. */}
                        {sortedVarieties.map((v, index) => (
                            <option key={index} value={v.name}>{v.name}</option>
                        ))}
                    </Select>
                </FormRow>

                <FormRow>
                    <label htmlFor="bags">Bags:</label>
                    <Input type="number" step="0.001" value={bags} onChange={(e) => setBags(e.target.value)} required />
                </FormRow>

                <FormRow>
                    <label htmlFor="netkgs">Net Kgs:</label>
                    <Input type="number" step="0.001" value={netkgs} onChange={(e) => setNetkgs(e.target.value)} required />
                </FormRow>

                <FormRow>
                    <label htmlFor="per50">Per 50:</label>
                    {/* The per50 field is read-only and disabled because its value is automatically calculated. */}
                    <Input type="text" value={per50} readOnly disabled />
                </FormRow>

                {/* This row uses the $fullWidth prop to span the entire form width. */}
                <FormRow $fullWidth>
                    <label htmlFor="remarks">Remarks:</label>
                    <TextArea value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                </FormRow>

                {/* New: Display additional fields if a Palay Delivery entry is selected */}
                {selectedUnloggedEntry && (
                    <>
                        <FormRow>
                            <label htmlFor="pr_number">PR Number:</label>
                            <Input type="text" value={prNumber} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="wsr_number">WSR Number:</label>
                            <Input type="text" value={wsrNumber} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="name">Name:</label>
                            <Input type="text" value={name} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="entry_type">Entry Type:</label>
                            <Input type="text" value={entryType} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="moisture_content">Moisture Content:</label>
                            <Input type="text" value={moistureContent} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="gross_kgs">Gross Kgs:</label>
                            <Input type="text" value={grossKgs} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="mts_type">MTS Type:</label>
                            <Input type="text" value={mtsType} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="sack_weight">Sack Weight:</label>
                            <Input type="text" value={sackWeight} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="enwf">ENWF:</label>
                            <Input type="text" value={enwf} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="enw_kgs">ENW Kgs:</label>
                            <Input type="text" value={enwKgs} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="basic_cost">Basic Cost:</label>
                            <Input type="text" value={basicCost} readOnly />
                        </FormRow>
                        {/* ✅ FIX: Corrected the typo from FormFRow to FormRow. */}
                        <FormRow>
                            <label htmlFor="pricer_cost">Pricer Cost:</label>
                            <Input type="text" value={pricerCost} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="grand_total">Grand Total:</label>
                            <Input type="text" value={grandTotal} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="sdo_name">SDO:</label>
                            <Input type="text" value={sdoName} readOnly />
                        </FormRow>
                    </>
                )}

                <SubmitButton type="submit">Add Log Entry</SubmitButton>
            </Form>
        </FormContainer>
    );
};

export default LogEntry;

// --- Styled Components ---
// These components define the visual style of the form using CSS-in-JS.
// They are separated from the main component for cleaner code.
const FormContainer = styled.div`
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    position: relative;
`;

const FormHeader = styled.h2`
    text-align: center;
    color: #2c3e50;
    margin-bottom: 20px;
`;

const Form = styled.form`
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
`;

const FormRow = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1 1 calc(50% - 10px);
    
    @media (max-width: 600px) {
        flex: 1 1 100%;
    }

    ${({ $fullWidth }) => $fullWidth && `
        flex: 1 1 100%;
    `}
    
    label {
        font-weight: bold;
        color: #555;
        margin-bottom: 8px;
    }
`;

const Input = styled.input`
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1em;
    box-sizing: border-box;
    
    // Hover and focus animations for a modern feel.
    transition: all 0.2s ease-in-out;
    
    &:focus {
        outline: none;
        border-color: #3498db;
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.5);
    }

    &:disabled {
        background-color: #f0f0f0;
        cursor: not-allowed;
    }
`;

const Select = styled.select`
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1em;
    background-color: #fff;
    cursor: pointer;
    box-sizing: border-box;

    // Hover and focus animations for a modern feel.
    transition: all 0.2s ease-in-out;

    &:focus {
        outline: none;
        border-color: #3498db;
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.5);
    }

    &:disabled {
        background-color: #f0f0f0;
        cursor: not-allowed;
    }
`;

const DatePicker = styled(Input)`
    
`;

const TextArea = styled.textarea`
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1em;
    min-height: 80px;
    box-sizing: border-box;

    // Hover and focus animations for a modern feel.
    transition: all 0.2s ease-in-out;

    &:focus {
        outline: none;
        border-color: #3498db;
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.5);
    }
`;

const SubmitButton = styled.button`
    width: 100%;
    padding: 15px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1.2em;
    font-weight: bold;
    cursor: pointer;
    
    // Hover animations for a modern feel.
    transition: background-color 0.3s ease, transform 0.1s ease, box-shadow 0.2s ease;

    &:hover {
        background-color: #2980b9;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    &:active {
        transform: translateY(2px);
    }
`;

const SuccessMessage = styled.div`
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #2ecc71;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    opacity: 1;
    font-weight: bold;
    z-index: 100;
    
    // Fade-out animation for the success message.
    animation: fadeOut 0.5s ease-in 2.5s forwards;

    @keyframes fadeOut {
        to {
            opacity: 0;
            visibility: hidden;
        }
    }
`;

// --- New Styled Components for the Unlogged Deliveries Dashboard ---
const UnloggedSection = styled.div`
    background-color: #ecf0f1;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
    color: #34495e;
    border-bottom: 2px solid #bdc3c7;
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
    font-size: 1.4rem;
    text-align: center;
`;

const UnloggedList = styled.ul`
    list-style: none;
    padding: 0;
    margin: 0;
`;

const UnloggedItem = styled.li`
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 0.75rem;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    transition: all 0.2s ease-in-out;

    &:hover {
        border-color: #3498db;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
    }
`;

const LogButton = styled.button`
    margin-top: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    align-self: flex-start;

    &:hover {
        background-color: #2980b9;
    }
`;

const ClearButton = styled.button`
    background-color: #e74c3c;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 1em;
    cursor: pointer;
    transition: background-color 0.3s ease;
    margin-bottom: 1rem;

    &:hover {
        background-color: #c0392b;
    }
`;