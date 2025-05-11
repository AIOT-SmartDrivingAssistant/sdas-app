import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import { useUserContext } from '../../hooks/UserContext.jsx';

function NotificationModal() {
    const { isModalOpen, currentNotification, closeModal } = useUserContext();

    if (!isModalOpen || !currentNotification) return null;

    return (
        <Modal show={isModalOpen} onHide={closeModal}>
            <Modal.Header closeButton>
                <Modal.Title>Notification</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {currentNotification ? (
                    <p>
                    <strong>Service:</strong> {currentNotification.service_type}
                    <br />
                    <strong>Message:</strong> {currentNotification.notification}
                    <br />
                    <strong>Time:</strong> {currentNotification.timestamp}
                    </p>
                ) : (
                    <p>No notification available.</p>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={closeModal}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default NotificationModal;