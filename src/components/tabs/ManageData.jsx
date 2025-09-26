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
const ManageData = ({ sortedData }) => {
// Destructure global data and the update function from the application context.
const { data, updateAppData, updateServerData } = useAppData();

// State to control which tab is currently active.
const [activeList, setActiveList] = useState('riceMills');
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
    owner: '', // Changed to 'owner' to match CSV header
    address: '',
    contactNumber: '',
    varietyId: '',
    moistureRanges: [], // Changed to an empty array to match the data structure
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
    owner: '', // Changed to 'owner' to match CSV header
    address: '',
    contactNumber: '',
    varietyId: '',
    moistureRanges: [], // Changed to an empty array to match the data structure
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
    riceMills: 'riceMills', // Changed from 'ricemills'
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
        case 'riceMills': return 'Ricemill'; // Changed from 'ricemills'
        case 'palayPricing': return 'Palay Price';
        case 'ricePricing': return 'Rice Price';
        default: return '';
    }
};

if (!sortedData || !sortedData.provinces) {
    return <div>Loading data...</div>; // Or show a spinner/loading state
}

// --- Modal Functions ---
const openEditModal = (item, listName) => {
    let newEditForm = {};
    switch (listName) {
        case 'provinces':
            newEditForm = { name: item.name || '' };
            break;
        case 'warehouses':
            newEditForm = { name: item.name || '', province: item.province || '', warehouseCode: item.warehouseCode || '' };
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
        case 'riceMills':
            newEditForm = {
                name: item.name || '',
                owner: item.owner || '',
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
        description: '',
        range: '',
        enwf: '',
        owner: '',
        address: '',
        contactNumber: '',
        varietyId: '',
        moistureRanges: [],
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

// --- CRUD Functions (Refactored for Safe API) ---

const handleAddPalayPricing = useCallback(async (e) => {
    e.preventDefault();
    const listName = 'palayPricing';
    const { varietyId, moistureRanges } = addForm;

    // Helper to safely parse moistureRanges which may be corrupted strings from CSV serialization
    const getSafeRanges = (item) => {
        let ranges = item?.moistureRanges;
        if (typeof ranges === 'string') {
            try {
                // Remove outer quotes that the CSV library might be adding ("[{...}]")
                let cleaned = ranges.replace(/^"|"$/g, '').replace(/""/g, '"');
                // The CSV data might have triple quotes like """[]""", so we attempt robust parsing
                let parsed = JSON.parse(cleaned);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                // Fallback for severely corrupted or empty strings
                return [];
            }
        }
        // Return the array if it was already correctly parsed, or an empty array as fallback
        return Array.isArray(ranges) ? ranges : [];
    };

    // 🎯 FIX: Use safe-access for moistureRanges and its properties
    const { range, price } = moistureRanges || { range: '', price: '' };

    const trimmedRange = (range ?? '').trim();

    if (!varietyId || !trimmedRange || price === '' || isNaN(parseFloat(price))) {
        alert('Please fill out all fields for Palay pricing with a valid price.');
        return;
    }

    const variety = data.varieties.find(v => v.id === varietyId);
    if (!variety) {
        alert('Selected variety not found.');
        return;
    }

    const existingVarietyEntry = (data.palayPricing || []).find(p => p.varietyId === varietyId);
    let itemToSend;
    let action = 'add';

    if (existingVarietyEntry) {
        // 🎯 FIX: Use the safe helper function to get a guaranteed array from the potentially corrupted state
        const existingRangesArray = getSafeRanges(existingVarietyEntry);

        const isDuplicateRange = existingRangesArray.some(
            (mr) => mr.range === trimmedRange
        );
        if (isDuplicateRange) {
            alert(`Moisture range "${trimmedRange}" already exists for this variety.`);
            return;
        }

        // Calculate the updated item for the server
        itemToSend = {
            ...existingVarietyEntry,
            moistureRanges: [
                ...existingRangesArray,
                { range: trimmedRange, price: parseFloat(price) }
            ]
        };
        action = 'update';
    } else {
        itemToSend = {
            id: uuidv4(),
            varietyId: variety.id,
            variety: variety.name,
            moistureRanges: [{ range: trimmedRange, price: parseFloat(price) }]
        };
        action = 'add';
    }

    await updateServerData(listName, action, itemToSend);

    setAddForm({ varietyId: '', moistureRanges: { range: '', price: '' } });

}, [addForm, data.palayPricing, data.varieties, updateServerData, setAddForm]);

const handleAddRicePricing = useCallback(async (e) => { // ADDED 'async'
    e.preventDefault();
    const listName = 'ricePricing';
    const { name, price, description } = addForm;
    const trimmedName = (name ?? '').trim();
    const trimmedDescription = (description ?? '').trim(); // 🎯 ADDED SAFE TRIM

    if (!trimmedName || price === '' || isNaN(parseFloat(price))) {
        alert('Please enter a rice variety name and a valid price.');
        return;
    }
    
    if ((data.ricePricing || []).some(rp => rp.name.toLowerCase() === trimmedName.toLowerCase())) {
        alert('A rice price for this variety already exists.');
        return;
    }

    const newItem = {
        id: uuidv4(),
        name: trimmedName,
        price: parseFloat(price),
        description: trimmedDescription // Use the safely trimmed description
    };
    
    // *** SAFE SAVE: Call the server with ONLY the item to add ***
    await updateServerData(listName, 'add', newItem);

    setAddForm({ name: '', price: '', description: '' });
}, [addForm, data.ricePricing, updateServerData, setAddForm]);

const handleAdd = useCallback(async (e, listName) => { // ADDED 'async'
    e.preventDefault();
    
    // *** CRITICAL FIX START: Explicitly use the correct case for server key ***
    let dataKey;
    if (listName === 'riceMills') {
        dataKey = 'riceMills'; // Use the correct camelCase key for the server API call
    } else {
        // Fall back to the lookup for other lists
        dataKey = listDataKeys[listName]; 
    }
    // *** CRITICAL FIX END ***
    
    let newItem;
    
    switch (listName) {
        case 'riceMills': {
            const { name, owner, address, contactNumber } = addForm;
            if (!name || !owner || !address || !contactNumber) {
                alert('Please fill out all ricemill fields.');
                return;
            }
            // NOTE: data[dataKey] now correctly looks up data.riceMills
            const dataSection = data[dataKey] || []; 
            if (dataSection.some(rm => rm.name.toLowerCase() === name.toLowerCase())) {
                alert('A ricemill with this name already exists.');
                return;
            }
            newItem = { id: uuidv4(), name, owner, address, contactNumber };
            break;
        }
        case 'varieties': {
            const trimmedName = (addForm.name ?? '').trim();
            if (!trimmedName || !addForm.grainType) {
                alert('Please enter a name and select a grain type.');
                return;
            }
            newItem = { id: uuidv4(), name: trimmedName, grainType: addForm.grainType };
            break;
        }
        case 'mtsTypes': {
            const trimmedName = (addForm.name ?? '').trim();
            const parsedWeight = parseFloat(addForm.weight);
            if (!trimmedName || isNaN(parsedWeight) || !addForm.grainType) {
                alert('Please enter a valid name, weight, and grain type.');
                return;
            }
            newItem = { id: uuidv4(), name: trimmedName, weight: parsedWeight, grainType: addForm.grainType };
            break;
        }
        case 'warehouses':
        case 'sdoList': {
            const trimmedName = (addForm.name ?? '').trim();
            if (!trimmedName || !addForm.province) {
                alert('Please enter a name and select a province.');
                return;
            }
            newItem = {
                id: uuidv4(),
                name: trimmedName,
                province: addForm.province,
                warehouseCode: addForm.warehouseCode || ''
            };
            break;
        }
        case 'enwfRanges': {
            const trimmedRange = (addForm.range ?? '').trim();
            if (!trimmedRange || addForm.enwf === '' || isNaN(parseFloat(addForm.enwf))) {
                alert('Please enter a valid range and ENWF multiplier.');
                return;
            }
            newItem = { id: uuidv4(), moisture: trimmedRange, enwf: parseFloat(addForm.enwf) };
            break;
        }
        default: {
            const trimmedName = (addForm.name ?? '').trim();
            if (!trimmedName) {
                alert('Please enter a valid name.');
                return;
            }
            newItem = {
                id: uuidv4(),
                name: trimmedName
            };
            break;
        }
    }
    
    if (newItem) {
        // SAFE SAVE: Call the server with ONLY the item to add
        await updateServerData(dataKey, 'add', newItem); 
        
        setAddForm({ 
            name: '', 
            province: '', 
            grainType: '', 
            weight: '', 
            type: '', 
            price: '', 
            description: '',
            range: '', 
            enwf: '', 
            owner: '',
            address: '', 
            contactNumber: '',
            varietyId: '',
            moistureRanges: { range: '', price: '' }, // Reset to an object structure
        });
    }
}, [addForm, data, updateServerData, setAddForm, listDataKeys]);

const handleUpdate = useCallback(async () => { // ADDED 'async'
    const listName = listToEdit;

    // *** CRITICAL FIX START: Explicitly use the correct case for server key ***
    let dataKey;
    if (listName === 'riceMills') {
        dataKey = 'riceMills';
    } else {
        dataKey = listDataKeys[listName];
    }
    // *** CRITICAL FIX END ***

    if (!dataKey || !originalItem || !originalItem.id) {
        console.error(`Unknown list name: ${listToEdit} or Original item not found.`);
        return;
    }
    
    let updatedItem = { ...originalItem }; // The single item to send to the server
    
    switch (listToEdit) {
        case 'palayPricing': {
            const trimmedMoisture = (editForm.moisture ?? '').trim();
            // Find the parent Palay Pricing entry (originalItem) and update its moistureRanges array
            updatedItem = {
                ...originalItem,
                moistureRanges: originalItem.moistureRanges.map(mr =>
                    // Compare by the original range value (originalItem.range)
                    (mr.range === originalItem.range)
                        ? { range: trimmedMoisture, price: parseFloat(editForm.price) }
                        : mr
                )
            };
            break;
        }
        case 'ricePricing': {
            const { name, price, description } = editForm;
            updatedItem = { 
                ...originalItem, 
                name: (name ?? '').trim(), 
                price: parseFloat(price), 
                description: (description ?? '').trim() 
            };
            break;
        }
        case 'riceMills': {
            if (!editForm.name || !editForm.owner || !editForm.address || !editForm.contactNumber) {
                alert('Please fill out all fields for the rice mill update.');
                return;
            }
            updatedItem = { ...originalItem, name: editForm.name, owner: editForm.owner, address: editForm.address, contactNumber: editForm.contactNumber };
            break;
        }
        case 'varieties': {
            updatedItem = { ...originalItem, name: (editForm.name ?? '').trim(), grainType: (editForm.grainType ?? '').trim() };
            break;
        }
        case 'mtsTypes': {
            updatedItem = { 
                ...originalItem, 
                name: (editForm.name ?? '').trim(), 
                weight: parseFloat(editForm.weight), 
                grainType: (editForm.grainType ?? '').trim() 
            };
            break;
        }
        case 'warehouses':
        case 'sdoList': {
            updatedItem = { 
                ...originalItem, 
                name: (editForm.name ?? '').trim(), 
                province: (editForm.province ?? '').trim(), 
                warehouseCode: editForm.warehouseCode || originalItem.warehouseCode || '' 
            };
            break;
        }
        case 'enwfRanges': {
            updatedItem = { 
                ...originalItem, 
                moisture: (editForm.range ?? '').trim(), 
                enwf: parseFloat(editForm.enwf) 
            };
            break;
        }
        default: {
            updatedItem = { ...originalItem, name: (editForm.name ?? '').trim() };
            break;
        }
    }
    
    // SAFE SAVE: Call the server with ONLY the item to update
    if (updatedItem) {
        await updateServerData(dataKey, 'update', updatedItem); 
    }
    
    closeEditModal();
}, [editForm, listToEdit, originalItem, updateServerData, closeEditModal, listDataKeys]);

const confirmDelete = useCallback(async () => { // ADDED 'async'
    const listName = listToDeleteFrom;

    // *** CRITICAL FIX START: Explicitly use the correct case for server key ***
    let dataKey;
    if (listName === 'riceMills') {
        dataKey = 'riceMills';
    } else {
        dataKey = listDataKeys[listName];
    }
    // *** CRITICAL FIX END ***
    
    if (!dataKey) {
        console.error(`Unknown list name: ${listToDeleteFrom}`);
        return;
    }
    
    // SAFE SAVE: Call the server with ONLY the item to delete
    await updateServerData(dataKey, 'delete', itemToDelete);

    closeDeleteModal();
}, [itemToDelete, listDataKeys, listToDeleteFrom, updateServerData, closeDeleteModal]);

const renderListContent = () => {
    // New, more specific column maps
    const columnMaps = {
        provinces: { 'Name': 'name' },
        warehouses: { 'Name': 'name', 'Province': 'province', 'Code': 'warehouseCode' },
        transactionTypes: { 'Name': 'name' },
        varieties: { 'Variety Name': 'name', 'Grain Type': 'grainType' },
        mtsTypes: { 'MTS Name': 'name', 'Weight': 'weight', 'Grain Type': 'grainType' },
        riceMills: { 'Ricemill Name': 'name', 'Owner': 'owner', 'Address': 'address', 'Contact Number': 'contactNumber' },
        sdoList: { 'Name': 'name', 'Province': 'province' },
        enwfRanges: { 'Moisture Content Range': 'moisture', 'ENWF Multiplier': 'enwf' },

        // Keeping palayPricing the same, as 'varietyId' is needed for the lookup
        palayPricing: { 'Variety': 'varietyId', 'Moisture Ranges': 'moistureRanges' },

        // 🎯 CRITICAL FIX: Explicitly define inputType: 'text' for 'name' and 'number' for 'price' 
        // to override any default logic that tries to render a dropdown based on the key name.
        ricePricing: { 
            'Price Name': { dataKey: 'name', inputType: 'text' }, 
            'Price (₱/kg)': { dataKey: 'price', inputType: 'number' }, 
            'Description': { dataKey: 'description', inputType: 'text' }
        }
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
        riceMills: [...(data.riceMills || [])].sort((a, b) => a.name.localeCompare(b.name)),
        enwfRanges: [...(data.enwfRanges || [])].sort((a, b) => parseFloat(a.moisture) - parseFloat(b.moisture)),
        // Sort Palay Pricing by variety name for better display
        palayPricing: [...(data.palayPricing || [])].sort((a, b) => {
            const varietyA = data.varieties.find(v => v.id === a.varietyId)?.name || '';
            const varietyB = data.varieties.find(v => v.id === b.varietyId)?.name || '';
            return varietyA.localeCompare(varietyB);
        }),
        ricePricing: [...(data.ricePricing || [])].sort((a, b) => a.name.localeCompare(b.name)),
    };
    
    // Helper function to safely extract the data key from the columnMaps configuration
    const getColumnDataKey = (listName, columnTitle) => {
        const config = columnMaps[listName]?.[columnTitle];
        if (!config) return null;
        
        // If the config is a string (old format), use it directly
        if (typeof config === 'string') {
            return config;
        }
        
        // If the config is an object (new format), use its dataKey
        if (typeof config === 'object' && config.dataKey) {
            return config.dataKey;
        }
        
        return null;
    };

    const renderTable = (list, listName, editFn, deleteFn) => {
        const columns = Object.keys(columnMaps[listName] || {});

        // Helper to safely parse moistureRanges which may be corrupted strings from CSV serialization
        const getSafeRanges = (item) => {
            let ranges = item?.moistureRanges;
            
            // If the data is already an array, use it directly (the ideal state)
            if (Array.isArray(ranges)) {
                return ranges;
            }

            if (typeof ranges === 'string') {
                try {
                    let cleaned = ranges.trim();
                    
                    // 1. Remove all external quotes (", "", """, etc.) iteratively
                    while (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                        cleaned = cleaned.substring(1, cleaned.length - 1).trim();
                    }

                    // 2. Remove ONLY backslashes that were added for escaping.
                    cleaned = cleaned.replace(/\\"/g, '"');
                    
                    // 3. Attempt JSON parse
                    let parsed = JSON.parse(cleaned);
                    
                    // 4. Return array or fallback
                    return Array.isArray(parsed) ? parsed : [];
                } catch (e) {
                    return [];
                }
            }
            // Fallback for null/undefined/empty string
            return [];
        };

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
                                    // 🎯 KEY FIX: Use the new helper to get the correct string key
                                    const dataKey = getColumnDataKey(listName, columnTitle);
                                    
                                    // Fallback/safety check
                                    if (!dataKey) return null;

                                    if (listName === 'palayPricing') {
                                        if (dataKey === 'moistureRanges') {
                                            const moistureRanges = getSafeRanges(item);

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
                                        if (dataKey === 'varietyId') {
                                            const varietyName = sortedData.varieties.find(v => v.id === item.varietyId)?.name || 'N/A';
                                            return <td key={`${item.id}-${dataKey}`}>{varietyName}</td>;
                                        }
                                    }
                                    if (listName === 'ricePricing' && dataKey === 'price') {
                                        return <td key={`${item.id}-${dataKey}`}>₱{item.price}</td>;
                                    }
                                    
                                    // 🎯 KEY FIX IS APPLIED HERE: Now dataKey is guaranteed to be a string (e.g., 'name', 'description')
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
                                    // 🎯 FIX: Access the nested 'range' property
                                    value={addForm.moistureRanges?.range || ''}
                                    onChange={(e) => setAddForm({
                                        ...addForm,
                                        moistureRanges: {
                                            ...addForm.moistureRanges,
                                            range: e.target.value
                                        }
                                    })}
                                    placeholder="Moisture Range (e.g., 14.0-16.0)"
                                    required
                                />
                                <input
                                    type="number"
                                    step="0.01"
                                    // 🎯 FIX: Access the nested 'price' property
                                    value={addForm.moistureRanges?.price || ''}
                                    onChange={(e) => setAddForm({
                                        ...addForm,
                                        moistureRanges: {
                                            ...addForm.moistureRanges,
                                            price: e.target.value
                                        }
                                    })}
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
                                {/* OLD: <select> for varietyId 
                                    NEW: We need a TEXT INPUT for the rice price name/variety name (as requested)
                                */}
                                <input
                                    type="text"
                                    value={addForm.name || ''}
                                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                                    placeholder="Rice Price Name/Variety (e.g., Regular Milled, P20)"
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
        case 'riceMills':
            return (
                <ListSection>
                    <ListForm onSubmit={(e) => handleAdd(e, activeList)}>
                        <input
                            type="text"
                            value={addForm.name || ''}
                            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                            placeholder={`Enter ${getSingularListName(activeList)} Name`}
                            required
                        />
                        <input type="text" value={addForm.owner || ''} onChange={(e) => setAddForm({ ...addForm, owner: e.target.value })} placeholder="Owner/Representative" />
                        <input type="text" value={addForm.address || ''} onChange={(e) => setAddForm({ ...addForm, address: e.target.value })} placeholder="Address" />
                        <input type="text" value={addForm.contactNumber || ''} onChange={(e) => setAddForm({ ...addForm, contactNumber: e.target.value })} placeholder="Contact Number" />
                        <button type="submit">Add</button>
                    </ListForm>
                    {renderTable(sortedData.riceMills, activeList, (item) => openEditModal(item, activeList), (item) => openDeleteModal(item, activeList))}
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
                            required
                        />
                        {activeList === 'warehouses' && (
                            <>
                                <select
                                    value={addForm.province || ''}
                                    onChange={(e) => setAddForm({ ...addForm, province: e.target.value })}
                                >
                                    <option value="">Select Province</option>
                                    {(sortedData.provinces || []).map((p, index) => (
                                        <option key={index} value={p.name}>{p.name}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    value={addForm.warehouseCode || ''}
                                    onChange={(e) => setAddForm({ ...addForm, warehouseCode: e.target.value })}
                                    placeholder="Enter Warehouse Code"
                                    required
                                />
                            </>
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
                <TabButton $active={activeList === 'riceMills'} onClick={() => setActiveList('riceMills')}>Ricemill Profiles</TabButton>
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
                                            name="moisture"
                                            value={editForm.moisture}
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
                            ) : listToEdit === 'riceMills' ? (
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
                                            name="owner"
                                            value={editForm.owner}
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
                            ) : listToEdit === 'palayPricing' ? (
                                <>
                                    <label>
                                        Variety
                                        <select
                                            name="varietyId"
                                            value={editForm.varietyId || ''}
                                            onChange={handleEditFormChange}
                                        >
                                            <option value="">Select Variety</option>
                                            {sortedData.varieties.filter(v => v.grainType === 'Palay').map(v => (
                                                <option key={v.id} value={v.id}>{v.name}</option>
                                            ))}
                                        </select>
                                    </label>
                                    {Array.isArray(editForm.moistureRanges) && editForm.moistureRanges.map((range, index) => (
                                        <div key={index}>
                                            <label>
                                                Moisture Range
                                                <input
                                                    type="text"
                                                    name={`moistureRanges[${index}].range`}
                                                    value={range.range}
                                                    onChange={handleEditFormChange}
                                                />
                                            </label>
                                            <label>
                                                Price (per kg)
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    name={`moistureRanges[${index}].price`}
                                                    value={range.price}
                                                    onChange={handleEditFormChange}
                                                />
                                            </label>
                                        </div>
                                    ))}
                                </>
                            ) : listToEdit === 'ricePricing' ? (
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
                                            {(sortedData.provinces || []).map((p, index) => (
                                                <option key={index} value={p.name}>{p.name}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label>
                                        Warehouse Code
                                        <input
                                            type="text"
                                            name="warehouseCode"
                                            value={editForm.warehouseCode || ''}
                                            onChange={handleEditFormChange}
                                        />
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