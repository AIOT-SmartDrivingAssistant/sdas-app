import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import styles from '../components/Home/Profile.module.css';
import defaultAvatar from '../assets/images/avt.jpg';
import 'bootstrap/dist/css/bootstrap.min.css';
import { UserContext } from '../hooks/UserContext.jsx';

function Profile() {
  const { user, setUser, addActionToHistory } = useContext(UserContext);

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
      if (user) {
        const formattedUser = {
          ...user,
          date_of_birth: formatDateForInput(user.date_of_birth),
        };
        setFormData(formattedUser);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'}/user/`,
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.status === 200) {
          const data = response.data;
          data.date_of_birth = formatDateForInput(data.date_of_birth);
          console.log('Dữ liệu tải về:', data);

          setUser(data);
          setFormData(data);
        } else {
          throw new Error('Unexpected response status');
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        if (error.response?.status === 401) {
          setError('Unauthorized access. Please log in again.');
        } else {
          setError('Failed to load user data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, setUser]);

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

      const response = await axios.patch(
        `${import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'}/user/`,
        dataToSend,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        console.log('Response:', response.data);
        setUser(response.data);
        // Thêm hành động vào history
        addActionToHistory('user_update', {
          updatedFields: Object.keys(dataToSend),
          status: 'success',
        });
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating user data:', error);
      const errorMessage =
        error.response?.status === 401
          ? 'Unauthorized access. Please log in again.'
          : error.response?.status === 422
          ? 'Validation error: Please check your input data.'
          : 'Failed to update profile. Please try again later.';
      setError(errorMessage);
      // Thêm hành động thất bại vào history
      addActionToHistory('user_update', {
        updatedFields: Object.keys(formData),
        status: 'failed',
        error: errorMessage,
      });
    }
  };

  const handleSubmitAvatar = async (file) => {
    try {
      const avatarFormData = new FormData();
      avatarFormData.append('file', file);

      const response = await axios.patch(
        `${import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'}/user/avatar`,
        avatarFormData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.status === 200) {
        console.log('Avatar updated successfully:', response.data);
        // Thêm hành động vào history
        addActionToHistory('avatar_update', {
          action: 'upload',
          status: 'success',
        });
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      const errorMessage =
        error.response?.status === 401
          ? 'Unauthorized access. Please log in again.'
          : 'Failed to update avatar. Please try again later.';
      setError(errorMessage);
      // Thêm hành động thất bại vào history
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
      const response = await axios.delete(
        `${import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'}/user/avatar`,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        console.log('Avatar deleted successfully:', response.data);
        setAvatar(defaultAvatar);
        // Thêm hành động vào history
        addActionToHistory('avatar_update', {
          action: 'delete',
          status: 'success',
        });
      }
    } catch (error) {
      console.error('Error deleting avatar:', error);
      const errorMessage =
        error.response?.status === 401
          ? 'Unauthorized access. Please log in again.'
          : 'Failed to delete avatar. Please try again later.';
      setError(errorMessage);
      // Thêm hành động thất bại vào history
      addActionToHistory('avatar_update', {
        action: 'delete',
        status: 'failed',
        error: errorMessage,
      });
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
              <input
                type="file"
                id="avatarUpload"
                className="d-none"
                accept="image/*"
                onChange={handleAvatarChange}
              />
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