import React, { useState } from 'react';
import styled from 'styled-components';
import { useAppData } from '../../context/AppDataContext';
import { v4 as uuidv4 } from 'uuid';
import { useCallback } from 'react';
import { createCsvString } from '../../utils/csvParser';

// --- Styled Components ---

const ManageContainer = styled.div`
    padding: 2rem;
    background-color: #f7f9fc;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 0.5rem;
`;

const Header = styled.h2`
    color: #333;
    margin-bottom: 1.5rem;
    font-size: 1.75rem;
    font-weight: 600;
`;

const TabNavigation = styled.div`
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
`;

const TabButton = styled.button`
    padding: 0.75rem 1.25rem;
    border: none;
    background-color: ${props => (props.$active ? '#007bff' : '#e9ecef')};
    color: ${props => (props.$active ? '#fff' : '#495057')};
    border-radius: 20px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    &:hover {
        background-color: ${props => (props.$active ? '#0056b3' : '#dae1e7')};
    }
`;

const ContentWrapper = styled.div`
    background-color: #fff;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const ListSection = styled.div`
    margin-top: 1.5rem;
`;

const ListForm = styled.form`
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    align-items: center;
    flex-wrap: wrap;
    input, select {
        padding: 0.75rem;
        border: 1px solid #ced4da;
        border-radius: 6px;
        flex-grow: 1;
    }
    button {
        padding: 0.75rem 1.5rem;
        border: none;
        background-color: #28a745;
        color: white;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.2s ease-in-out;
        &:hover {
            background-color: #218838;
        }
    }
`;

const DataTable = styled.table`
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
    th, td {
        text-align: left;
        padding: 1rem;
        border-bottom: 1px solid #dee2e6;
    }
    th {
        background-color: #f1f3f5;
        font-weight: 600;
        color: #555;
    }
`;

const DataRow = styled.tr`
    transition: background-color 0.2s ease-in-out;
    &:hover {
        background-color: #f8f9fa;
    }
`;

const ActionButton = styled.button`
    background: none;
    border: none;
    color: ${props => (props.$delete ? '#dc3545' : '#007bff')};
    cursor: pointer;
    font-weight: 500;
    margin-right: 0.5rem;
    &:hover {
        text-decoration: underline;
    }
`;

const Placeholder = styled.p`
    text-align: center;
    color: #6c757d;
    font-style: italic;
    padding: 2rem 0;
`;

const ProvinceHeader = styled.h4`
    color: #007bff;
    margin-top: 2rem;
    margin-bottom: 1rem;
`;

// Modal Styles
const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;

const ModalContent = styled.div`
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    width: 90%;
    max-width: 500px;
    position: relative;
    display: flex;
    flex-direction: column;
`;

const ModalHeader = styled.h3`
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: #333;
    font-size: 1.5rem;
`;

const ModalBody = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const ModalFormGroup = styled.div`
    display: flex;
    flex-direction: column;
`;

const ModalLabel = styled.label`
    font-weight: 500;
    color: #495057;
    margin-bottom: 0.25rem;
`;

const ModalInput = styled.input`
    padding: 0.75rem;
    border: 1px solid #ced4da;
    border-radius: 6px;
    width: 100%;
    transition: border-color 0.2s ease;
    &:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }
`;

const ModalSelect = styled.select`
    padding: 0.75rem;
    border: 1px solid #ced4da;
    border-radius: 6px;
    width: 100%;
    background-color: white;
    transition: border-color 0.2s ease;
    &:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }
`;

const ModalButtonContainer = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
`;

const ModalButton = styled.button`
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    background-color: ${props => (props.$cancel ? '#dc3545' : '#28a745')};
    color: white;
    transition: background-color 0.2s ease-in-out;
    &:hover {
        background-color: ${props => (props.$cancel ? '#c82333' : '#218838')};
    }
`;

