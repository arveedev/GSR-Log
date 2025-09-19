import React, { useState } from 'react';
import styled from 'styled-components';
import { useAppData } from '../../context/AppDataContext';
import { v4 as uuidv4 } from 'uuid';

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
    const { data, updateAppData } = useAppData();
    // State to control which tab is currently active.
    const [activeList, setActiveList] = useState('ricemills');

    // State for controlling the edit modal's visibility and data.
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({ 
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
        contactNumber: '' 
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
        range: '', 
        enwf: '', 
        ownerRepresentative: '', 
        address: '', 
        contactNumber: '' 
    });

    // A mapping object to easily access the correct data array from the global state.
    const listDataKeys = {
        provinces: 'provinces',
        warehouses: 'warehouses',
        transactionTypes: 'transactionTypes',
        varieties: 'varieties',
        mtsTypes: 'mtsTypes',
        sdoList: 'sdoList',
        pricing: 'pricing',
        enwfRanges: 'enwfRanges',
        ricemills: 'ricemills', 
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
            case 'pricing': return 'Pricing Item';
            case 'enwfRanges': return 'ENWF Range';
            case 'ricemills': return 'Ricemill'; 
            default: return '';
        }
    };

    // --- Modal Functions ---
// Opens the edit modal and populates the form with the selected item's data.
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
        case 'pricing':
            newEditForm = { type: item.type || '', price: item.price !== undefined ? item.price : '' };
            break;
        case 'enwfRanges':
            newEditForm = { range: item.range || '', enwf: item.enwf !== undefined ? item.enwf : '' };
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

    // Closes the edit modal and resets all related state.
    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditForm({ name: '', province: '', grainType: '', weight: '', type: '', price: '', range: '', enwf: '', moisture: '', ownerRepresentative: '', address: '', contactNumber: '' });
        setOriginalItem(null);
        setListToEdit('');
    };

    // Handles changes to the edit form inputs.
    const handleEditFormChange = (e) => {
    const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };


    // Opens the delete modal and sets the item and list to be deleted.
    const openDeleteModal = (item, listName) => {
        setItemToDelete(item);
        setListToDeleteFrom(listName);
        setIsDeleteModalOpen(true);
    };

    // Closes the delete modal and resets all related state.
    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        setListToDeleteFrom('');
    };

    // --- CRUD Functions ---
