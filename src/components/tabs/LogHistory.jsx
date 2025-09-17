// This component displays a searchable and sortable history of log entries.
// It also provides functionality to edit and delete existing entries via modals.

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
// Custom hook to access the application's global data and functions.
import { useAppData } from '../../hooks/useAppData';
// This hook is imported but not used in this file. It might be a leftover from a previous version.
import { usePersistentState } from '../../hooks/usePersistentState';

// Helper function to format the date from YYYY-MM-DD to MM/DD/YY for display.
const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year.slice(2)}`;
};

const LogHistory = () => {
    // Destructure data and functions from the global application context.
    const { data, updateLogEntry, deleteLogEntry } = useAppData();

    // State for the search bar input.
    const [searchTerm, setSearchTerm] = useState('');
    // State to manage the sorting configuration (which column and direction).
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    
    // State to control the visibility of the edit and delete modals.
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    // State to hold the log entry that is currently being edited or deleted.
    const [selectedEntry, setSelectedEntry] = useState(null);

    // State for the form fields within the edit modal.
    const [editForm, setEditForm] = useState({
        date: '',
        province: '',
        warehouse: '',
        bags: '',
        netkgs: '',
        per50: '',
        variety: '',
        transaction_type: '',
        remarks: '',
    });

    // Sorts the data alphabetically for dropdown menus in the edit modal.
    const sortedProvinces = [...data.provinces].sort((a, b) => a.name.localeCompare(b.name));
    const sortedTransactionTypes = [...data.transactionTypes].sort((a, b) => a.name.localeCompare(b.name));
    const sortedVarieties = [...data.varieties].sort((a, b) => a.name.localeCompare(b.name));

    // This effect handles the logic for the edit modal's warehouse dropdown.
    // It ensures that if a user changes the province, the warehouse field is cleared if the previous selection is no longer valid.
    useEffect(() => {
        if (!isEditModalOpen) return; // Only run when the modal is open.

        // Check if the currently selected warehouse is valid for the selected province.
        const selectedWarehouseInList = data.warehouses.some(w => 
            w.province === editForm.province && w.name === editForm.warehouse
        );

        // If a warehouse is selected but it's not in the list for the current province, clear the warehouse field.
        if (editForm.warehouse && !selectedWarehouseInList) {
            setEditForm(prev => ({
                ...prev,
                warehouse: '',
            }));
        }
    }, [editForm.province, editForm.warehouse, isEditModalOpen, data.warehouses]);

    // Filters log entries based on the search term.
    const filteredEntries = data.logEntries.filter(entry => {
        // Search across all values in each entry object.
        return Object.values(entry).some(value =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    // Sorts the filtered entries based on the current sort configuration.
    const sortedEntries = [...filteredEntries].sort((a, b) => {
        if (!sortConfig.key) {
            return 0; // No key, no sorting.
        }
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        // Compare values to determine sort order.
        if (aValue < bValue) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0; // Values are equal.
    });

    // Handles a request to sort a column.
    const requestSort = (key) => {
        let direction = 'ascending';
        // If the same column is clicked again, reverse the direction.
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Returns the appropriate sort icon based on the current sort configuration.
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return '↕️'; // Default icon for unsorted columns.
        }
        return sortConfig.direction === 'ascending' ? '⬆️' : '⬇️'; // Icons for ascending/descending.
    };
    
    // Opens the edit modal and populates the form with the selected entry's data.
    const handleEditClick = (entry) => {
        setSelectedEntry(entry);
        setEditForm({
            date: entry.date,
            province: entry.province,
            warehouse: entry.warehouse,
            bags: entry.bags,
            netkgs: entry.netkgs,
            per50: entry.per50,
            variety: entry.variety,
            transaction_type: entry.transaction_type,
            remarks: entry.remarks,
        });
        setIsEditModalOpen(true);
    };

    // Opens the delete confirmation modal.
    const handleDeleteClick = (entry) => {
        setSelectedEntry(entry);
        setIsDeleteModalOpen(true);
    };

    // Handles the form submission for editing an entry.
    const handleEditSubmit = (e) => {
        e.preventDefault();
        if (selectedEntry) {
            // Recalculate 'per50' based on the new 'netkgs' value.
            const per50 = (parseFloat(editForm.netkgs) / 50).toFixed(3);
            const updatedEntry = {
                ...selectedEntry,
                ...editForm,
                per50, // Use the newly calculated per50.
            };
            updateLogEntry(updatedEntry); // Call the global update function.
            setIsEditModalOpen(false);
            setSelectedEntry(null);
        }
    };
    
    // Handles the confirmation of an entry deletion.
    const handleDeleteConfirm = () => {
        if (selectedEntry) {
            deleteLogEntry(selectedEntry); // Call the global delete function.
            setIsDeleteModalOpen(false);
            setSelectedEntry(null);
        }
    };

    // Handles changes to the form fields in the edit modal.
    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    // Filters the warehouses list for the edit modal based on the selected province.
    const filteredEditWarehouses = editForm.province 
        ? [...data.warehouses].filter(w => w.province === editForm.province).sort((a, b) => a.name.localeCompare(b.name))
        : [];

    return (
        <HistoryContainer>
            <HistoryHeader>Log History</HistoryHeader>
            <SearchContainer>
                <SearchInput
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </SearchContainer>
            
            <TableWrapper>
                <HistoryTable>
                    <thead>
                        <tr>
                            {/* Each TableHeader has a click handler to trigger sorting */}
                            {/* FIX #1: Added two spans with CSS to guarantee spacing and prevent overlap. */}
                            <TableHeader onClick={() => requestSort('date')}><span>Date</span><SortIcon>{getSortIcon('date')}</SortIcon></TableHeader>
                            <TableHeader onClick={() => requestSort('province')}><span>Province</span><SortIcon>{getSortIcon('province')}</SortIcon></TableHeader>
                            <TableHeader onClick={() => requestSort('warehouse')}><span>Warehouse</span><SortIcon>{getSortIcon('warehouse')}</SortIcon></TableHeader>
                            <TableHeader onClick={() => requestSort('bags')}><span>Bags</span><SortIcon>{getSortIcon('bags')}</SortIcon></TableHeader>
                            <TableHeader onClick={() => requestSort('netkgs')}><span>Net Kgs</span><SortIcon>{getSortIcon('netkgs')}</SortIcon></TableHeader>
                            <TableHeader onClick={() => requestSort('per50')}><span>Per 50</span><SortIcon>{getSortIcon('per50')}</SortIcon></TableHeader>
                            <TableHeader onClick={() => requestSort('variety')}><span>Variety</span><SortIcon>{getSortIcon('variety')}</SortIcon></TableHeader>
                            <TableHeader onClick={() => requestSort('transaction_type')}><span>Type</span><SortIcon>{getSortIcon('transaction_type')}</SortIcon></TableHeader>
                            <TableHeader>Remarks</TableHeader>
                            <TableHeader $actionHeader>Actions</TableHeader>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedEntries.length > 0 ? (
                            sortedEntries.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell>{formatDate(entry.date)}</TableCell>
                                    <TableCell>{entry.province}</TableCell>
                                    <TableCell>{entry.warehouse}</TableCell>
                                    <TableCell>{entry.bags}</TableCell>
                                    <TableCell>{entry.netkgs}</TableCell>
                                    <TableCell>{entry.per50}</TableCell>
                                    <TableCell>{entry.variety}</TableCell>
                                    <TableCell>{entry.transaction_type}</TableCell>
                                    <TableCell $remarksCell>{entry.remarks}</TableCell>
                                    <TableCell $actionsCell>
                                        <ActionButton onClick={() => handleEditClick(entry)}>✏️</ActionButton>
                                        <DeleteButton onClick={() => handleDeleteClick(entry)}>🗑️</DeleteButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            // Display a message when no entries match the search/filters.
                            <TableRow>
                                <TableCell colSpan="10" style={{ textAlign: 'center' }}>No matching entries found.</TableCell>
                            </TableRow>
                        )}
                    </tbody>
                </HistoryTable>
            </TableWrapper>

            {/* Reusable Modal Components */}
            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
                <ModalHeader>Edit Log Entry</ModalHeader>
                <Form onSubmit={handleEditSubmit}>
                    <FormRow>
                        <label htmlFor="edit-date">Date:</label>
                        <Input type="date" id="edit-date" name="date" value={editForm.date} onChange={handleEditFormChange} required />
                    </FormRow>
                    <FormRow>
                        <label htmlFor="edit-province">Province:</label>
                        <Select id="edit-province" name="province" value={editForm.province} onChange={handleEditFormChange} required>
                            <option value="">Select Province</option>
                            {/* FIX #2: Sorted provinces alphabetically */}
                            {sortedProvinces.map((p, index) => (
                                <option key={index} value={p.name}>{p.name}</option>
                            ))}
                        </Select>
                    </FormRow>
                    <FormRow>
                        <label htmlFor="edit-warehouse">Warehouse:</label>
                        <Select id="edit-warehouse" name="warehouse" value={editForm.warehouse} onChange={handleEditFormChange} disabled={!editForm.province} required>
                            <option value="">Select Warehouse</option>
                            {/* FIX #2: Sorted filtered warehouses alphabetically */}
                            {filteredEditWarehouses.map((w, index) => (
                                <option key={index} value={w.name}>{w.name}</option>
                            ))}
                        </Select>
                    </FormRow>
                    <FormRow>
                        <label htmlFor="edit-transaction_type">Transaction Type:</label>
                        <Select id="edit-transaction_type" name="transaction_type" value={editForm.transaction_type} onChange={handleEditFormChange} required>
                            <option value="">Select Type</option>
                            {/* FIX #2: Sorted transaction types alphabetically */}
                            {sortedTransactionTypes.map((t, index) => (
                                <option key={index} value={t.name}>{t.name}</option>
                            ))}
                        </Select>
                    </FormRow>
                    <FormRow>
                        <label htmlFor="edit-variety">Variety:</label>
                        <Select id="edit-variety" name="variety" value={editForm.variety} onChange={handleEditFormChange} required>
                            <option value="">Select Variety</option>
                            {/* FIX #2: Sorted varieties alphabetically */}
                            {sortedVarieties.map((v, index) => (
                                <option key={index} value={v.name}>{v.name}</option>
                            ))}
                        </Select>
                    </FormRow>
                    <FormRow>
                        <label htmlFor="edit-bags">Bags:</label>
                        <Input type="number" step="0.001" id="edit-bags" name="bags" value={editForm.bags} onChange={handleEditFormChange} required/>
                    </FormRow>
                    <FormRow>
                        <label htmlFor="edit-netkgs">Net Kgs:</label>
                        <Input type="number" step="0.001" id="edit-netkgs" name="netkgs" value={editForm.netkgs} onChange={handleEditFormChange} required/>
                    </FormRow>
                    <FormRow>
                        <label htmlFor="edit-per50">Per 50:</label>
                        <Input type="text" id="edit-per50" name="per50" value={(parseFloat(editForm.netkgs) / 50).toFixed(3)} readOnly disabled />
                    </FormRow>
                    <FormRow $fullWidth>
                        <label htmlFor="edit-remarks">Remarks:</label>
                        <TextArea id="edit-remarks" name="remarks" value={editForm.remarks} onChange={handleEditFormChange} />
                    </FormRow>
                    <FormActions>
                        <ActionButton type="submit">Save Changes</ActionButton>
                        <CancelButton onClick={() => setIsEditModalOpen(false)}>Cancel</CancelButton>
                    </FormActions>
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <ModalHeader>Confirm Deletion</ModalHeader>
                <p>Are you sure you want to delete this entry?</p>
                <FormActions>
                    <DeleteButton onClick={handleDeleteConfirm}>Delete</DeleteButton>
                    <CancelButton onClick={() => setIsDeleteModalOpen(false)}>Cancel</CancelButton>
                </FormActions>
            </Modal>
        </HistoryContainer>
    );
};

export default LogHistory;

// Reusable Modal Component
// This component provides a flexible, reusable way to display modal windows.
const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null; // Don't render if the modal is closed.
    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                {children}
            </ModalContent>
        </ModalOverlay>
    );
};

// --- Styled Components ---
const HistoryContainer = styled.div`
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    overflow: hidden;
`;

const HistoryHeader = styled.h2`
    text-align: center;
    color: #2c3e50;
    margin-bottom: 20px;
