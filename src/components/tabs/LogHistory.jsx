import React, { useState, useEffect } from 'react';
import { useAppData } from '../../hooks/useAppData';
import styled from 'styled-components';

// Helper function to format the date from YYYY-MM-DD to MM/DD/YY for display.
const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year.slice(2)}`;
};

// NEW HELPER FUNCTION: Formats a number with comma separators.
const formatNumberWithCommas = (number) => {
    if (number === null || number === undefined || number === '') {
        return '';
    }
    // Using a try-catch block to handle cases where the input is not a valid number.
    try {
        // parseFloat is used to ensure the value is treated as a number.
        return parseFloat(number).toLocaleString('en-US');
    } catch (e) {
        return number; // Return the original value if parsing fails.
    }
};

const LogHistory = () => {
    const { data, updateLogEntry, deleteLogEntry } = useAppData();

    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null);

    const [editForm, setEditForm] = useState({
        date: '',
        province: '',
        warehouse: '',
        bags: '',
        netKgs: '',
        per50: '',
        variety: '',
        transactionType: '',
        riceMill: '',
        aiNumber: '',
        remarks: '',
    });

    const sortedProvinces = [...data.provinces].sort((a, b) => a.name.localeCompare(b.name));
    const sortedTransactionTypes = [...data.transactionTypes].sort((a, b) => a.name.localeCompare(b.name));
    const sortedVarieties = [...data.varieties].sort((a, b) => a.name.localeCompare(b.name));
    const sortedRiceMills = [...data.riceMills].sort((a, b) => a.name.localeCompare(b.name));

    useEffect(() => {
        if (!isEditModalOpen) return;

        const selectedWarehouseInList = data.warehouses.some(w =>
            w.province === editForm.province && w.name === editForm.warehouse
        );

        if (editForm.warehouse && !selectedWarehouseInList) {
            setEditForm(prev => ({
                ...prev,
                warehouse: '',
            }));
        }
    }, [editForm.province, editForm.warehouse, isEditModalOpen, data.warehouses]);

    const filteredEntries = data.logEntries.filter(entry => {
        return Object.values(entry).some(value =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const sortedEntries = [...filteredEntries].sort((a, b) => {
        if (!sortConfig.key) {
            return 0;
        }
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
    });

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return '↕️';
        }
        return sortConfig.direction === 'ascending' ? '⬆️' : '⬇️';
    };

    const handleEditClick = (entry) => {
        setSelectedEntry(entry);
        setEditForm({
            date: entry.date,
            province: entry.province,
            warehouse: entry.warehouse,
            bags: entry.bags,
            netKgs: entry.netKgs,
            per50: entry.per50,
            variety: entry.variety,
            transactionType: entry.transactionType,
            riceMill: entry.ricemill,
            aiNumber: entry.aiNumber,
            remarks: entry.remarks,
        });
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (entry) => {
        setSelectedEntry(entry);
        setIsDeleteModalOpen(true);
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        if (selectedEntry) {
            const per50 = (parseFloat(editForm.netKgs) / 50).toFixed(3);
            const updatedEntry = {
                ...selectedEntry,
                ...editForm,
                per50,
            };
            updateLogEntry(updatedEntry);
            setIsEditModalOpen(false);
            setSelectedEntry(null);
        }
    };

    const handleDeleteConfirm = () => {
        if (selectedEntry) {
            deleteLogEntry(selectedEntry);
            setIsDeleteModalOpen(false);
            setSelectedEntry(null);
        }
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

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
                            <TableHeader onClick={() => requestSort('date')}><span>Date</span><SortIcon>{getSortIcon('date')}</SortIcon></TableHeader>
                            <TableHeader onClick={() => requestSort('province')}><span>Province</span><SortIcon>{getSortIcon('province')}</SortIcon></TableHeader>
                            <TableHeader onClick={() => requestSort('warehouse')}><span>Warehouse</span><SortIcon>{getSortIcon('warehouse')}</SortIcon></TableHeader>
                            <TableHeader onClick={() => requestSort('bags')}><span>Bags</span><SortIcon>{getSortIcon('bags')}</SortIcon></TableHeader>
                            <TableHeader onClick={() => requestSort('netKgs')}><span>Net Kgs</span><SortIcon>{getSortIcon('netKgs')}</SortIcon></TableHeader>
                            <TableHeader onClick={() => requestSort('per50')}><span>Per 50</span><SortIcon>{getSortIcon('per50')}</SortIcon></TableHeader>
                            <TableHeader onClick={() => requestSort('variety')}><span>Variety</span><SortIcon>{getSortIcon('variety')}</SortIcon></TableHeader>
                            <TableHeader onClick={() => requestSort('transactionType')}><span>Type</span><SortIcon>{getSortIcon('transactionType')}</SortIcon></TableHeader>
                            <TableHeader onClick={() => requestSort('ricemill')}><span>Ricemill</span><SortIcon>{getSortIcon('ricemill')}</SortIcon></TableHeader>
                            <TableHeader onClick={() => requestSort('aiNumber')}><span>AI Number</span><SortIcon>{getSortIcon('aiNumber')}</SortIcon></TableHeader>
                            <TableHeader>Remarks</TableHeader>
                            <TableHeader>Actions</TableHeader>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedEntries.length > 0 ? (
                            sortedEntries.map((entry) => (
                                <HoverableTableRow key={entry.id}>
                                    <TableCell>{formatDate(entry.date)}</TableCell>
                                    <TableCell>{entry.province}</TableCell>
                                    <TableCell>{entry.warehouse}</TableCell>
                                    <TableCell>{formatNumberWithCommas(entry.bags)}</TableCell>
                                    <TableCell>{formatNumberWithCommas(entry.netKgs)}</TableCell>
                                    <TableCell>{formatNumberWithCommas(entry.per50)}</TableCell>
                                    <TableCell>{entry.variety}</TableCell>
                                    <TableCell>{entry.transactionType}</TableCell>
                                    <TableCell>{entry.ricemill}</TableCell>
                                    <TableCell>{entry.aiNumber}</TableCell>
                                    <TableCell $remarksCell>{entry.remarks}</TableCell>
                                    <TableCell $actionsCell>
                                        <ActionButton onClick={() => handleEditClick(entry)}>✏️</ActionButton>
                                        <DeleteButton onClick={() => handleDeleteClick(entry)}>🗑️</DeleteButton>
                                    </TableCell>
                                </HoverableTableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan="12" style={{ textAlign: 'center' }}>No matching entries found.</TableCell>
                            </TableRow>
                        )}
                    </tbody>
                </HistoryTable>
            </TableWrapper>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <ModalOverlay>
                    <ModalContent>
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
                                    {sortedProvinces.map((p, index) => (
                                        <option key={index} value={p.name}>{p.name}</option>
                                    ))}
                                </Select>
                            </FormRow>
                            <FormRow>
                                <label htmlFor="edit-warehouse">Warehouse:</label>
                                <Select id="edit-warehouse" name="warehouse" value={editForm.warehouse} onChange={handleEditFormChange} disabled={!editForm.province} required>
                                    <option value="">Select Warehouse</option>
                                    {filteredEditWarehouses.map((w, index) => (
                                        <option key={index} value={w.name}>{w.name}</option>
                                    ))}
                                </Select>
                            </FormRow>
                            <FormRow>
                                <label htmlFor="edit-transactionType">Transaction Type:</label>
                                <Select id="edit-transactionType" name="transactionType" value={editForm.transactionType} onChange={handleEditFormChange} required>
                                    <option value="">Select Type</option>
                                    {sortedTransactionTypes.map((t, index) => (
                                        <option key={index} value={t.name}>{t.name}</option>
                                    ))}
                                </Select>
                            </FormRow>
                            <FormRow>
                                <label htmlFor="edit-variety">Variety:</label>
                                <Select id="edit-variety" name="variety" value={editForm.variety} onChange={handleEditFormChange} required>
                                    <option value="">Select Variety</option>
                                    {sortedVarieties.map((v, index) => (
                                        <option key={index} value={v.name}>{v.name}</option>
                                    ))}
                                </Select>
                            </FormRow>
                            {editForm.transactionType === 'MILLING' && (
                                <>
                                    <FormRow>
                                        <label htmlFor="edit-riceMill">Ricemill Name:</label>
                                        <Select
                                            id="edit-riceMill"
                                            name="riceMill"
                                            value={editForm.riceMill}
                                            onChange={handleEditFormChange}
                                            disabled={editForm.variety === 'WD1'}
                                            required={editForm.variety !== 'WD1'}
                                        >
                                            <option value="">Select Ricemill</option>
                                            {sortedRiceMills.map((r, index) => (
                                                <option key={index} value={r.name}>{r.name}</option>
                                            ))}
                                        </Select>
                                    </FormRow>
                                    <FormRow>
                                        <label htmlFor="edit-aiNumber">AI Number:</label>
                                        <Input
                                            type="text"
                                            id="edit-aiNumber"
                                            name="aiNumber"
                                            value={editForm.aiNumber}
                                            onChange={handleEditFormChange}
                                            disabled={editForm.variety === 'WD1'}
                                            required={editForm.variety !== 'WD1'}
                                        />
                                    </FormRow>
                                </>
                            )}
                            <FormRow>
                                <label htmlFor="edit-bags">Bags:</label>
                                <Input type="number" step="0.001" id="edit-bags" name="bags" value={editForm.bags} onChange={handleEditFormChange} required />
                            </FormRow>
                            <FormRow>
                                <label htmlFor="edit-netKgs">Net Kgs:</label>
                                <Input type="number" step="0.001" id="edit-netKgs" name="netKgs" value={editForm.netKgs} onChange={handleEditFormChange} required />
                            </FormRow>
                            <FormRow>
                                <label htmlFor="edit-per50">Per 50:</label>
                                <Input type="text" id="edit-per50" name="per50" value={(parseFloat(editForm.netKgs) / 50).toFixed(3)} readOnly disabled />
                            </FormRow>
                            <FormRow $fullWidth>
                                <label htmlFor="edit-remarks">Remarks:</label>
                                <TextArea id="edit-remarks" name="remarks" value={editForm.remarks} onChange={handleEditFormChange} />
                            </FormRow>
                            <FormActions>
                                <ActionButton type="submit">Save Changes</ActionButton>
                                <CancelButton type="button" onClick={() => setIsEditModalOpen(false)}>Cancel</CancelButton>
                            </FormActions>
                        </Form>
                    </ModalContent>
                </ModalOverlay>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <ModalOverlay>
                    <ModalContent>
                        <ModalHeader>Confirm Deletion</ModalHeader>
                        <p>Are you sure you want to delete this entry?</p>
                        <FormActions>
                            <DeleteButton onClick={handleDeleteConfirm}>Delete</DeleteButton>
                            <CancelButton onClick={() => setIsDeleteModalOpen(false)}>Cancel</CancelButton>
                        </FormActions>
                    </ModalContent>
                </ModalOverlay>
            )}
        </HistoryContainer>
    );
};

export default LogHistory;

const HistoryContainer = styled.div`
    max-width: 100%;
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
    max-height: 500px;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
