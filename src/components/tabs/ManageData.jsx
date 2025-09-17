// This component provides an interface to manage the application's core data lists (provinces, warehouses, etc.).
// It uses a tabbed layout with modals for adding, editing, and deleting items.

import React, { useState } from 'react';
import styled from 'styled-components';
// useAppData provides access to the global data state and the function to update it.
import { useAppData } from '../../hooks/useAppData';

const ManageData = () => {
    // Destructure global data and the update function from the application context.
    const { data, updateAppData } = useAppData();
    // State to control which tab is currently active. Defaults to 'provinces'.
    const [activeList, setActiveList] = useState('provinces');

    // State for controlling the edit modal's visibility and data.
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', province: '' });
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
    const [addForm, setAddForm] = useState({ name: '', province: '' });

    // A mapping object to easily access the correct data array from the global state.
    const listDataKeys = {
        provinces: 'provinces',
        warehouses: 'warehouses',
        transactionTypes: 'transactionTypes',
        varieties: 'varieties',
    };
    
    // Helper function to get the singular name for dynamic text (e.g., "Add Province").
    const getSingularListName = (listName) => {
        if (listName === 'provinces') return 'Province';
        if (listName === 'warehouses') return 'Warehouse';
        if (listName === 'transactionTypes') return 'Transaction Type';
        if (listName === 'varieties') return 'Variety';
        return '';
    };

    // --- Modal Functions ---
    // Opens the edit modal and populates the form with the selected item's data.
    const openEditModal = (item, listName) => {
        // Ensure province is only set if it exists on the item.
        setEditForm({ name: item.name, province: item.province || '' });
        setOriginalItem(item);
        setListToEdit(listName);
        setIsEditModalOpen(true);
    };

    // Closes the edit modal and resets all related state.
    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditForm({ name: '', province: '' });
        setOriginalItem(null);
        setListToEdit('');
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
    // Handles adding a new item to the active list.
    const handleAdd = (e, listName) => {
        e.preventDefault();
        const newItemName = addForm.name.trim();
        if (!newItemName) return; // Don't add if the name is empty.

        const dataKey = listDataKeys[listName];
        let updatedList;
        if (listName === 'warehouses') {
            // Warehouses require a province to be selected.
            if (!addForm.province) {
                alert('Please select a province for the warehouse.');
                return;
            }
            updatedList = [...data[dataKey], { name: newItemName, province: addForm.province }];
        } else {
            // Other lists just need a name.
            updatedList = [...data[dataKey], { name: newItemName }];
        }

        // Update the global state with the new list.
        updateAppData({ [dataKey]: updatedList });
        // Reset the add form for the next entry.
        setAddForm({ name: '', province: '' });
    };

    // Confirms and performs the deletion of an item.
    const confirmDelete = () => {
        const dataKey = listDataKeys[listToDeleteFrom];
        // Create a new list by filtering out the item to be deleted.
        const updatedList = data[dataKey].filter(item => item.name !== itemToDelete.name);
        // Update the global state.
        updateAppData({ [dataKey]: updatedList });
        closeDeleteModal();
    };

    // Updates an existing item with the new form data.
    const handleUpdate = () => {
        const dataKey = listDataKeys[listToEdit];
        // Map over the list to find the original item and replace it with the updated version.
        const updatedList = data[dataKey].map(item =>
            item.name === originalItem.name ? { ...item, name: editForm.name, province: editForm.province } : item
        );
        // Update the global state.
        updateAppData({ [dataKey]: updatedList });
        closeEditModal();
    };

    // A render function that dynamically displays the content for the active tab.
    const renderListContent = () => {
        // Sort the data arrays before rendering to ensure a consistent, alphabetical order.
        const sortedData = {
            provinces: [...data.provinces].sort((a, b) => a.name.localeCompare(b.name)),
            warehouses: [...data.warehouses].sort((a, b) => a.name.localeCompare(b.name)),
            transactionTypes: [...data.transactionTypes].sort((a, b) => a.name.localeCompare(b.name)),
            varieties: [...data.varieties].sort((a, b) => a.name.localeCompare(b.name)),
        };

        const lists = {
            provinces: { title: 'Provinces', data: sortedData.provinces },
            warehouses: { title: 'Warehouses', data: sortedData.warehouses },
            transactionTypes: { title: 'Transaction Types', data: sortedData.transactionTypes },
            varieties: { title: 'Varieties', data: sortedData.varieties }
        };

        const currentList = lists[activeList];

        return (
            <ListSection>
                {/* Form for adding a new item */}
                <ListForm onSubmit={(e) => handleAdd(e, activeList)}>
                    <input
                        type="text"
                        value={addForm.name}
                        onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                        placeholder={`Enter ${getSingularListName(activeList)} Name`}
                    />
                    {/* Conditionally render the province dropdown for warehouses */}
                    {activeList === 'warehouses' && (
                        <select
                            value={addForm.province}
                            onChange={(e) => setAddForm({ ...addForm, province: e.target.value })}
                        >
                            <option value="">Select Province</option>
                            {/* Use sorted provinces for the add form dropdown */}
                            {sortedData.provinces.map((province, index) => (
                                <option key={index} value={province.name}>{province.name}</option>
                            ))}
                        </select>
                    )}
                    <button type="submit">Add</button>
                </ListForm>
                {/* Table to display the list of items */}
                <DataTable>
                    <thead>
                        <tr>
                            <th>{currentList.title}</th>
                            {/* Conditionally render the Province header for warehouses */}
                            {activeList === 'warehouses' && <th>Province</th>}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentList.data.length > 0 ? (
                            currentList.data.map((item, index) => (
                                <DataRow key={index}>
                                    <td>{item.name}</td>
                                    {/* Conditionally render the province name */}
                                    {activeList === 'warehouses' && <td>{item.province}</td>}
                                    <td>
                                        <ActionButton onClick={() => openEditModal(item, activeList)}>Edit</ActionButton>
                                        <ActionButton $delete onClick={() => openDeleteModal(item, activeList)}>Delete</ActionButton>
                                    </td>
                                </DataRow>
                            ))
                        ) : (
                            // Placeholder message when the list is empty.
                            <DataRow>
                                <td colSpan={activeList === 'warehouses' ? 3 : 2}>
                                    <Placeholder>No {currentList.title.toLowerCase()} found.</Placeholder>
                                </td>
                            </DataRow>
                        )}
                    </tbody>
                </DataTable>
            </ListSection>
        );
    };

    return (
        <ManageContainer>
            <Header>Manage Data</Header>
            {/* Tab navigation for switching between lists */}
            <TabNavigation>
                <TabButton $active={activeList === 'provinces'} onClick={() => setActiveList('provinces')}>Provinces</TabButton>
                <TabButton $active={activeList === 'warehouses'} onClick={() => setActiveList('warehouses')}>Warehouses</TabButton>
                <TabButton $active={activeList === 'transactionTypes'} onClick={() => setActiveList('transactionTypes')}>Transaction Types</TabButton>
                <TabButton $active={activeList === 'varieties'} onClick={() => setActiveList('varieties')}>Varieties</TabButton>
            </TabNavigation>
            <ContentWrapper>
                {/* Render the content of the active list */}
                {renderListContent()}
            </ContentWrapper>

            {/* Edit Modal (conditionally rendered) */}
            {isEditModalOpen && (
                <ModalOverlay>
                    <ModalContent>
                        <ModalHeader>Edit {getSingularListName(listToEdit)}</ModalHeader>
                        <ModalForm onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
                            <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                placeholder="Enter Name"
                            />
                            {/* Conditionally render the province dropdown for editing warehouses */}
                            {listToEdit === 'warehouses' && (
                                <select
                                    value={editForm.province}
                                    onChange={(e) => setEditForm({ ...editForm, province: e.target.value })}
                                >
                                    <option value="">Select Province</option>
                                    {/* Use sorted provinces for the edit modal dropdown */}
                                    {data.provinces.sort((a,b) => a.name.localeCompare(b.name)).map((province, index) => (
                                        <option key={index} value={province.name}>{province.name}</option>
                                    ))}
                                </select>
                            )}
                            <ButtonContainer>
                                <ModalButton type="submit">Save</ModalButton>
                                <ModalButton $cancel type="button" onClick={closeEditModal}>Cancel</ModalButton>
                            </ButtonContainer>
                        </ModalForm>
                    </ModalContent>
                </ModalOverlay>
            )}

            {/* Delete Modal (conditionally rendered) */}
            {isDeleteModalOpen && (
                <ModalOverlay>
                    <ModalContent>
                        <ModalHeader>Confirm Deletion</ModalHeader>
                        <DeleteMessage>
                            Are you sure you want to delete **"{itemToDelete.name}"**? This action cannot be undone.
                        </DeleteMessage>
                        <ButtonContainer>
                            <ModalButton $cancel onClick={closeDeleteModal}>Cancel</ModalButton>
                            <ModalButton onClick={confirmDelete}>Delete</ModalButton>
                        </ButtonContainer>
                    </ModalContent>
                </ModalOverlay>
            )}
        </ManageContainer>
    );
};