// A simple function to generate a unique ID. You can replace this with a more robust solution like the 'uuid' library if needed.
const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Main Component
const ManageData = () => {
    // Destructure global data and the update function from the application context.
// All your existing state variables and functions up to confirmDelete...
const { data, updateAppData } = useAppData();
// State to control which tab is currently active.
const [activeList, setActiveList] = useState('ricemills');
const [activeGrainType, setActiveGrainType] = useState('Palay');

// State for controlling the edit modal's visibility and data.
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [editForm, setEditForm] = useState({ 
    name: '', 
    province: '', 
    warehouse: '', 
    grainType: '', 
    weight: '', 
    type: '', 
    price: '', 
    description: '',
    range: '', 
    enwf: '', 
    ownerRepresentative: '', 
    address: '', 
    contactNumber: '',
    varietyId: '',
    moistureRanges: {
        range: '',
        price: ''
    }, 
});
// Stores the original item to identify it during the update process.
const [originalItem, setOriginalItem] = useState(null);
// Stores the name of the list being edited (e.g., 'provinces').
const [listToEdit, setListToEdit] = useState('');

// State for controlling the delete modal's visibility and data.
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
// Stores the item to be deleted.
const [itemToDelete, setItemToDelete] = useState(null);
// Stores the name of the list to delete from.
const [listToDeleteFrom, setListToDeleteFrom] = useState('');

// State for the form used to add new items.
const [addForm, setAddForm] = useState({ 
    name: '', 
    province: '', 
    grainType: '', 
    weight: '', 
    type: '', 
    price: '',
    description: '',
    range: '', 
    enwf: '', 
    ownerRepresentative: '', 
    address: '', 
    contactNumber: '',
    varietyId: '',
    moistureRange: '', // Renamed for clarity in the Palay form
    moistureRanges: {
        range: '',
        price: ''
    },
});

// A mapping object to easily access the correct data array from the global state.
const listDataKeys = {
    provinces: 'provinces',
    warehouses: 'warehouses',
    transactionTypes: 'transactionTypes',
    varieties: 'varieties',
    mtsTypes: 'mtsTypes',
    sdoList: 'sdoList',
    enwfRanges: 'enwfRanges',
    ricemills: 'ricemills', 
    palayPricing: 'palayPricing', 
    ricePricing: 'ricePricing', 
};

// Helper function to get the singular name for dynamic text (e.g., "Add Province").
const getSingularListName = (listName) => {
    switch (listName) {
        case 'provinces': return 'Province';
        case 'warehouses': return 'Warehouse';
        case 'transactionTypes': return 'Transaction Type';
        case 'varieties': return 'Variety';
        case 'mtsTypes': return 'MTS Type';
        case 'sdoList': return 'SDO';
        case 'enwfRanges': return 'ENWF Range';
        case 'ricemills': return 'Ricemill'; 
        case 'palayPricing': return 'Palay Price';
        case 'ricePricing': return 'Rice Price';
        default: return '';
    }
};

// --- Modal Functions ---
const openEditModal = (item, listName) => {
    let newEditForm = {};
    switch (listName) {
        case 'provinces':
            newEditForm = { name: item.name || '' };
            break;
        case 'warehouses':
            newEditForm = { name: item.name || '', province: item.province || '' };
            break;
        case 'transactionTypes':
            newEditForm = { name: item.name || '' };
            break;
        case 'varieties':
            newEditForm = { name: item.name || '', grainType: item.grainType || '' };
            break;
        case 'mtsTypes':
            newEditForm = { name: item.name || '', weight: item.weight || '', grainType: item.grainType || '' };
            break;
        case 'ricemills':
            newEditForm = {
                name: item.name || '',
                ownerRepresentative: item.ownerRepresentative || '',
                address: item.address || '',
                contactNumber: item.contactNumber || '',
            };
            break;
        case 'sdoList':
            newEditForm = { name: item.name || '', province: item.province || '' };
            break;
        case 'enwfRanges':
            newEditForm = { range: item.moisture || '', enwf: item.enwf !== undefined ? item.enwf : '' };
            break;
        case 'palayPricing':
            // Pass the entire item, handle specifics inside the modal UI
            newEditForm = { ...item };
            break;
        case 'ricePricing':
            newEditForm = {
                name: item.name || '',
                price: item.price !== undefined ? item.price : '',
                description: item.description || '',
            };
            break;
        default:
            newEditForm = { ...item };
            break;
    }
    setEditForm(newEditForm);
    setOriginalItem(item);
    setListToEdit(listName);
    setIsEditModalOpen(true);
};

const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditForm({ 
        name: '', 
        province: '', 
        grainType: '', 
        weight: '', 
        type: '', 
        price: '', 
        range: '', 
        enwf: '', 
        moisture: '', 
        ownerRepresentative: '', 
        address: '', 
        contactNumber: '',
        varietyId: '',
        moistureRanges: { range: '', price: '' },
        description: '',
    });
    setOriginalItem(null);
    setListToEdit('');
};

const handleEditFormChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('moistureRanges')) {
        const [objName, propName] = name.split('.');
        setEditForm(prev => ({
            ...prev,
            [objName]: {
                ...prev[objName],
                [propName]: value
            }
        }));
    } else {
        const updatedValue = (name === 'price' || name === 'weight' || name === 'enwf') 
            ? (value === '' ? '' : Number(value)) 
            : value;
        setEditForm(prev => ({ ...prev, [name]: updatedValue }));
    }
};

const openDeleteModal = (item, listName) => {
    setItemToDelete(item);
    setListToDeleteFrom(listName);
    setIsDeleteModalOpen(true);
};

