import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import { useUserContext } from '../../hooks/UserContext.jsx';

function NotificationModal() {
  const { isModalOpen, currentNotification, closeModal } = useUserContext();

  if (!isModalOpen || !currentNotification) return null;

  return (
    <Modal show={isModalOpen} onHide={closeModal} centered contentClassName="border-0">
      <Modal.Header className="d-flex align-items-center">
        <i className="fa-solid fa-plug-circle-check" style={{ fontSize: '2rem', color: '#1a8857' }}></i>
        <Modal.Title className="text-success ms-2">Connection successful!</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {currentNotification ? (
          <div className="text-muted mb-3">
            <p>
              <strong>Service:</strong> {currentNotification.service_type}
              <br />
              <strong>Message:</strong> {currentNotification.notification}
              <br />
              <strong>Time:</strong> {currentNotification.timestamp}
            </p>
          </div>
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