export default ManageData;

// Styled Components
const ManageContainer = styled.div`
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
`;

const Header = styled.h2`
    text-align: center;
    color: #2c3e50;
    margin-bottom: 20px;
`;

const TabNavigation = styled.nav`
    display: flex;
    justify-content: space-around;
    background-color: #eef1f5;
    border-bottom: 1px solid #ddd;
    border-radius: 5px 5px 0 0;
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
    transition: all 0.3s ease;
    border-bottom: 2px solid transparent;

    &:hover {
        color: #000;
    }
    
    ${({ $active }) => $active && `
        background-color: #fff;
        color: #2c3e50;
        border-bottom: 2px solid #3498db;
    `}
`;

const ContentWrapper = styled.div`
    padding: 20px;
    background-color: #fff;
    border-radius: 0 0 8px 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: box-shadow 0.3s ease;
`;

const ListSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const ListForm = styled.form`
    display: flex;
    gap: 10px;
    
    input, select {
        flex-grow: 1;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1em;
        transition: box-shadow 0.3s ease;
        
        &:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.5);
        }
    }
    
    button {
        padding: 10px 15px;
        background-color: #3498db;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1em;
        font-weight: bold;
        transition: background-color 0.3s ease, transform 0.2s ease;
        
        &:hover {
            background-color: #2980b9;
            transform: translateY(-2px);
        }
    }
`;

