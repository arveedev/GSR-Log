import React, { useState } from 'react';
import styled from 'styled-components';
import { useAppData } from '../../hooks/useAppData';

const MillerProfile = () => {
    // Access the ricemill data and the update function from the global state
    const { data, updateAppData } = useAppData();

    // State for the form inputs (Create operation)
    const [name, setName] = useState('');
    const [ownerRepresentative, setOwnerRepresentative] = useState('');
    const [address, setAddress] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    
    // State for the editing modal (Update operation)
    const [editingRicemill, setEditingRicemill] = useState(null);
    const [editedName, setEditedName] = useState('');
    const [editedOwnerRepresentative, setEditedOwnerRepresentative] = useState('');
    const [editedAddress, setEditedAddress] = useState('');
    const [editedContactNumber, setEditedContactNumber] = useState('');

    // Sort the ricemills data alphabetically by name for display (Read operation)
    const sortedRicemills = [...data.ricemills].sort((a, b) => a.name.localeCompare(b.name));

    // --- Create Operation ---
    const handleAdd = (e) => {
        e.preventDefault();

        if (!name || !ownerRepresentative || !address || !contactNumber) {
            alert('Please fill out all fields.');
            return;
        }

        const isDuplicate = data.ricemills.some(rm => rm.name.toLowerCase() === name.toLowerCase());
        if (isDuplicate) {
            alert('A ricemill with this name already exists.');
            return;
        }

        const newRicemill = {
            name,
            ownerRepresentative,
            address,
            contactNumber
        };

        const updatedRicemills = [...data.ricemills, newRicemill];
        updateAppData({ ricemills: updatedRicemills });

        setName('');
        setOwnerRepresentative('');
        setAddress('');
        setContactNumber('');
    };
    
    // --- Delete Operation ---
    const handleDelete = (millerNameToDelete) => {
        if (window.confirm(`Are you sure you want to delete the ricemill "${millerNameToDelete}"?`)) {
            const updatedRicemills = data.ricemills.filter(rm => rm.name !== millerNameToDelete);
            updateAppData({ ricemills: updatedRicemills });
        }
    };
    
    // --- Update Operation Handlers ---
    // Opens the modal and populates the fields with the selected ricemill's data
    const handleEdit = (ricemill) => {
        setEditingRicemill(ricemill);
        setEditedName(ricemill.name);
        setEditedOwnerRepresentative(ricemill.ownerRepresentative);
        setEditedAddress(ricemill.address);
        setEditedContactNumber(ricemill.contactNumber);
    };

    // Submits the updated data
    const handleUpdate = (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!editedName || !editedOwnerRepresentative || !editedAddress || !editedContactNumber) {
            alert('Please fill out all fields.');
            return;
        }
        
        // Check for name duplication, but allow the original name
        const isDuplicate = data.ricemills.some(rm => 
            rm.name.toLowerCase() === editedName.toLowerCase() && rm.name !== editingRicemill.name
        );
        if (isDuplicate) {
            alert('A ricemill with this name already exists.');
            return;
        }

        // Create the updated object
        const updatedRicemill = {
            name: editedName,
            ownerRepresentative: editedOwnerRepresentative,
            address: editedAddress,
            contactNumber: editedContactNumber
        };

        // Find and replace the old ricemill with the updated one
        const updatedList = data.ricemills.map(rm => 
            rm.name === editingRicemill.name ? updatedRicemill : rm
        );

        updateAppData({ ricemills: updatedList });
        setEditingRicemill(null); // Close the modal
    };
    
    // Closes the modal without saving changes
    const handleCloseModal = () => {
        setEditingRicemill(null);
    };

    return (
        <Container>
            <FormContainer>
                <h3>Add New Ricemill</h3>
                <Form onSubmit={handleAdd}>
                    <FormRow>
                        <label htmlFor="name">Ricemill Name:</label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </FormRow>
                    <FormRow>
                        <label htmlFor="ownerRepresentative">Owner/Representative:</label>
                        <Input
                            id="ownerRepresentative"
                            type="text"
                            value={ownerRepresentative}
                            onChange={(e) => setOwnerRepresentative(e.target.value)}
                            required
                        />
                    </FormRow>
                    <FormRow>
                        <label htmlFor="address">Address:</label>
                        <Input
                            id="address"
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            required
                        />
                    </FormRow>
                    <FormRow>
                        <label htmlFor="contactNumber">Contact Number:</label>
                        <Input
                            id="contactNumber"
                            type="tel"
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                            required
                        />
                    </FormRow>
                    <Button type="submit">Add Ricemill</Button>
                </Form>
            </FormContainer>

            <ListContainer>
                <h3>Existing Ricemill Profiles</h3>
                {sortedRicemills.length > 0 ? (
                    <Table>
                        <thead>
                            <tr>
                                <TableHeader>Ricemill Name</TableHeader>
                                <TableHeader>Owner</TableHeader>
                                <TableHeader>Address</TableHeader>
                                <TableHeader>Contact No.</TableHeader>
                                <TableHeader>Actions</TableHeader>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedRicemills.map((ricemill, index) => (
                                <TableRow key={index}>
                                    <TableCell>{ricemill.name}</TableCell>
                                    <TableCell>{ricemill.ownerRepresentative}</TableCell>
                                    <TableCell>{ricemill.address}</TableCell>
                                    <TableCell>{ricemill.contactNumber}</TableCell>
                                    <TableCell>
                                        <ActionButton $edit onClick={() => handleEdit(ricemill)}>Edit</ActionButton>
                                        <ActionButton onClick={() => handleDelete(ricemill.name)}>Delete</ActionButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </tbody>
                    </Table>
                ) : (
                    <NoDataMessage>No ricemill profiles found.</NoDataMessage>
                )}
            </ListContainer>
            
            {/* --- Update Modal (conditional rendering) --- */}
            {editingRicemill && (
                <ModalOverlay>
                    <ModalContent>
                        <h3>Edit Ricemill Profile</h3>
                        <Form onSubmit={handleUpdate}>
                            <FormRow>
                                <label htmlFor="editedName">Ricemill Name:</label>
                                <Input
                                    id="editedName"
                                    type="text"
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    required
                                />
                            </FormRow>
                            <FormRow>
                                <label htmlFor="editedOwner">Owner/Representative:</label>
                                <Input
                                    id="editedOwner"
                                    type="text"
                                    value={editedOwnerRepresentative}
                                    onChange={(e) => setEditedOwnerRepresentative(e.target.value)}
                                    required
                                />
                            </FormRow>
                            <FormRow>
                                <label htmlFor="editedAddress">Address:</label>
                                <Input
                                    id="editedAddress"
                                    type="text"
                                    value={editedAddress}
                                    onChange={(e) => setEditedAddress(e.target.value)}
                                    required
                                />
                            </FormRow>
                            <FormRow>
                                <label htmlFor="editedContact">Contact Number:</label>
                                <Input
                                    id="editedContact"
                                    type="tel"
                                    value={editedContactNumber}
                                    onChange={(e) => setEditedContactNumber(e.target.value)}
                                    required
                                />
                            </FormRow>
                            <Button type="submit">Update Ricemill</Button>
                            <CloseButton type="button" onClick={handleCloseModal}>Cancel</CloseButton>
                        </Form>
                    </ModalContent>
                </ModalOverlay>
            )}

        </Container>
    );
};

export default MillerProfile;

// Styled Components
const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 30px;
    padding: 20px;
`;

const FormContainer = styled.div`
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Form = styled.form`
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    align-items: flex-end;
`;

const FormRow = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 200px;
`;

const Input = styled.input`
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
`;

const Button = styled.button`
    padding: 10px 15px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
        background-color: #2980b9;
    }
`;

const ListContainer = styled.div`
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
`;

const TableHeader = styled.th`
    background-color: #34495e;
    color: white;
    padding: 10px;
    text-align: left;
    &:first-child {
        border-top-left-radius: 4px;
    }
    &:last-child {
        border-top-right-radius: 4px;
    }
`;

const TableRow = styled.tr`
    &:nth-child(even) {
        background-color: #f2f2f2;
    }
`;

const TableCell = styled.td`
    padding: 10px;
    border-bottom: 1px solid #ddd;
`;

const ActionButton = styled.button`
    background-color: ${({ $edit }) => ($edit ? '#f39c12' : '#e74c3c')};
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    margin-right: 5px;

    &:hover {
        background-color: ${({ $edit }) => ($edit ? '#e67e22' : '#c0392b')};
    }
`;

const NoDataMessage = styled.p`
    text-align: center;
    color: #7f8c8d;
    font-style: italic;
`;

// --- Modal Styled Components ---
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
    background-color: #fff;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    max-width: 500px;
    width: 100%;
    position: relative;
`;

const CloseButton = styled.button`
    padding: 10px 15px;
    background-color: #95a5a6;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    margin-left: 10px;

    &:hover {
        background-color: #7f8c8d;
    }
`;