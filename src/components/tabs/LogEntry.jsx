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
    
    // Filter and find the unlogged entries.
    // This line is now commented out as we are disabling the unlogged entries feature temporarily.
    // const unloggedDeliveries = data.logEntries.filter(entry => entry.isLogged === 'false');

    // State to hold the unlogged entry data when a user clicks on it for logging.
    const [selectedUnloggedEntry, setSelectedUnloggedEntry] = useState(null);

    // Sort the data alphabetically once for dropdowns
    const sortedProvinces = [...data.provinces].sort((a, b) => a.name.localeCompare(b.name));
    const sortedTransactionTypes = [...data.transactionTypes].sort((a, b) => a.name.localeCompare(b.name));
    const sortedVarieties = [...data.varieties].sort((a, b) => a.name.localeCompare(b.name));
    const sortedRicemills = [...data.ricemills].sort((a, b) => a.name.localeCompare(b.name));

    // --- State Management ---
    // These dropdowns use the custom usePersistentState hook.
    const [province, setProvince] = usePersistentState('lastProvince', '');
    const [warehouse, setWarehouse] = usePersistentState('lastWarehouse', '');
    const [variety, setVariety] = usePersistentState('lastVariety', '');
    const [transactionType, setTransactionType] = usePersistentState('lastTransactionType', '');
    const [ricemill, setRicemill] = useState('');
    const [aiNumber, setAiNumber] = useState('');

    // These fields use standard React useState.
    const [date, setDate] = useState(today);
    const [bags, setBags] = useState('');
    const [netKgs, setNetKgs] = useState('');
    const [per50, setPer50] = useState('');
    const [remarks, setRemarks] = useState('');
    // State variables for additional fields from the Palay Delivery form
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
    const [riceRecovery, setRiceRecovery] = useState('');
    
    // State for controlling the success message's visibility.
    const [isSuccess, setIsSuccess] = useState(false);

    // --- Helper Functions & Effects ---

    // This useEffect hook runs whenever the 'netKgs' state changes.
    // It automatically calculates the 'per50' value.
    useEffect(() => {
        const calculatedPer50 = netKgs ? (parseFloat(netKgs) / 50).toFixed(3) : '';
        setPer50(calculatedPer50);
    }, [netKgs]);

    // Filter and sort the warehouses correctly based on the 'province' property.
    const filteredWarehouses = data.warehouses
        .filter((w) => w.province === province)
        .sort((a, b) => a.name.localeCompare(b.name));

    // This useEffect ensures the 'warehouse' state is reset if the selected 'province' changes.
    useEffect(() => {
        if (warehouse && !filteredWarehouses.some(w => w.name === warehouse)) {
            setWarehouse('');
        }
    }, [province, warehouse, filteredWarehouses, setWarehouse]);

    // This useEffect hook runs when transactionType or variety changes.
    useEffect(() => {
        if (transactionType === 'MILLING' && variety === 'WD1') {
            setRicemill('');
            setAiNumber('');
        }
    }, [transactionType, variety]);

    // This function populates the form with the selected unlogged entry's data.
    const handleSelectEntryForLogging = (entry) => {
        setSelectedUnloggedEntry(entry);
        setDate(entry.date);
        setProvince(entry.province || '');
        setWarehouse(entry.warehouse || '');
        setTransactionType(entry.transactionType || '');
        setVariety(entry.variety || '');
        setBags(entry.bags || '');
        setNetKgs(entry.netKgs || '');
        setPer50(entry.per50 || '');
        setRemarks(entry.remarks || '');
        setPrNumber(entry.prNumber || '');
        setWsrNumber(entry.wsrNumber || '');
        setName(entry.name || '');
        setBarangay(entry.barangay || '');
        setMunicipality(entry.municipality || '');
        setEntryType(entry.entryType || '');
        setMoistureContent(entry.moistureContent || '');
        setGrossKgs(entry.grossKgs || '');
        setMtsType(entry.mtsType || '');
        setSackWeight(entry.sackWeight || '');
        setEnwf(entry.enwf || '');
        setEnwKgs(entry.enwKgs || '');
        setBasicCost(entry.basicCost || '');
        setPricerCost(entry.pricerCost || '');
        setGrandTotal(entry.grandTotal || '');
        setSdoName(entry.sdoName || '');
        setRicemill(entry.ricemill || '');
        setAiNumber(entry.aiNumber || '');
        setRiceRecovery(entry.riceRecovery || '');
    };
    
    // Function to clear the form and reset the selection.
    const clearFormAndSelection = () => {
        setSelectedUnloggedEntry(null);
        setDate(today);
        setBags('');
        setNetKgs('');
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
        setRiceRecovery('');
    };

    // The main function to handle form submission.
    const handleAdd = (e) => {
        e.preventDefault();
        if (!province || !warehouse || !bags || !netKgs || !variety || !transactionType) {
            alert('Please fill out all required fields.');
            return;
        }
        
        if (transactionType === 'MILLING' && variety !== 'WD1') {
            if (!ricemill || !aiNumber) {
                alert('Please provide a Ricemill name and AI Number for Milling transactions.');
                return;
            }
            const isDuplicate = data.logEntries.some(entry => entry.aiNumber === aiNumber);
            if (isDuplicate) {
                alert('This AI Number already exists. Please enter a unique number.');
                return;
            }
        }

        if (selectedUnloggedEntry) {
            const entryIndex = data.logEntries.findIndex(
                // Use camelCase keys for comparison
                entry => entry.prNumber === selectedUnloggedEntry.prNumber && entry.date === selectedUnloggedEntry.date
            );
            
            if (entryIndex !== -1) {
                const updatedEntry = { 
                    ...data.logEntries[entryIndex],
                    isLogged: 'true',
                    ricemill: (transactionType === 'MILLING' && variety === 'WD1') ? null : ricemill,
                    aiNumber: (transactionType === 'MILLING' && variety === 'WD1') ? null : aiNumber,
                    transactionType: transactionType,
                };
                const updatedLogEntries = [...data.logEntries];
                updatedLogEntries[entryIndex] = updatedEntry;
                updateAppData({ logEntries: updatedLogEntries });
            }
        } else {
            const newEntry = {
                id: uuidv4(),
                date,
                province,
                warehouse,
                bags,
                netKgs,
                per50,
                variety,
                transactionType,
                remarks,
                prNumber,
                wsrNumber,
                name,
                barangay,
                municipality,
                entryType,
                moistureContent,
                grossKgs,
                mtsType,
                sackWeight,
                enwf,
                enwKgs,
                basicCost,
                pricerCost,
                grandTotal,
                sdoName,
                riceRecovery,
                ricemill: (transactionType === 'MILLING' && variety === 'WD1') ? null : ricemill,
                aiNumber: (transactionType === 'MILLING' && variety === 'WD1') ? null : aiNumber,
                isLogged: 'true'
            };
            
            const updatedLogEntries = [...data.logEntries, newEntry];
            updateAppData({ logEntries: updatedLogEntries });
        }

        setIsSuccess(true);
        setTimeout(() => {
            setIsSuccess(false);
        }, 3000);

        clearFormAndSelection();
    };

    // --- UI Components (JSX) ---
    return (
        <FormContainer>
            <FormHeader>Add New Entry</FormHeader>

            {/* The unlogged deliveries section is removed as per your request. */}
            
            {isSuccess && <SuccessMessage>Entry added successfully!</SuccessMessage>}
            
            {selectedUnloggedEntry && (
                <ClearButton onClick={clearFormAndSelection}>Clear Selection</ClearButton>
            )}

            <Form onSubmit={handleAdd}>
                <FormRow>
                    <label htmlFor="date">Date:</label>
                    <DatePicker type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </FormRow>

                <FormRow>
                    <label htmlFor="province">Province:</label>
                    <Select value={province} onChange={(e) => setProvince(e.target.value)} required>
                        <option value="">Select Province</option>
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
                        disabled={!province}
                        required
                    >
                        <option value="">Select Warehouse</option>
                        {filteredWarehouses.map((w, index) => (
                            <option key={index} value={w.name}>{w.name}</option>
                        ))}
                    </Select>
                </FormRow>

                <FormRow>
                    <label htmlFor="transactionType">Transaction Type:</label>
                    <Select value={transactionType} onChange={(e) => setTransactionType(e.target.value)} required>
                        <option value="">Select Type</option>
                        {sortedTransactionTypes.map((t, index) => (
                            <option key={index} value={t.name}>{t.name}</option>
                        ))}
                    </Select>
                </FormRow>

                {transactionType === 'MILLING' && (
                    <>
                        <FormRow>
                            <label htmlFor="ricemill">Ricemill Name:</label>
                            <Select 
                                value={ricemill} 
                                onChange={(e) => setRicemill(e.target.value)}
                                disabled={variety === 'WD1'}
                                required={variety !== 'WD1'}
                            >
                                <option value="">Select Ricemill</option>
                                {sortedRicemills.map((r, index) => (
                                    <option key={index} value={r.name}>{r.name}</option>
                                ))}
                            </Select>
                        </FormRow>
                        <FormRow>
                            <label htmlFor="aiNumber">AI Number:</label>
                            <Input 
                                type="text" 
                                value={aiNumber} 
                                onChange={(e) => setAiNumber(e.target.value)}
                                disabled={variety === 'WD1'}
                                required={variety !== 'WD1'}
                            />
                        </FormRow>
                    </>
                )}

                <FormRow>
                    <label htmlFor="variety">Variety:</label>
                    <Select value={variety} onChange={(e) => setVariety(e.target.value)} required>
                        <option value="">Select Variety</option>
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
                    <label htmlFor="netKgs">Net Kgs:</label>
                    <Input type="number" step="0.001" value={netKgs} onChange={(e) => setNetKgs(e.target.value)} required />
                </FormRow>

                <FormRow>
                    <label htmlFor="per50">Per 50:</label>
                    <Input type="text" value={per50} readOnly disabled />
                </FormRow>

                <FormRow $fullWidth>
                    <label htmlFor="remarks">Remarks:</label>
                    <TextArea value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                </FormRow>

                {/* The unlogged entry display fields are removed as we are no longer using this flow. */}
                {/* {selectedUnloggedEntry && (
                    <>
                        <FormRow>
                            <label htmlFor="prNumber">PR Number:</label>
                            <Input type="text" value={prNumber} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="wsrNumber">WSR Number:</label>
                            <Input type="text" value={wsrNumber} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="name">Name:</label>
                            <Input type="text" value={name} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="entryType">Entry Type:</label>
                            <Input type="text" value={entryType} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="moistureContent">Moisture Content:</label>
                            <Input type="text" value={moistureContent} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="grossKgs">Gross Kgs:</label>
                            <Input type="text" value={grossKgs} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="mtsType">MTS Type:</label>
                            <Input type="text" value={mtsType} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="sackWeight">Sack Weight:</label>
                            <Input type="text" value={sackWeight} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="enwf">ENWF:</label>
                            <Input type="text" value={enwf} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="enwKgs">ENW Kgs:</label>
                            <Input type="text" value={enwKgs} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="basicCost">Basic Cost:</label>
                            <Input type="text" value={basicCost} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="pricerCost">Pricer Cost:</label>
                            <Input type="text" value={pricerCost} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="grandTotal">Grand Total:</label>
                            <Input type="text" value={grandTotal} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="sdoName">SDO:</label>
                            <Input type="text" value={sdoName} readOnly />
                        </FormRow>
                        <FormRow>
                            <label htmlFor="riceRecovery">Rice Recovery:</label>
                            <Input type="text" value={riceRecovery} readOnly />
                        </FormRow>
                    </>
                )} */}

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
// These are now commented out to disable the feature.
// const UnloggedSection = styled.div`
//     background-color: #ecf0f1;
//     border-radius: 8px;
//     padding: 1.5rem;
//     margin-bottom: 2rem;
// `;

// const SectionTitle = styled.h3`
//     color: #34495e;
//     border-bottom: 2px solid #bdc3c7;
//     padding-bottom: 0.5rem;
//     margin-bottom: 1rem;
//     font-size: 1.4rem;
//     text-align: center;
// `;

// const UnloggedTable = styled.table`
//     width: 100%;
//     border-collapse: collapse;
//     background-color: #fff;
//     border: 1px solid #ddd;
//     border-radius: 8px;
//     overflow: hidden;

//     th, td {
//         padding: 12px;
//         text-align: left;
//         border-bottom: 1px solid #ddd;
//     }

//     th {
//         background-color: #f2f2f2;
//         font-weight: bold;
//         color: #555;
//     }

//     tr:hover {
//         background-color: #f9f9f9;
//     }
// `;

// const LogButton = styled.button`
//     padding: 0.5rem 1rem;
//     background-color: #3498db;
//     color: white;
//     border: none;
//     border-radius: 4px;
//     cursor: pointer;
//     transition: background-color 0.3s ease;
    
//     &:hover {
//         background-color: #2980b9;
//     }
// `;

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