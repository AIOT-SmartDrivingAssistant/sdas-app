import React, { useState, useEffect } from 'react';
import styles from '../components/Home/Profile.module.css';
import defaultAvatar from '../assets/images/default_avatar.png';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useUserContext } from '../hooks/UserContext.jsx';
import toast from 'react-hot-toast';
import apiClient from '../services/APIClient.jsx';

function Profile() {
  const { userData, setUserData, userAvatar, setUserAvatar } = useUserContext();

  const [formData, setFormData] = useState(() => {
    return (
      userData || {
        address: '',
        date_of_birth: '',
        email: '',
        name: '',
        phone: '',
      }
    );
  });
  const [avatar, setAvatar] = useState(userAvatar || defaultAvatar);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (userData && userAvatar) return;

    const handleGetUserData = async () => {
      setLoading(true);
      try {
        const _userData = await apiClient('GET', `${import.meta.env.VITE_SERVER_URL}/user/`);
        setUserData(_userData);
        setFormData(_userData);
      } catch (error) {
        console.error('Fail to get user data: ', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    const handleGetUserAvatar = async () => {
      setLoading(true);
      try {
        const _userAvatar = await apiClient('GET', `${import.meta.env.VITE_SERVER_URL}/user/avatar`);
        setUserAvatar(_userAvatar);
      } catch (error) {
        console.error('Fail to get user avatar: ', error);
      } finally {
        setLoading(false);
      }
    };

    if (!userData) handleGetUserData();
    if (!userAvatar) handleGetUserAvatar();

    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target.result);
        setUserAvatar(event.target.result);
      };
      reader.readAsDataURL(file);

      handleSubmitAvatar(file);
    }
  };

  const handleSubmitUserData = async (e) => {
    e.preventDefault();

    try {
      const responseData = await apiClient('PATCH', `${import.meta.env.VITE_SERVER_URL}/user/`, {
        body: JSON.stringify(formData),
      });

      toast.success(responseData.message);
      setUserData(formData);
      setIsEditing(false);
    } catch (error) {
      toast.error(error?.message || 'An error occurred.');
    }
  };

  const handleSubmitAvatar = async (file) => {
    try {
      const avatarFormData = new FormData();
      avatarFormData.append('file', file);

      const responseData = await apiClient(
        'PUT',
        `${import.meta.env.VITE_SERVER_URL}/user/avatar`,
        { body: avatarFormData },
        true,
      );

      toast.success(responseData.message);
    } catch (error) {
      toast.error(error);
    }
  };

  const handleDeleteAvatar = async (e) => {
    e.preventDefault();

    try {
      const responseData = await apiClient('DELETE', `${import.meta.env.VITE_SERVER_URL}/user/avatar`);

      setUserAvatar(null);
      setAvatar(defaultAvatar);
      toast.success(responseData.message);
    } catch (error) {
      toast.error(error);
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
              <img
                src={avatar}
                alt="Avatar"
                className={styles.avatar}
                style={{ cursor: 'pointer' }}
                onClick={() => setShowAvatarModal(true)}
              />
              <label htmlFor="avatarUpload" className={styles.editIcon}>
                <i className={`fa-solid fa-pencil ${styles.smallIcon}`}></i>
              </label>
              <input type="file" id="avatarUpload" className="d-none" accept="image/*" onChange={handleAvatarChange} />
            </div>
          </div>

          <div className="col-md-10">
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
                    value={formData?.name || ''}
                    onChange={handleChange}
                    placeholder="your name"
                    disabled={!isEditing}
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
                    value={formData?.email || ''}
                    onChange={handleChange}
                    placeholder="abc@gmail.com"
                    disabled={!isEditing}
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
                    value={formData?.phone || ''}
                    onChange={handleChange}
                    placeholder="0123456789"
                    disabled={!isEditing}
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
                    value={formData?.address || ''}
                    onChange={handleChange}
                    placeholder="House number, street name,..."
                    disabled={!isEditing}
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
                    value={formData?.date_of_birth || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className={styles.saveButtonContainer}>
                {!isEditing ? (
                  <button type="button" className={styles.submitButton} onClick={() => setIsEditing(true)}>
                    Edit
                  </button>
                ) : (
                  <form onSubmit={handleSubmitUserData}>
                    <button type="submit" className={styles.submitButton}>
                      Save
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {showAvatarModal && (
        <div className={styles.avatarModalOverlay} onClick={() => setShowAvatarModal(false)}>
          <div className={styles.avatarModalContent} onClick={(e) => e.stopPropagation()}>
            <img
              src={avatar}
              alt="Large Avatar"
              style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '10px' }}
              className="mb-3 d-block"
            />
            <button onClick={handleDeleteAvatar} className="btn btn-danger">
              <i className="fa-solid fa-trash-can"></i> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
