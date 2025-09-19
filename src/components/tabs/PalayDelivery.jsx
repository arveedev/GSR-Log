// This component provides a dedicated form for entering new Palay deliveries.
// It includes specific input fields and performs all necessary calculations automatically.
// The created entry is saved with an 'isLogged' flag set to false, so it can be reviewed later.

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
// The useAppData hook gives us access to all the lookup data and the function to save changes.
import { useAppData } from '../../hooks/useAppData';

const PalayDelivery = () => {
    // Access the global application data, including all lookup tables.
    const { data, updateAppData } = useAppData();

    // State to hold all form data, with initial values.
    const [formData, setFormData] = useState({
        date: new Date().toISOString().slice(0, 10), // Default to today's date.
        pr_number: '',
        wsr_number: '',
        name: '',
        barangay: '',
        municipality: '',
        entry_type: 'Individual', // Default to 'Individual'
        warehouse: '',
        bags: 0,
        variety: '',
        moisture_content: 0,
        gross_kgs: 0,
        mts_type: '',
        sdo_name: '',
        remarks: '',
    });

    // State to store the calculated values.
    const [calculations, setCalculations] = useState({
        sack_weight: 0,
        net_kgs: 0,
        enwf: 0,
        enw_kgs: 0,
        basic_cost: 0,
        pricer_cost: 0,
        grand_total: 0,
    });
    
    // State to manage success message display.
    const [successMessage, setSuccessMessage] = useState('');

    // --- Core Logic for Calculations ---
    // This effect hook runs whenever a relevant form field changes.
    useEffect(() => {
        // Prevent calculations from running if data is not yet loaded.
        if (!data) return;

        const {
            bags,
            gross_kgs,
            moisture_content,
            mts_type,
            variety
        } = formData;

        // Find the selected MTS type object from the lookup data to get its weight.
        const selectedMtsType = data.mtsTypes.find(m => m.name === mts_type);
        const mtsWeight = selectedMtsType ? parseFloat(selectedMtsType.weight) : 0;

        // 1. Calculate Sack Weight
        const sackWeight = parseFloat(bags || 0) * mtsWeight;
        
        // 2. Calculate Net Kilos
        const netKgs = parseFloat(gross_kgs || 0) - sackWeight;

        // 3. Find ENWF (Effective Net Weight Factor) based on Moisture Content
        let calculatedEnwf = 0;
        const moisture = parseFloat(moisture_content);

        // Check the moisture content against the rules.
        if (!isNaN(moisture)) {
            // Rule: 13.0 to 14.0 has a multiplier of 1.0
            if (moisture >= 13.0 && moisture <= 14.0) {
                calculatedEnwf = 1.0;
            } else if (moisture > 14.0) {
                // Find the correct ENWF multiplier from the granular data.
                // We use parseFloat to ensure a numerical comparison.
                const enwfEntry = data.enwfRanges.find(entry => parseFloat(entry.moisture) === moisture);
                if (enwfEntry) {
                    calculatedEnwf = parseFloat(enwfEntry.enwf);
                }
            }
        }
        
        // 4. Calculate Effective Net Weight (ENW)
        const enwKgs = netKgs > 0 ? netKgs * calculatedEnwf : 0;

        // 5. Calculate Basic Cost and Pricer Cost using values from the 'pricing' lookup table.
        const basicCostPrice = data.pricing?.basic_cost || 0;
        const pricerPrice = data.pricing?.pricer || 0;
        const basicCost = enwKgs * basicCostPrice;
        const pricerCost = enwKgs * pricerPrice;

        // 6. Calculate Grand Total
        const grandTotal = basicCost + pricerCost;

        // Update the calculations state.
        setCalculations({
            sack_weight: sackWeight,
            net_kgs: netKgs,
            enwf: calculatedEnwf,
            enw_kgs: enwKgs,
            basic_cost: basicCost,
            pricer_cost: pricerCost,
            grand_total: grandTotal,
        });

    }, [formData, data]); // Added 'data' to the dependency array.

    // --- Event Handlers ---
    // Universal handler for updating form data state.
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'number' ? parseFloat(value) || '' : value,
        }));
    };

    // Handler for form submission.
    const handleSubmit = (e) => {
        e.preventDefault();
        
        // A simple validation check.
        if (!formData.date || !formData.pr_number || !formData.warehouse || !formData.variety) {
            alert('Please fill out all required fields.');
            return;
        }

        // Create the new log entry object with all fields.
        const newLogEntry = {
            ...formData,
            ...calculations,
            // Automatically set transaction type and isLogged flag.
            transaction_type: 'RECEIPT', 
            isLogged: 'false', // Unlogged until user confirms.
            // Ensure fields that could be empty are represented as an empty string.
            remarks: formData.remarks || '',
        };

        // Add the new entry to the application's data state.
        const updatedLogEntries = [...data.logEntries, newLogEntry];
        updateAppData({ logEntries: updatedLogEntries });

        // Display success message and reset the form.
        setSuccessMessage('Palay Delivery entry added to unlogged deliveries!');
        // Reset form to its initial state.
        setFormData({
            date: new Date().toISOString().slice(0, 10),
            pr_number: '',
            wsr_number: '',
            name: '',
            barangay: '',
            municipality: '',
            entry_type: 'Individual',
            warehouse: '',
            bags: 0,
            variety: '',
            moisture_content: 0,
            gross_kgs: 0,
            mts_type: '',
            sdo_name: '',
            remarks: '',
        });
        // Clear message after a few seconds.
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    // Filter varieties by "Palay" grain type for the dropdown menu.
    // Added a safety check to prevent crashing if data.varieties is not yet loaded.
    const palayVarieties = data?.varieties.filter(v => v.grainType === 'Palay').sort((a,b) => a.name.localeCompare(b.name));

    // Filter MTS types by "Palay" grain type for the dropdown menu.
    const palayMtsTypes = data?.mtsTypes.filter(m => m.grainType === 'Palay');

    // New: Check if data is loaded before rendering the form.
    if (!data) {
        return <p>Loading Palay Delivery Form...</p>;
    }

    return (
        <FormContainer>
            <FormHeader>New Palay Delivery</FormHeader>
            {/* Display success message if a new entry was successfully added. */}
            {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}
            <form onSubmit={handleSubmit}>
                <GridContainer>
                    {/* Basic Information Section */}
                    <SectionHeader>Basic Information</SectionHeader>
                    <Label htmlFor="date">Date</Label>
                    <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required />

                    <Label htmlFor="pr_number">PR Number</Label>
                    <input type="text" id="pr_number" name="pr_number" value={formData.pr_number} onChange={handleChange} required />
                    
                    <Label htmlFor="wsr_number">WSR Number</Label>
                    <input type="text" id="wsr_number" name="wsr_number" value={formData.wsr_number} onChange={handleChange} />

                    <Label htmlFor="name">Name</Label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />

                    <Label htmlFor="barangay">Barangay</Label>
                    <input type="text" id="barangay" name="barangay" value={formData.barangay} onChange={handleChange} />

                    <Label htmlFor="municipality">Municipality</Label>
                    <input type="text" id="municipality" name="municipality" value={formData.municipality} onChange={handleChange} />
                    
                    <Label>Entry Type</Label>
                    <RadioGroup>
                        <input type="radio" id="individual" name="entry_type" value="Individual" checked={formData.entry_type === 'Individual'} onChange={handleChange} />
                        <label htmlFor="individual">Individual</label>
                        <input type="radio" id="farmers_association" name="entry_type" value="Farmer's Association/Organization" checked={formData.entry_type === "Farmer's Association/Organization"} onChange={handleChange} />
                        <label htmlFor="farmers_association">Farmer's Association/Organization</label>
                    </RadioGroup>

                    <Label htmlFor="warehouse">Warehouse</Label>
                    <select id="warehouse" name="warehouse" value={formData.warehouse} onChange={handleChange} required>
                        <option value="">Select Warehouse</option>
                        {data.warehouses.sort((a,b) => a.name.localeCompare(b.name)).map((w, index) => (
                            <option key={index} value={w.name}>{w.name}</option>
                        ))}
                    </select>

                    <Label htmlFor="bags">Number of Bags</Label>
                    <input type="number" id="bags" name="bags" value={formData.bags} onChange={handleChange} />

                    <Label htmlFor="variety">Variety</Label>
                    <select id="variety" name="variety" value={formData.variety} onChange={handleChange} required>
                        <option value="">Select Variety</option>
                        {/* Only show varieties with 'Palay' as the grain type. */}
                        {palayVarieties.map((v, index) => (
                            <option key={index} value={v.name}>{v.name}</option>
                        ))}
                    </select>

                    {/* Palay Specific Fields and Calculations Section */}
                    <SectionHeader>Palay Specifics & Calculations</SectionHeader>
                    <Label htmlFor="moisture_content">Moisture Content (%)</Label>
                    <input type="number" step="0.1" id="moisture_content" name="moisture_content" value={formData.moisture_content} onChange={handleChange} />

                    <Label htmlFor="gross_kgs">Gross Kgs</Label>
                    <input type="number" step="0.001" id="gross_kgs" name="gross_kgs" value={formData.gross_kgs} onChange={handleChange} />

                    <Label htmlFor="mts_type">MTS Type</Label>
                    <select id="mts_type" name="mts_type" value={formData.mts_type} onChange={handleChange}>
                        <option value="">Select MTS Type</option>
                        {/* Filter MTS types by "Palay" grain type */}
                        {palayMtsTypes.map((mts, index) => (
                            <option key={index} value={mts.name}>{mts.name}</option>
                        ))}
                    </select>
                    
                    {/* Display calculated values */}
                    <Label>Sack Weight</Label>
                    <p>{calculations.sack_weight.toFixed(2)} kgs</p>
                    
                    <Label>Net Kgs</Label>
                    <p>{calculations.net_kgs.toFixed(2)} kgs</p>

                    <Label>ENWF</Label>
                    <p>{calculations.enwf.toFixed(2)}</p>

                    <Label>ENW Kgs</Label>
                    <p>{calculations.enw_kgs.toFixed(2)} kgs</p>
                    
                    <Label>Basic Cost</Label>
                    <p>₱{calculations.basic_cost.toFixed(2)}</p>

                    <Label>Pricer Cost</Label>
                    <p>₱{calculations.pricer_cost.toFixed(2)}</p>

                    <Label>Grand Total</Label>
                    <p>₱{calculations.grand_total.toFixed(2)}</p>

                    {/* Final Fields Section */}
                    <SectionHeader>Final Details</SectionHeader>

                    <Label htmlFor="sdo_name">SDO</Label>
                    <select id="sdo_name" name="sdo_name" value={formData.sdo_name} onChange={handleChange}>
                        <option value="">Select SDO</option>
                        {data.sdoList.map((sdo, index) => (
                            <option key={index} value={sdo.name}>{sdo.name}</option>
                        ))}
                    </select>
                    
                    <Label htmlFor="remarks">Remarks</Label>
                    <textarea id="remarks" name="remarks" value={formData.remarks} onChange={handleChange} rows="3"></textarea>
                </GridContainer>

                <Button type="submit">Add Palay Delivery</Button>
            </form>
        </FormContainer>
    );
};