`;

const SearchContainer = styled.div`
    margin-bottom: 20px;
`;

const SearchInput = styled.input`
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1em;
    box-sizing: border-box;
    transition: all 0.2s ease-in-out;
    &:focus {
        outline: none;
        border-color: #3498db;
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.5);
    }
`;

const TableWrapper = styled.div`
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
`;

const HistoryTable = styled.table`
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9em;
    table-layout: fixed;
`;

// FIX #1: This CSS ensures the text and icon stay together and have space, without breaking the table layout.
const TableHeader = styled.th`
    background-color: #f0f0f0;
    color: #333;
    padding: 12px;
    text-align: left;
    cursor: pointer;
    white-space: nowrap; /* Keeps content on a single line */
    user-select: none;
    transition: background-color 0.3s ease;

    span {
        display: inline-block;
    }

    &:hover {
        background-color: #e6e6e6;
    }
    
    ${({ $actionHeader }) => $actionHeader && `
        width: 100px;
    `}
`;

// FIX #1: A dedicated component for the icon to guarantee a fixed space.
const SortIcon = styled.span`
    margin-left: 5px;
    display: inline-block;
`;

const TableRow = styled.tr`
    border-bottom: 1px solid #ddd;
    &:nth-child(even) {
        background-color: #f9f9f9;
    }
    transition: background-color 0.3s ease;
    &:hover {
        background-color: #f0f8ff;
    }