`;

const HistoryTable = styled.table`
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9em;
    table-layout: auto;
    min-width: 1200px;
`;

const TableHeader = styled.th`
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: #f0f0f0;
    color: #333;
    padding: 12px;
    text-align: left;
    cursor: pointer;
    white-space: nowrap;
    user-select: none;
    transition: background-color 0.3s ease;
    span {
        display: inline-block;
    }
    &:hover {
        background-color: #e6e6e6;
    }
    &:first-child { min-width: 100px; }
    &:last-child { min-width: 100px; }
`;

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
`;

// NEW STYLED COMPONENT for the hover effect
const HoverableTableRow = styled(TableRow)`
    &:hover {
        background-color: #1e87e2ff;
        font-weight: bold;
        font-size: 1em;
    }
`;

const TableCell = styled.td`
    padding: 12px;
    text-align: left;
    white-space: normal;
    overflow-wrap: break-word;
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
    border-radius: 6px;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 0.85em;
    font-weight: bold;
    transition: background-color 0.3s ease, transform 0.1s ease, box-shadow 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    &:hover {
        background-color: #2980b9;
        transform: translateY(-1px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    }
    &:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
    background: #f4f7f6;
    padding: 15px;
    border-radius: 12px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    min-width: 300px;
    max-width: 450px;
    width: 90%;
    border: 1px solid #e0e0e0;
    animation: slideIn 0.3s forwards;
    @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;

const ModalHeader = styled.h3`
    margin-top: 0;
    margin-bottom: 15px;
    text-align: center;
    color: #34495e;
`;

const Form = styled.form`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    align-items: end;
`;

const FormRow = styled.div`
    display: flex;
    flex-direction: column;
    ${({ $fullWidth }) => $fullWidth && `
        grid-column: 1 / -1;
    `}
    label {
        font-weight: bold;
        margin-bottom: 5px;
        font-size: 0.95em;
        color: #555;
    }
`;

const Input = styled.input`
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 1em;
    transition: all 0.2s ease-in-out;
    box-sizing: border-box;
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
    border-radius: 6px;
    font-size: 1em;
    background-color: #fff;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    box-sizing: border-box;
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
    border-radius: 6px;
    min-height: 80px;
    font-size: 1em;
    transition: all 0.2s ease-in-out;
    box-sizing: border-box;
    &:focus {
        outline: none;
        border-color: #3498db;
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.5);
    }
`;

const FormActions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    width: 100%;
    margin-top: 15px;
`;

const CancelButton = styled(ActionButton)`
    background-color: #95a5a6;
    &:hover {
        background-color: #7f8c8d;
    }
`;