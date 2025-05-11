import React, { useState, useEffect } from 'react';
import styles from '../components/Home/Profile.module.css';
import defaultAvatar from '../assets/images/avt.jpg';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useUserContext } from '../hooks/UserContext.jsx';
import toast from 'react-hot-toast';

function Profile() {
  const { userData, setUserData, userAvatar, setUserAvatar, addActionToHistory } = useUserContext();

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
  });
  const [avatar, setAvatar] = useState(defaultAvatar);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.split('-').reverse().join('-');
  };

  const formatDateForServer = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.split('-').reverse().join('-');
  };

  useEffect(() => {
    const fetchUserData = async () => {
      // Kiểm tra nếu user đã có trong UserContext
      if (userData) {
        const formattedUser = {
          ...userData,
          date_of_birth: formatDateForInput(userData.date_of_birth),
        };
        setFormData(formattedUser);
        setLoading(false);
        return;
      }

      // Nếu không có user, fetch từ API
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'}/user/`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        data.date_of_birth = formatDateForInput(data.date_of_birth);
        console.log('Dữ liệu tải về:', data);

        setUserData(data);
        setFormData(data);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        const errorMessage = error.message.includes('401')
          ? 'Unauthorized access. Please log in again.'
          : 'Failed to load user data. Please try again later.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userData, setUserData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setAvatar(event.target.result);
      reader.readAsDataURL(file);

      handleSubmitAvatar(file);
    }
  };

  const handleSubmitUserData = async (e) => {
    e.preventDefault();

    try {
      const dataToSend = {
        ...formData,
        date_of_birth: formatDateForServer(formData.date_of_birth),
      };
      console.log('Update data:', dataToSend);

      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'}/user/`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response:', data);
      setUserAvatar(data);

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating user data:', error);
      const errorMessage = error.message.includes('401')
        ? 'Unauthorized access. Please log in again.'
        : error.message.includes('422')
        ? 'Validation error: Please check your input data.'
        : 'Failed to update profile. Please try again later.';
      toast.error(errorMessage);
    }
  };

  const handleSubmitAvatar = async (file) => {
    try {
      const avatarFormData = new FormData();
      avatarFormData.append('file', file);

      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'}/user/avatar`, {
        method: 'PUT',
        credentials: 'include',
        body: avatarFormData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Avatar updated successfully:', data);
    } catch (error) {
      console.error('Error updating avatar:', error);
      const errorMessage = error.message.includes('401')
        ? 'Unauthorized access. Please log in again.'
        : 'Failed to update avatar. Please try again later.';
      setError(errorMessage);
      addActionToHistory('avatar_update', {
        action: 'upload',
        status: 'failed',
        error: errorMessage,
      });
    }
  };

  const handleDeleteAvatar = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'}/user/avatar`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Avatar deleted successfully:', data);
      toast.success('Avatar deleted successfully!');
      setAvatar(defaultAvatar);
    } catch (error) {
      console.error('Error deleting avatar:', error);
      const errorMessage = error.message.includes('401')
        ? 'Unauthorized access. Please log in again.'
        : 'Failed to delete avatar. Please try again later.';
      toast.error(errorMessage);
    }
  };

  return (
    <div className={`pt-1 ${styles.container}`}>
      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : (
        <div className="row">
          <div className="col-md-2 text-center">
            <div className={styles.avatarContainer}>
              <img src={avatar} alt="Avatar" className={styles.avatar} />
              <label htmlFor="avatarUpload" className={styles.editIcon}>
                <i className={`fa-solid fa-pencil ${styles.smallIcon}`}></i>
              </label>
              <input type="file" id="avatarUpload" className="d-none" accept="image/*" onChange={handleAvatarChange} />
              <button onClick={handleDeleteAvatar} className={styles.deleteButton}>
                Delete Avatar
              </button>
            </div>
          </div>

          <div className="col-md-10">
            <form onSubmit={handleSubmitUserData}>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3 me-4">
                    <label htmlFor="name" className={styles.formLabel}>
                      Your Name
                    </label>
                    <input
                      type="text"
                      className={`form-control ${styles.formControl}`}
                      id="name"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleChange}
                      placeholder="your name"
                    />
                  </div>

                  <div className="mb-3 me-4">
                    <label htmlFor="email" className={styles.formLabel}>
                      Email
                    </label>
                    <input
                      type="email"
                      className={`form-control ${styles.formControl}`}
                      id="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleChange}
                      placeholder="abc@gmail.com"
                    />
                  </div>

                  <div className="mb-3 me-4">
                    <label htmlFor="phone" className={styles.formLabel}>
                      Phone Number
                    </label>
                    <input
                      type="text"
                      className={`form-control ${styles.formControl}`}
                      id="phone"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleChange}
                      placeholder="0123456789"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3 me-4">
                    <label htmlFor="address" className={styles.formLabel}>
                      Address
                    </label>
                    <input
                      type="text"
                      className={`form-control ${styles.formControl}`}
                      id="address"
                      name="address"
                      value={formData.address || ''}
                      onChange={handleChange}
                      placeholder="House number, street name,..."
                    />
                  </div>

                  <div className="mb-3 me-4">
                    <label htmlFor="date_of_birth" className={styles.formLabel}>
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      className={`form-control ${styles.formControl}`}
                      id="date_of_birth"
                      name="date_of_birth"
                      value={formData.date_of_birth || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className={styles.saveButtonContainer}>
                  <button type="submit" className={styles.submitButton}>
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