`;

const TableCell = styled.td`
    padding: 12px;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    
    ${({ $remarksCell }) => $remarksCell && `
        white-space: normal;
        overflow: visible;
        text-overflow: clip;
    `}
    
    ${({ $actionsCell }) => $actionsCell && `
        display: flex;
        gap: 5px;
    `}
`;

const ActionButton = styled.button`
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 5px 10px;
    cursor: pointer;
    font-size: 0.8em;
    transition: background-color 0.3s ease, transform 0.1s ease;
    
    &:hover {
        background-color: #2980b9;
        transform: translateY(-1px);
    }
    
    &:active {
        transform: translateY(1px);
    }
`;

const DeleteButton = styled(ActionButton)`
    background-color: #e74c3c;
    &:hover {
        background-color: #c0392b;
    }
`;

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s forwards;
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

const ModalContent = styled.div`
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    min-width: 300px;
    max-width: 600px;
    width: 90%;
    animation: slideIn 0.3s forwards;
    
    @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;

const ModalHeader = styled.h3`
    margin-top: 0;
    margin-bottom: 20px;
    text-align: center;
`;

const Form = styled.form`
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
`;

const FormRow = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1 1 calc(50% - 7.5px);
    
    ${({ $fullWidth }) => $fullWidth && `
        flex: 1 1 100%;
    `}
    
    label {
        font-weight: bold;
        margin-bottom: 5px;
    }
`;

const Input = styled.input`
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    transition: all 0.2s ease-in-out;
    
    &:focus {
        outline: none;
        border-color: #3498db;
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.5);
    }
`;

const Select = styled.select`
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1em;
    background-color: #fff;
    cursor: pointer;
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

const TextArea = styled.textarea`
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    min-height: 80px;
    transition: all 0.2s ease-in-out;
    
    &:focus {
        outline: none;
        border-color: #3498db;
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.5);
    }
`;

const FormActions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    width: 100%;
    margin-top: 20px;
`;

const CancelButton = styled(ActionButton)`
    background-color: #95a5a6;
    &:hover {
        background-color: #7f8c8d;
    }
`;