export default PalayDelivery;


// --- Styled Components ---

const FormContainer = styled.div`
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const FormHeader = styled.h2`
    text-align: center;
    color: #2c3e50;
    margin-bottom: 2rem;
    border-bottom: 2px solid #eef1f5;
    padding-bottom: 1rem;
`;

const SectionHeader = styled.h3`
    grid-column: 1 / -1;
    color: #3498db;
    margin-top: 1.5rem;
    margin-bottom: 1rem;
    font-size: 1.2rem;
    border-bottom: 1px solid #ddd;
    padding-bottom: 0.5rem;
`;

const GridContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 1rem 2rem;
    align-items: center;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const Label = styled.label`
    font-weight: bold;
    color: #555;
    text-align: right;

    @media (max-width: 768px) {
        text-align: left;
    }
`;

const RadioGroup = styled.div`
    display: flex;
    gap: 1rem;
    align-items: center;
    
    input[type="radio"] {
        margin-right: 0.25rem;
    }
`;

const Button = styled.button`
    display: block;
    width: 100%;
    padding: 1rem;
    margin-top: 2rem;
    background-color: #2ecc71;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.2s ease;

    &:hover {
        background-color: #27ae60;
        transform: translateY(-2px);
    }
`;

const SuccessMessage = styled.div`
    background-color: #d4edda;
    color: #155724;
    padding: 1rem;
    margin-bottom: 1.5rem;
    border-radius: 4px;
    text-align: center;
    font-weight: bold;
`;