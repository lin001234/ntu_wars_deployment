import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
import { axiosInstance } from '../../../components/axios';
const LogOut =({ show, onHide, isLoading }) =>{
    const navigate=useNavigate();

    const handleLogout = async () =>{
        try{
            await axiosInstance.post(`/auth/logout`, {} ,{
                withCredentials: true,
            });
            window.location.href = '/login'; // Force full refresh
        } catch(err){
            console.error('Logout failed:', err);
            alert('Logout failed. Please try again.');
        }
    }
    return (
        <Modal show={show} onHide={onHide}>
        <Modal.Header closeButton>
            <Modal.Title>Confirm Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to logout?</Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={onHide}>
            Cancel
            </Button>
            <Button variant="danger" onClick={handleLogout}>
            Logout
            </Button>
        </Modal.Footer>
        </Modal>
    );
}

export default LogOut;