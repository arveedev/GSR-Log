// This file imports necessary hooks from React and external libraries.
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
// useAppData provides access to the application's global state and functions.
import { useAppData } from '../../hooks/useAppData';
// usePersistentState is a custom hook to store values in localStorage, making them persist after page reloads.
import { usePersistentState } from '../../hooks/usePersistentState';

// A helper variable to get today's date in 'YYYY-MM-DD' format.
const today = new Date().toISOString().split('T')[0];

const LogEntry = () => {
  // Destructure the global data and the addLogEntry function from our context hook.
  const { data, addLogEntry } = useAppData();

  // Sort the data alphabetically once for dropdowns
  const sortedProvinces = [...data.provinces].sort((a, b) => a.name.localeCompare(b.name));
  const sortedTransactionTypes = [...data.transactionTypes].sort((a, b) => a.name.localeCompare(b.name));
  const sortedVarieties = [...data.varieties].sort((a, b) => a.name.localeCompare(b.name));

  // --- State Management ---
  // These dropdowns use the custom usePersistentState hook.
  // This means their last selected value will be remembered by the browser.
  const [province, setProvince] = usePersistentState('lastProvince', '');
  const [warehouse, setWarehouse] = usePersistentState('lastWarehouse', '');
  const [variety, setVariety] = usePersistentState('lastVariety', '');
  const [transactionType, setTransactionType] = usePersistentState('lastTransactionType', '');

  // These fields use standard React useState, so their values reset when the form is submitted.
  const [date, setDate] = useState(today);
  const [bags, setBags] = useState('');
  const [netkgs, setNetkgs] = useState('');
  const [per50, setPer50] = useState('');
  const [remarks, setRemarks] = useState('');
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

  // The main function to handle form submission.
  const handleAdd = (e) => {
    // Prevents the default browser form submission, which would cause a page reload.
    e.preventDefault();
    // A quick check to ensure all required fields are filled before submitting.
    if (!province || !warehouse || !bags || !netkgs || !variety || !transactionType) {
      alert('Please fill out all required fields.');
      return; // Stop the function if fields are missing.
    }

    // Create a new object to hold all the form data.
    const newEntry = {
      date,
      province,
      warehouse,
      bags,
      netkgs,
      per50,
      variety,
      transaction_type: transactionType,
      remarks,
    };

    // Call the global function to add the new entry to our application's data.
    addLogEntry(newEntry);

    // Show a success message to the user.
    setIsSuccess(true);
    // Use setTimeout to automatically hide the message after 3 seconds.
    setTimeout(() => {
      setIsSuccess(false);
    }, 3000);

    // Reset fields that are not meant to be persistent.
    setDate(today);
    setBags('');
    setNetkgs('');
    setRemarks('');
  };

  // --- UI Components (JSX) ---
  // This is the structure and content of the Log Entry tab.
  return (
    <FormContainer>
      <FormHeader>Add New Entry</FormHeader>
      {/* Conditionally render the success message if isSuccess is true. */}
      {isSuccess && <SuccessMessage>Entry added successfully!</SuccessMessage>}
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