const DataTable = styled.table`
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
    
    th, td {
        border: 1px solid #ddd;
        padding: 12px;
        text-align: left;
    }
    
    th {
        background-color: #f2f2f2;
        font-weight: bold;
    }
`;

const DataRow = styled.tr`
    &:nth-child(even) {
        background-color: #f9f9f9;
    }
`;

const ActionButton = styled.button`
    padding: 6px 10px;
    margin-right: 5px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    background-color: ${({ $delete }) => $delete ? '#e74c3c' : '#f39c12'};
    color: white;
    transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease;
    
    &:hover {
        background-color: ${({ $delete }) => $delete ? '#c0392b' : '#e67e22'};
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
`;

const Placeholder = styled.div`
    text-align: center;
    padding: 50px;
    color: #999;
    font-size: 1.2em;
    font-style: italic;
`;

// --- Modal Styles ---
const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;

const ModalContent = styled.div`
    background-color: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 500px;
`;

const ModalHeader = styled.h3`
    margin-top: 0;
    margin-bottom: 20px;
    color: #2c3e50;
    text-align: center;
`;

const ModalForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 15px;

    input, select {
        flex-grow: 1;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1em;
        transition: box-shadow 0.3s ease;
        
        &:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.5);
        }
    }
`;

const ButtonContainer = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
`;

const ModalButton = styled.button`
    padding: 10px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    background-color: ${({ $cancel }) => $cancel ? '#95a5a6' : '#e74c3c'};
    color: white;
    transition: background-color 0.3s ease, transform 0.2s ease;
    
    &:hover {
        background-color: ${({ $cancel }) => $cancel ? '#7f8c8d' : '#c0392b'};
        transform: translateY(-2px);
    }
`;

const DeleteMessage = styled.p`
    margin-bottom: 20px;
    text-align: center;
    font-size: 1.1em;
    color: #555;
`;