const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
    setListToDeleteFrom('');
};

// --- CRUD Functions ---
const saveData = async (csvString) => {
    try {
        const response = await fetch('http://localhost:3001/save-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/csv',
            },
            body: csvString,
        });
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status} ${response.statusText}`);
        }
        console.log('Data successfully saved automatically!');
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Error saving data. Please ensure the backend server is running and try again.');
    }
};

const handleUpdateAppDataAndSave = useCallback((updates) => {
    updateAppData(updates);
    const updatedData = { ...data, ...updates };
    const csvString = createCsvString(updatedData);
    saveData(csvString);
}, [updateAppData, data]);

const handleAddPalayPricing = useCallback((e) => {
    e.preventDefault();
    const { varietyId, moistureRange, price } = addForm;
    
    // FIX: Check for trimmed moistureRange to handle whitespace
    if (!varietyId || !moistureRange.trim() || price === '' || isNaN(parseFloat(price))) {
        alert('Please fill out all fields for Palay pricing with a valid price.');
        return;
    }

    const variety = data.varieties.find(v => v.id === varietyId);
    if (!variety) {
        alert('Selected variety not found.');
        return;
    }

    const existingVarietyEntry = (data.palayPricing || []).find(p => p.varietyId === varietyId);
    let updatedPalayList;

    if (existingVarietyEntry) {
        const isDuplicateRange = existingVarietyEntry.moistureRanges.some(
            (mr) => mr.range === moistureRange.trim()
        );
        if (isDuplicateRange) {
            alert(`Moisture range "${moistureRange}" already exists for this variety.`);
            return;
        }
        
        updatedPalayList = (data.palayPricing || []).map(p =>
            p.varietyId === varietyId
                ? {
                    ...p,
                    moistureRanges: [
                        ...p.moistureRanges,
                        { range: moistureRange.trim(), price: parseFloat(price) }
                    ]
                }
                : p
        );
    } else {
        const newVarietyEntry = {
            id: uuidv4(),
            varietyId: variety.id,
            variety: variety.name,
            moistureRanges: [{ range: moistureRange.trim(), price: parseFloat(price) }]
        };
        updatedPalayList = [...(data.palayPricing || []), newVarietyEntry];
    }
    
    handleUpdateAppDataAndSave({ palayPricing: updatedPalayList });
    setAddForm({ varietyId: '', moistureRange: '', price: '' });
}, [addForm, data.palayPricing, data.varieties, handleUpdateAppDataAndSave, setAddForm]);

// FIX: Modified to use a 'name' input field instead of 'variety_id' from a dropdown
const handleAddRicePricing = useCallback((e) => {
    e.preventDefault();
    const { name, price, description } = addForm;
    const trimmedName = name.trim();

    if (!trimmedName || price === '' || isNaN(parseFloat(price))) {
        alert('Please enter a rice variety name and a valid price.');
        return;
    }
    
    // Check for duplicate name
    if ((data.ricePricing || []).some(rp => rp.name.toLowerCase() === trimmedName.toLowerCase())) {
        alert('A rice price for this variety already exists.');
        return;
    }

    const newRicePrice = {
        id: uuidv4(),
        name: trimmedName,
        price: parseFloat(price),
        description
    };
    
    const updatedRiceList = [...(data.ricePricing || []), newRicePrice];
    handleUpdateAppDataAndSave({ ricePricing: updatedRiceList });

    setAddForm({ name: '', price: '', description: '' });
}, [addForm, data.ricePricing, handleUpdateAppDataAndSave, setAddForm]);

const handleAdd = useCallback((e, listName) => {
    e.preventDefault();
    const dataKey = listDataKeys[listName];
    let updatedList;
    
    if (listName === 'ricemills') {
        const { name, ownerRepresentative, address, contactNumber } = addForm;
        if (!name || !ownerRepresentative || !address || !contactNumber) {
            alert('Please fill out all ricemill fields.');
            return;
        }
        if ((data.ricemills || []).some(rm => rm.name.toLowerCase() === name.toLowerCase())) {
            alert('A ricemill with this name already exists.');
            return;
        }
        updatedList = [...(data.ricemills || []), { id: uuidv4(), name, ownerRepresentative, address, contactNumber }];
    } else if (listName === 'varieties') {
        const trimmedName = addForm.name.trim();
        if (!trimmedName || !addForm.grainType) {
            alert('Please enter a name and select a grain type.');
            return;
        }
        updatedList = [...(data[dataKey] || []), { id: uuidv4(), name: trimmedName, grainType: addForm.grainType }];
    } else if (listName === 'mtsTypes') {
        const trimmedName = addForm.name.trim();
        const parsedWeight = parseFloat(addForm.weight);
        if (!trimmedName || isNaN(parsedWeight) || !addForm.grainType) {
            alert('Please enter a valid name, weight, and grain type.');
            return;
        }
        updatedList = [...(data[dataKey] || []), { id: uuidv4(), name: trimmedName, weight: parsedWeight, grainType: addForm.grainType }];
    } else if (listName === 'warehouses' || listName === 'sdoList') {
        if (!addForm.name.trim() || !addForm.province) {
            alert('Please enter a name and select a province.');
            return;
        }
        const newItem = {
            id: uuidv4(),
            name: addForm.name.trim(),
            province: addForm.province
        };
        updatedList = [...(data[dataKey] || []), newItem];
    } else if (listName === 'enwfRanges') {
        if (!addForm.range.trim() || addForm.enwf === '' || isNaN(parseFloat(addForm.enwf))) {
            alert('Please enter a valid range and ENWF multiplier.');
            return;
        }
        updatedList = [...(data[dataKey] || []), { id: uuidv4(), range: addForm.range.trim(), enwf: parseFloat(addForm.enwf) }];
    } else {
        if (!addForm.name.trim()) {
            alert('Please enter a valid name.');
            return;
        }
        const newItem = {
            id: uuidv4(),
            name: addForm.name.trim()
        };
        updatedList = [...(data[dataKey] || []), newItem];
    }
    
    if (updatedList) {
        handleUpdateAppDataAndSave({ [dataKey]: updatedList });
        setAddForm({ 
            name: '', 
            province: '', 
            grainType: '', 
            weight: '', 
            type: '', 
            price: '', 
            range: '', 
            enwf: '', 
            ownerRepresentative: '', 
            address: '', 
            contactNumber: '',
            varietyId: '',
            moistureRange: '',
            description: '',
            moistureRanges: { range: '', price: '' },
        });
    }
}, [addForm, data, handleUpdateAppDataAndSave, setAddForm, listDataKeys]);

const handleUpdate = useCallback(() => {
    const dataKey = listDataKeys[listToEdit];
    if (!dataKey) {
        console.error(`Unknown list name: ${listToEdit}`);
        return;
    }
    const currentList = data[dataKey];
    let updatedList;
    
    switch (listToEdit) {
        case 'palayPricing':
            const { varietyId, variety, moistureRanges } = editForm;
            updatedList = currentList.map(item => {
                if (item.id === originalItem.id) {
                    const updatedMoistureRanges = item.moistureRanges.map(mr =>
                        // This assumes the originalItem will contain the specific moisture range object.
                        // For this to work, your UI must pass the specific range being edited.
                        mr.range === originalItem.moistureRanges.range && mr.price === originalItem.moistureRanges.price
                            ? { ...mr, range: moistureRanges.range.trim(), price: parseFloat(moistureRanges.price) }
                            : mr
                    );
                    return { 
                        ...item, 
                        varietyId,
                        variety,
                        moistureRanges: updatedMoistureRanges 
                    };
                }
                return item;
            });
            break;
        case 'ricePricing':
            const { name, price, description } = editForm;
            updatedList = currentList.map(item =>
                item.id === originalItem.id ? { ...item, name: name.trim(), price: parseFloat(price), description: description.trim() } : item
            );
            break;
        case 'ricemills':
            updatedList = currentList.map(item =>
                item.id === originalItem.id ? { ...item, name: editForm.name, ownerRepresentative: editForm.ownerRepresentative, address: editForm.address, contactNumber: editForm.contactNumber } : item
            );
            break;
        case 'varieties':
            updatedList = currentList.map(item =>
                item.id === originalItem.id ? { ...item, name: editForm.name.trim(), grainType: editForm.grainType.trim() } : item
            );
            break;
        case 'mtsTypes':
            updatedList = currentList.map(item =>
                item.id === originalItem.id ? { ...item, name: editForm.name.trim(), weight: parseFloat(editForm.weight), grainType: editForm.grainType.trim() } : item
            );
            break;
        case 'warehouses':
        case 'sdoList':
            updatedList = currentList.map(item =>
                item.id === originalItem.id ? { ...item, name: editForm.name.trim(), province: editForm.province.trim() } : item
            );
            break;
        case 'enwfRanges':
            updatedList = currentList.map(item =>
                item.id === originalItem.id ? { ...item, range: editForm.range.trim(), enwf: parseFloat(editForm.enwf) } : item
            );
            break;
        default:
            updatedList = currentList.map(item =>
                item.id === originalItem.id ? { ...item, name: editForm.name.trim() } : item
            );
            break;
    }
    
    // Pass the updated list to your centralized update and save function
    handleUpdateAppDataAndSave({ [dataKey]: updatedList });
    closeEditModal();
}, [data, editForm, listToEdit, originalItem, handleUpdateAppDataAndSave, closeEditModal, listDataKeys]);

const confirmDelete = useCallback(() => {
    const dataKey = listDataKeys[listToDeleteFrom];
    const currentList = data[dataKey] || [];
    
    const updatedList = currentList.filter(item => item.id !== itemToDelete.id);
    
    // Pass the updated list to your centralized update and save function
    handleUpdateAppDataAndSave({ [dataKey]: updatedList });

    closeDeleteModal();
}, [data, itemToDelete, listDataKeys, listToDeleteFrom, handleUpdateAppDataAndSave, closeDeleteModal]);

const renderListContent = () => {
    // New, more specific column maps
    const columnMaps = {
        provinces: { 'Name': 'name' },
        warehouses: { 'Name': 'name', 'Province': 'province' },
        transactionTypes: { 'Name': 'name' },
        varieties: { 'Variety Name': 'name', 'Grain Type': 'grainType' },
        mtsTypes: { 'MTS Name': 'name', 'Weight': 'weight', 'Grain Type': 'grainType' },
        ricemills: { 'Ricemill Name': 'name', 'Owner/Representative': 'ownerRepresentative', 'Address': 'address', 'Contact Number': 'contactNumber' },
        sdoList: { 'Name': 'name', 'Province': 'province' },
        enwfRanges: { 'Moisture Content Range': 'moisture', 'ENWF Multiplier': 'enwf' },
        // Updated to reflect the new object structure and display names
        palayPricing: { 'Variety': 'variety', 'Moisture Ranges': 'moistureRanges' },
        ricePricing: { 'Variety Name': 'name', 'Price (₱/kg)': 'price', 'Description': 'description' }
    };

    const groupSdosByProvince = () => {
        const grouped = {};
        (data.sdoList || []).sort((a, b) => a.name.localeCompare(b.name)).forEach(sdo => {
            const province = sdo.province || 'No Province';
            if (!grouped[province]) {
                grouped[province] = [];
            }
            grouped[province].push(sdo);
        });
        return grouped;
    };

    const sortedData = {
        provinces: [...(data.provinces || [])].sort((a, b) => a.name.localeCompare(b.name)),
        warehouses: [...(data.warehouses || [])].sort((a, b) => a.name.localeCompare(b.name)),
        transactionTypes: [...(data.transactionTypes || [])].sort((a, b) => a.name.localeCompare(b.name)),
        varieties: [...(data.varieties || [])].sort((a, b) => a.name.localeCompare(b.name)),
        mtsTypes: [...(data.mtsTypes || [])].sort((a, b) => a.name.localeCompare(b.name)),
        sdoList: [...(data.sdoList || [])].sort((a, b) => a.name.localeCompare(b.name)),
        ricemills: [...(data.ricemills || [])].sort((a, b) => a.name.localeCompare(b.name)),
        enwfRanges: [...(data.enwfRanges || [])].sort((a, b) => parseFloat(a.moisture) - parseFloat(b.moisture)),
        // Sort Palay Pricing by variety name for better display
        palayPricing: [...(data.palayPricing || [])].sort((a, b) => a.variety.localeCompare(b.variety)),
        ricePricing: [...(data.ricePricing || [])].sort((a, b) => a.name.localeCompare(b.name)),
    };

    const renderTable = (list, listName, editFn, deleteFn) => {
        const columns = Object.keys(columnMaps[listName]);

        return (
            <DataTable>
                <thead>
                    <tr>
                        {columns.map(col => <th key={col}>{col}</th>)}
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {list.length > 0 ? (
                        list.map((item) => (
                            <DataRow key={item.id}>
                                {columns.map(columnTitle => {
                                    const dataKey = columnMaps[listName][columnTitle];
                                    
                                    // Handle special rendering for Palay Pricing
                                    if (listName === 'palayPricing' && dataKey === 'moistureRanges') {
                                        // The fix: Ensure moistureRanges is an array before mapping.
                                        const moistureRanges = Array.isArray(item.moistureRanges) 
                                            ? item.moistureRanges 
                                            : (item.moistureRanges ? [item.moistureRanges] : []);

                                        return (
                                            <td key={`${item.id}-moistureRanges`}>
                                                <ul>
                                                    {moistureRanges.map((range, index) => (
                                                        <li key={index}>{range.range}: ₱{range.price}</li>
                                                    ))}
                                                </ul>
                                            </td>
                                        );
                                    }

                                    // Handle variety name lookup for Palay Pricing
                                    if (listName === 'palayPricing' && dataKey === 'variety') {
                                        return <td key={`${item.id}-${dataKey}`}>{item.variety || 'N/A'}</td>;
                                    }

                                    // Handle special rendering for Rice Pricing
                                    if (listName === 'ricePricing' && dataKey === 'price') {
                                        return <td key={`${item.id}-${dataKey}`}>₱{item.price}</td>;
                                    }

                                    return <td key={`${item.id}-${dataKey}`}>{item[dataKey]}</td>;
                                })}
                                <td>
                                    <ActionButton onClick={() => editFn(item, listName)}>Edit</ActionButton>
                                    <ActionButton $delete onClick={() => deleteFn(item, listName)}>Delete</ActionButton>
                                </td>
                            </DataRow>
                        ))
                    ) : (
                        <DataRow key="no-data-row">
                            <td colSpan={columns.length + 1}>
                                <Placeholder>No {getSingularListName(listName).toLowerCase()} found.</Placeholder>
                            </td>
                        </DataRow>
                    )}
                </tbody>
            </DataTable>
        );
    };

    switch (activeList) {
        // ... (existing cases for ricemills, sdoList, etc.)
        case 'pricing':
            return (
                <ListSection>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <button onClick={() => setActiveGrainType('Palay')} style={{ fontWeight: activeGrainType === 'Palay' ? 'bold' : 'normal' }}>Manage Palay Prices</button>
                        <button onClick={() => setActiveGrainType('Rice')} style={{ fontWeight: activeGrainType === 'Rice' ? 'bold' : 'normal' }}>Manage Rice Prices</button>
                    </div>
                    {activeGrainType === 'Palay' && (
                        <>
                            <ListForm onSubmit={(e) => handleAddPalayPricing(e)}>
                                <select
                                    value={addForm.varietyId || ''}
                                    onChange={(e) => setAddForm({ ...addForm, varietyId: e.target.value })}
                                    required
                                >
                                    <option value="">Select Palay Variety</option>
                                    {sortedData.varieties.filter(v => v.grainType === 'Palay').map(v => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    value={addForm.moistureRange || ''}
                                    onChange={(e) => setAddForm({ ...addForm, moistureRange: e.target.value })}
                                    placeholder="Moisture Range (e.g., 14.0-16.0)"
                                    required
                                />
                                <input
                                    type="number"
                                    step="0.01"
                                    value={addForm.price || ''}
                                    onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                                    placeholder="Price (₱/kg)"
                                    required
                                />
                                <button type="submit">Add Price Range</button>
                            </ListForm>
                            {renderTable(
                                sortedData.palayPricing,
                                'palayPricing',
                                (item) => openEditModal(item, 'palayPricing'),
                                (item) => openDeleteModal(item, 'palayPricing')
                            )}
                        </>
                    )}
                    {activeGrainType === 'Rice' && (
                        <>
                            <ListForm onSubmit={(e) => handleAddRicePricing(e)}>
                                <input
                                    type="text"
                                    value={addForm.name || ''}
                                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                                    placeholder="Enter Rice Variety Name"
                                    required
                                />
                                <input
                                    type="number"
                                    step="0.01"
                                    value={addForm.price || ''}
                                    onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                                    placeholder="Price (₱/kg)"
                                    required
                                />
                                <input
                                    type="text"
                                    value={addForm.description || ''}
                                    onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                                    placeholder="Optional Description"
                                />
                                <button type="submit">Add Rice Price</button>
                            </ListForm>
                            {renderTable(
                                sortedData.ricePricing,
                                'ricePricing',
                                (item) => openEditModal(item, 'ricePricing'),
                                (item) => openDeleteModal(item, 'ricePricing')
                            )}
                        </>
                    )}
                </ListSection>
            );
        case 'enwfRanges':
            return (
                <ListSection>
                    <ListForm onSubmit={(e) => handleAdd(e, 'enwfRanges')}>
                        <input
                            type="text"
                            value={addForm.range || ''}
                            onChange={(e) => setAddForm({ ...addForm, range: e.target.value })}
                            placeholder="Enter Moisture (e.g., 22.0)"
                        />
                        <input
                            type="number"
                            step="0.001"
                            value={addForm.enwf || ''}
                            onChange={(e) => setAddForm({ ...addForm, enwf: e.target.value })}
                            placeholder="Enter Multiplier (e.g., 1.04)"
                        />
                        <button type="submit">Add</button>
                    </ListForm>
                    {renderTable(sortedData.enwfRanges, 'enwfRanges', (item) => openEditModal(item, 'enwfRanges'), (item) => openDeleteModal(item, 'enwfRanges'))}
                </ListSection>
            );
        default:
            const currentData = sortedData[activeList] || [];
            return (
                <ListSection>
                    <ListForm onSubmit={(e) => handleAdd(e, activeList)}>
                        <input
                            type="text"
                            value={addForm.name || ''}
                            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                            placeholder={`Enter ${getSingularListName(activeList)} Name`}
                        />
                        {activeList === 'warehouses' && (
                            <select
                                value={addForm.province || ''}
                                onChange={(e) => setAddForm({ ...addForm, province: e.target.value })}
                            >
                                <option value="">Select Province</option>
                                {sortedData.provinces.map((province, index) => (
                                    <option key={index} value={province.name}>{province.name}</option>
                                ))}
                            </select>
                        )}
                        {(activeList === 'varieties' || activeList === 'mtsTypes') && (
                            <>
                                <select
                                    value={addForm.grainType || ''}
                                    onChange={(e) => setAddForm({ ...addForm, grainType: e.target.value })}
                                >
                                    <option value="">Select Grain Type</option>
                                    {data.grainTypes.map(gt => (
                                        <option key={gt} value={gt}>{gt}</option>
                                    ))}
                                </select>
                                {activeList === 'mtsTypes' && (
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={addForm.weight || ''}
                                        onChange={(e) => setAddForm({ ...addForm, weight: e.target.value })}
                                        placeholder="Enter Weight (kgs)"
                                    />
                                )}
                            </>
                        )}
                        {activeList === 'ricemills' && (
                            <>
                                <input type="text" value={addForm.ownerRepresentative || ''} onChange={(e) => setAddForm({ ...addForm, ownerRepresentative: e.target.value })} placeholder="Owner/Representative" />
                                <input type="text" value={addForm.address || ''} onChange={(e) => setAddForm({ ...addForm, address: e.target.value })} placeholder="Address" />
                                <input type="text" value={addForm.contactNumber || ''} onChange={(e) => setAddForm({ ...addForm, contactNumber: e.target.value })} placeholder="Contact Number" />
                            </>
                        )}
                        <button type="submit">Add</button>
                    </ListForm>
                    {renderTable(currentData, activeList, (item) => openEditModal(item, activeList), (item) => openDeleteModal(item, activeList))}
                </ListSection>
            );
    }
};
    if (!data) {
        return <p>Loading data management tools...</p>;
    }

    return (
<ManageContainer>
    <Header>Manage Data</Header>
    <TabNavigation>
        <TabButton $active={activeList === 'ricemills'} onClick={() => setActiveList('ricemills')}>Ricemill Profiles</TabButton>
        <TabButton $active={activeList === 'provinces'} onClick={() => setActiveList('provinces')}>Provinces</TabButton>
        <TabButton $active={activeList === 'warehouses'} onClick={() => setActiveList('warehouses')}>Warehouses</TabButton>
        <TabButton $active={activeList === 'transactionTypes'} onClick={() => setActiveList('transactionTypes')}>Transaction Types</TabButton>
        <TabButton $active={activeList === 'varieties'} onClick={() => setActiveList('varieties')}>Varieties</TabButton>
        <TabButton $active={activeList === 'mtsTypes'} onClick={() => setActiveList('mtsTypes')}>MTS Types</TabButton>
        <TabButton $active={activeList === 'sdoList'} onClick={() => setActiveList('sdoList')}>SDO List</TabButton>
        <TabButton $active={activeList === 'pricing'} onClick={() => setActiveList('pricing')}>Pricing</TabButton>
        <TabButton $active={activeList === 'enwfRanges'} onClick={() => setActiveList('enwfRanges')}>ENWF Range</TabButton>
    </TabNavigation>
    <ContentWrapper>
        {renderListContent()}
    </ContentWrapper>

    {isEditModalOpen && (
        <ModalOverlay>
            <ModalContent>
                <ModalHeader>Edit {getSingularListName(listToEdit)}</ModalHeader>
                <ListForm onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
                    {listToEdit === 'enwfRanges' ? (
                        <>
                            <label>
                                Moisture Content Range
                                <input
                                    type="text"
                                    name="range"
                                    value={editForm.range}
                                    onChange={handleEditFormChange}
                                />
                            </label>
                            <label>
                                ENWF Multiplier
                                <input
                                    type="number"
                                    step="0.01"
                                    name="enwf"
                                    value={editForm.enwf}
                                    onChange={handleEditFormChange}
                                />
                            </label>
                        </>
                    ) : listToEdit === 'mtsTypes' ? (
                        <>
                            <label>
                                MTS Name
                                <input
                                    type="text"
                                    name="name"
                                    value={editForm.name}
                                    onChange={handleEditFormChange}
                                />
                            </label>
                            <label>
                                Weight (kgs)
                                <input
                                    type="number"
                                    step="0.01"
                                    name="weight"
                                    value={editForm.weight}
                                    onChange={handleEditFormChange}
                                />
                            </label>
                            <label>
                                Grain Type
                                <select
                                    name="grainType"
                                    value={editForm.grainType}
                                    onChange={handleEditFormChange}
                                >
                                    <option value="">Select Grain Type</option>
                                    {data.grainTypes.map(gt => (
                                        <option key={gt} value={gt}>{gt}</option>
                                    ))}
                                </select>
                            </label>
                        </>
                    ) : listToEdit === 'ricemills' ? (
                        <>
                            <label>
                                Ricemill Name
                                <input
                                    type="text"
                                    name="name"
                                    value={editForm.name}
                                    onChange={handleEditFormChange}
                                />
                            </label>
                            <label>
                                Owner/Representative
                                <input
                                    type="text"
                                    name="ownerRepresentative"
                                    value={editForm.ownerRepresentative}
                                    onChange={handleEditFormChange}
                                />
                            </label>
                            <label>
                                Address
                                <input
                                    type="text"
                                    name="address"
                                    value={editForm.address}
                                    onChange={handleEditFormChange}
                                />
                            </label>
                            <label>
                                Contact Number
                                <input
                                    type="tel"
                                    name="contactNumber"
                                    value={editForm.contactNumber}
                                    onChange={handleEditFormChange}
                                />
                            </label>
                        </>
                    ) : listToEdit === 'varieties' ? (
                        <>
                            <label>
                                Variety Name
                                <input
                                    type="text"
                                    name="name"
                                    value={editForm.name}
                                    onChange={handleEditFormChange}
                                />
                            </label>
                            <label>
                                Grain Type
                                <select
                                    name="grainType"
                                    value={editForm.grainType}
                                    onChange={handleEditFormChange}
                                >
                                    <option value="">Select Grain Type</option>
                                    {data.grainTypes.map(gt => (
                                        <option key={gt} value={gt}>{gt}</option>
                                    ))}
                                </select>
                            </label>
                        </>
                    ) : listToEdit === 'pricing' ? (
                        <>
                            <label>
                                Name
                                <input
                                    type="text"
                                    name="name"
                                    value={editForm.name}
                                    onChange={handleEditFormChange}
                                />
                            </label>
                            <label>
                                Price (per kg)
                                <input
                                    type="number"
                                    step="0.01"
                                    name="price"
                                    value={editForm.price}
                                    onChange={handleEditFormChange}
                                />
                            </label>
                            <label>
                                Description
                                <input
                                    type="text"
                                    name="description"
                                    value={editForm.description}
                                    onChange={handleEditFormChange}
                                />
                            </label>
                        </>
                    ) : listToEdit === 'warehouses' ? (
                        <>
                            <label>
                                Warehouse Name
                                <input
                                    type="text"
                                    name="name"
                                    value={editForm.name}
                                    onChange={handleEditFormChange}
                                />
                            </label>
                            <label>
                                Province
                                <select
                                    name="province"
                                    value={editForm.province}
                                    onChange={handleEditFormChange}
                                >
                                    <option value="">Select Province</option>
                                    {data.provinces.map((p) => (
                                        <option key={p.id} value={p.name}>{p.name}</option>
                                    ))}
                                </select>
                            </label>
                        </>
                    ) : listToEdit === 'sdoList' ? (
                        <>
                            <label>
                                SDO Name
                                <input
                                    type="text"
                                    name="name"
                                    value={editForm.name}
                                    onChange={handleEditFormChange}
                                />
                            </label>
                            <label>
                                Province
                                <select
                                    name="province"
                                    value={editForm.province}
                                    onChange={handleEditFormChange}
                                >
                                    <option value="">Select Province</option>
                                    {data.provinces.map((p) => (
                                        <option key={p.id} value={p.name}>{p.name}</option>
                                    ))}
                                </select>
                            </label>
                        </>
                    ) : (
                        // Default case for simple lists
                        <label>
                            Name
                            <input
                                type="text"
                                name="name"
                                value={editForm.name}
                                onChange={handleEditFormChange}
                            />
                        </label>
                    )}
                    <ModalButtonContainer>
                        <ModalButton type="submit">Save Changes</ModalButton>
                        <ModalButton type="button" $cancel onClick={closeEditModal}>Cancel</ModalButton>
                    </ModalButtonContainer>
                </ListForm>
            </ModalContent>
        </ModalOverlay>
    )}
    {isDeleteModalOpen && (
        <ModalOverlay>
            <ModalContent>
                <ModalHeader>Confirm Deletion</ModalHeader>
                <p>Are you sure you want to delete <strong>{itemToDelete.name || itemToDelete.type || itemToDelete.range}</strong> from the list?</p>
                <ModalButtonContainer>
                    <ModalButton $delete onClick={confirmDelete}>Delete</ModalButton>
                    <ModalButton $cancel onClick={closeDeleteModal}>Cancel</ModalButton>
                </ModalButtonContainer>
            </ModalContent>
        </ModalOverlay>
    )}
</ManageContainer>
    );
};

export default ManageData;