const handleAdd = (e, listName) => {
    e.preventDefault();
    const dataKey = listDataKeys[listName];
    let updatedList;

    if (listName === 'ricemills') {
        const { name, ownerRepresentative, address, contactNumber } = addForm;
        if (!name || !ownerRepresentative || !address || !contactNumber) {
            alert('Please fill out all ricemill fields.');
            return;
        }
        if (data.ricemills.some(rm => rm.name.toLowerCase() === name.toLowerCase())) {
            alert('A ricemill with this name already exists.');
            return;
        }
        updatedList = [...data.ricemills, { id: generateUniqueId(), name, ownerRepresentative, address, contactNumber }];
    } else if (listName === 'pricing') {
        const trimmedGrainType = addForm.grainType.trim();
        const parsedPrice = parseFloat(addForm.price);
        if (!trimmedGrainType || isNaN(parsedPrice)) {
            alert('Please enter a valid grain type and price.');
            return;
        }
        if (data.pricing[trimmedGrainType]) {
            alert('A price for this grain type already exists. Please edit the existing entry instead.');
            setAddForm({ ...addForm, price: '' });
            return;
        }
        updatedList = { ...data[dataKey], [trimmedGrainType]: parsedPrice };
    } else if (listName === 'varieties') {
        const trimmedName = addForm.name.trim();
        if (!trimmedName || !addForm.grainType) {
            alert('Please enter a name and select a grain type.');
            return;
        }
        updatedList = [...data[dataKey], { name: trimmedName, grainType: addForm.grainType }];
    } else if (listName === 'mtsTypes') {
        const trimmedName = addForm.name.trim();
        const parsedWeight = parseFloat(addForm.weight);
        if (!trimmedName || isNaN(parsedWeight) || !addForm.grainType) {
            alert('Please enter a valid name, weight, and grain type.');
            return;
        }
        updatedList = [...data[dataKey], { name: trimmedName, weight: parsedWeight, grainType: addForm.grainType }];
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
        updatedList = [...data[dataKey], newItem];
    } else if (listName === 'enwfRanges') {
        if (!addForm.range.trim() || addForm.enwf === '' || isNaN(parseFloat(addForm.enwf))) {
            alert('Please enter a valid range and ENWF multiplier.');
            return;
        }
        updatedList = [...data[dataKey], { range: addForm.range.trim(), enwf: parseFloat(addForm.enwf) }];
    } else { // Default case for simple lists (provinces, transactionTypes)
        if (!addForm.name.trim()) {
            alert('Please enter a valid name.');
            return;
        }
        // ✅ FIX: The old code only added a name. It has been updated to correctly create a new object with both the "id" and "name" properties.
        const newItem = {
            id: uuidv4(),
            name: addForm.name.trim()
        };
        updatedList = [...data[dataKey], newItem];
    }

    updateAppData({ [dataKey]: updatedList });
    setAddForm({ name: '', province: '', grainType: '', weight: '', type: '', price: '', range: '', enwf: '', ownerRepresentative: '', address: '', contactNumber: '' });
};


    const handleUpdate = () => {
        const dataKey = listDataKeys[listToEdit] || listToEdit;
        let updatedList;
        
        // ✅ FIX: The variables were named incorrectly.
        // The editForm state has keys 'name', 'ownerRepresentative', etc., not 'editedName'.
        if (listToEdit === 'ricemills') {
            const { name, ownerRepresentative, address, contactNumber } = editForm;
            const updatedRicemill = {
                // ✅ Use the original item's ID to keep it unique
                id: originalItem.id, 
                name,
                ownerRepresentative,
                address,
                contactNumber
            };
            updatedList = data.ricemills.map(rm => 
                // ✅ Use a stable ID for comparison, not the name, which can change.
                rm.id === originalItem.id ? updatedRicemill : rm
            );
        } else if (listToEdit === 'pricing') {
            if (!editForm.type.trim() || isNaN(parseFloat(editForm.price))) {
                alert('Please enter a valid grain type and price.');
                return;
            }
            const newPricing = { ...data.pricing };
            if (editForm.type.trim() !== originalItem.type) {
                delete newPricing[originalItem.type];
            }
            newPricing[editForm.type.trim()] = parseFloat(editForm.price);
            updatedList = newPricing;
        } else {
            updatedList = data[dataKey].map(item => {
                const isMatch = (listToEdit === 'enwfRanges' && item.range === originalItem.range) ||
                    (listToEdit !== 'enwfRanges' && item.name === originalItem.name);

                if (isMatch) {
                    switch (listToEdit) {
                        case 'varieties':
                            return { ...item, name: editForm.name.trim(), grainType: editForm.grainType.trim() };
                        case 'mtsTypes':
                            const parsedWeight = parseFloat(editForm.weight);
                            return { ...item, name: editForm.name.trim(), weight: parsedWeight, grainType: editForm.grainType.trim() };
                        case 'warehouses':
                            return { ...item, name: editForm.name.trim(), province: editForm.province.trim() };
                        case 'sdoList':
                            return { ...item, name: editForm.name.trim(), province: editForm.province.trim() };
                        case 'enwfRanges':
                            const parsedEnwf = parseFloat(editForm.enwf);
                            return { ...item, range: editForm.range.trim(), enwf: parsedEnwf };
                        default:
                            return { ...item, name: editForm.name.trim() };
                    }
                }
                return item;
            });
        }
        
        updateAppData({ [dataKey]: updatedList });
        closeEditModal();
    };
    
    const confirmDelete = () => {
        const dataKey = listDataKeys[listToDeleteFrom] || listToDeleteFrom;
        
        if (dataKey === 'ricemills') {
            // ✅ FIX: Use the unique ID to filter the ricemill.
            const updatedRicemills = data.ricemills.filter(rm => rm.id !== itemToDelete.id);
            updateAppData({ [dataKey]: updatedRicemills }); 
        } else if (dataKey === 'pricing') {
            const updatedPricing = { ...data.pricing };
            delete updatedPricing[itemToDelete.type];
            updateAppData({ [dataKey]: updatedPricing }); 
        } else {
            const updatedList = data[dataKey].filter(item => {
                let isMatch = false;
                switch (listToDeleteFrom) {
                    case 'enwfRanges':
                        isMatch = item.range === itemToDelete.range;
                        break;
                    case 'pricing':
                        isMatch = item.type === itemToDelete.type;
                        break;
                    default:
                        isMatch = item.name === itemToDelete.name;
                        break;
                }
                return !isMatch;
            });
            updateAppData({ [dataKey]: updatedList });
        }
    
        closeDeleteModal();
    };

    // This function renders the content based on the active tab
    const renderListContent = () => {
    // A mapping from display names to data keys for each list.
    // This makes the renderTable function generic and reusable.
    const columnMaps = {
        provinces: {
            'Name': 'name',
        },
        warehouses: {
            'Name': 'name',
            'Province': 'province',
        },
        transactionTypes: {
            'Name': 'name',
        },
        varieties: {
            'Variety Name': 'name',
            'Grain Type': 'grainType',
        },
        mtsTypes: {
            'MTS Name': 'name',
            'Weight': 'weight',
            'Grain Type': 'grainType',
        },
        ricemills: {
            'Ricemill Name': 'name',
            'Owner/Representative': 'ownerRepresentative',
            'Address': 'address',
            'Contact Number': 'contactNumber',
        },
        sdoList: {
            'Name': 'name',
            'Province': 'province',
        },
        pricing: {
            'Grain Type': 'type',
            'Price (per kg)': 'price',
        },
        enwfRanges: {
            'Moisture Content Range': 'moisture',
            'ENWF Multiplier': 'enwf',
        },
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
        enwfRanges: [...(data.enwfRanges || [])].sort((a, b) => parseFloat(a.range) - parseFloat(b.range)),
    };

    // The renderTable function now gets columns directly from the columnMaps.
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
                                // FIX: Use a composite key to ensure uniqueness for each <td>.
                                // This combines the unique item ID with the column key.
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
        case 'ricemills':
            return (
                <ListSection>
                    <ListForm onSubmit={(e) => handleAdd(e, 'ricemills')}>
                        <input
                            type="text"
                            value={addForm.name}
                            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                            placeholder="Ricemill Name"
                        />
                        <input
                            type="text"
                            value={addForm.ownerRepresentative}
                            onChange={(e) => setAddForm({ ...addForm, ownerRepresentative: e.target.value })}
                            placeholder="Owner/Representative"
                        />
                        <input
                            type="text"
                            value={addForm.address}
                            onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                            placeholder="Address"
                        />
                        <input
                            type="tel"
                            value={addForm.contactNumber}
                            onChange={(e) => setAddForm({ ...addForm, contactNumber: e.target.value })}
                            placeholder="Contact Number"
                        />
                        <button type="submit">Add Ricemill</button>
                    </ListForm>
                    {renderTable(
                        sortedData.ricemills,
                        'ricemills',
                        (item) => openEditModal(item, 'ricemills'),
                        (item) => openDeleteModal(item, 'ricemills')
                    )}
                </ListSection>
            );
        case 'sdoList':
            const groupedSdos = groupSdosByProvince();
            return (
                <ListSection>
                    <ListForm onSubmit={(e) => handleAdd(e, 'sdoList')}>
                        <input
                            type="text"
                            value={addForm.name}
                            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                            placeholder="Enter SDO Name"
                        />
                        <select
                            value={addForm.province}
                            onChange={(e) => setAddForm({ ...addForm, province: e.target.value })}
                        >
                            <option value="">Select Province</option>
                            {sortedData.provinces.map((province, index) => (
                                <option key={index} value={province.name}>{province.name}</option>
                            ))}
                        </select>
                        <button type="submit">Add</button>
                    </ListForm>
                    {Object.keys(groupedSdos).sort().map(province => (
                        <div key={province}>
                            <ProvinceHeader>{province}</ProvinceHeader>
                            {renderTable(groupedSdos[province], 'sdoList', (item) => openEditModal(item, 'sdoList'), (item) => openDeleteModal(item, 'sdoList'))}
                        </div>
                    ))}
                </ListSection>
            );
        case 'pricing':
            // The pricing data from the CSV is an object, so we convert it to an array of objects
            // with a unique 'id' for React to track correctly.
            const pricingList = Object.keys(data.pricing || {}).map(type => ({ type, price: data.pricing[type], id: type }));
            return (
                <ListSection>
                    <ListForm onSubmit={(e) => handleAdd(e, 'pricing')}>
                        <select
                            name="grainType"
                            value={addForm.grainType}
                            onChange={(e) => setAddForm({ ...addForm, grainType: e.target.value })}
                            required
                        >
                            <option value="">Select Grain Type</option>
                            {data.grainTypes.map(gt => (
                                <option key={gt} value={gt}>{gt}</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            step="0.01"
                            value={addForm.price}
                            onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                            placeholder="Enter Price (per kg)"
                        />
                        <button type="submit">Add</button>
                    </ListForm>
                    {renderTable(pricingList, 'pricing', (item) => openEditModal(item, 'pricing'), (item) => openDeleteModal(item, 'pricing'))}
                </ListSection>
            );
        case 'enwfRanges':
            return (
                <ListSection>
                    <ListForm onSubmit={(e) => handleAdd(e, 'enwfRanges')}>
                        <input
                            type="text"
                            value={addForm.range}
                            onChange={(e) => setAddForm({ ...addForm, range: e.target.value })}
                            placeholder="Enter Range (e.g., 22.0-22.9)"
                        />
                        <input
                            type="number"
                            step="0.01"
                            value={addForm.enwf}
                            onChange={(e) => setAddForm({ ...addForm, enwf: e.target.value })}
                            placeholder="Enter Multiplier (e.g., 0.96)"
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
                            value={addForm.name}
                            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                            placeholder={`Enter ${getSingularListName(activeList)} Name`}
                        />
                        {activeList === 'warehouses' && (
                            <select
                                value={addForm.province}
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
                                    value={addForm.grainType}
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
                                        value={addForm.weight}
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
}; // End of renderListContent function

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
                            Grain Type
                            <input
                                type="text"
                                name="type"
                                value={editForm.type}
                                onChange={handleEditFormChange}
                                disabled
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
                    // Default case for simple lists (e.g., provinces, transactionTypes)
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