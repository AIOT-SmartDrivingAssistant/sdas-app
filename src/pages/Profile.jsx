import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "../components/Home/Profile.module.css"; // Import CSS module
import defaultAvatar from "../assets/images/avt.jpg";
import "bootstrap/dist/css/bootstrap.min.css";

import { useContext } from "react";
import { UserContext } from "../hooks/UserContext.jsx";

const mockData = {
  userName: "Charlene Reed",
  name: "Charlene Reed",
  email: "charlenereed@gmail.com",
  date_of_birth: "1990-01-25",
  address: "San Jose, California, USA"
};

function Profile() {
  const { setUser } = useContext(UserContext);

  const [formData, setFormData] = useState(mockData);
  const [avatar, setAvatar] = useState(defaultAvatar);

  useEffect(() => {
    // TODO: check UserContext first, call API if "user" in UserContext is empty

    axios.get(`${import.meta.env.VITE_SERVER_URL}/user/`,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
      .then((response) => {
        let data = response.data;
        data.date_of_birth = data.date_of_birth.split('-').reverse().join('-');

        console.log("Dữ liệu tải về:", data);

        setUser(response.data);
        setFormData(response.data);
      })
      .catch((error) => {
        console.error("Lỗi khi tải dữ liệu:", error);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value: rawValue } = e.target;
    let value = rawValue;

    if (name === "date_of_birth") {
      console.log("RawValue: ", rawValue)
    }

    // Update formData state
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (event) => setAvatar(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitUserData = async (e) => {
    e.preventDefault();

    try {
      let data = formData;
      data.date_of_birth = data.date_of_birth.split('-').reverse().join('-');
      console.log("Update data: ", data);

      const response = await axios.patch(`${import.meta.env.VITE_SERVER_URL}/user/`, data, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response) {
        console.log("Response:", response.data);

        setUser(data);
      }
    } catch (error) {
      if (error.response.status === 401) {
        // TODO: handle unauthorized error

      } else if (error.response.status === 422) {
        // TODO: handle validation error

      } else {
        // TODO: handle internal server error

      }
    }
  };

  const handleSubmitAvatar = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("file", e.target.avatar.files[0]);

      const response = await axios.patch(`${import.meta.env.VITE_SERVER_URL}/user/avatar`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response) {
        console.log("Avatar updated successfully: ", response.data);

        // TODO: handle store avatar
      }
    } catch (error) {
      if (error.response.status === 401) {
        // TODO: handle unauthorized error
      
      } else {
        // TODO: handle internal server error

      } 
    }
  };

  const handleDeleteAvatar = async (e) => {
    e.preventDefault();
  
    try {
      const response = await axios.delete(`${import.meta.env.VITE_SERVER_URL}/user/avatar`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      if (response) {
        console.log('Avatar deleted successfully: ', response.data);
  
        // TODO: handle delete avatar
      }
    } catch (error) {
      if (error.response.status === 401) {
        // TODO: handle unauthorized error
  
      } else {
        // TODO: handle internal server error
  
      }
    }
  };

  return (
    <div className={`pt-1 ${styles.container}`}>
      <div className="row">
        {/* Avatar Section */}
        <div className="col-md-2 text-center">
          <div className={styles.avatarContainer}>
            <img src={avatar} alt="Avatar" className={styles.avatar} />
            <label htmlFor="avatarUpload" className={styles.editIcon}>
              <i className={`fa-solid fa-pencil ${styles.smallIcon}`}></i>
            </label>
            <input type="file" id="avatarUpload" className="d-none" accept="image/*" onChange={handleAvatarChange} />
          </div>
        </div>

        {/* Left Form Section */}
        <div className="col-md-5">
          <form>
            <div className="mb-3 me-4">
              <label htmlFor="name" className={styles.formLabel}>Your Name</label>
              <input type="text" className={`form-control ${styles.formControl}`} id="name" name="name" value={formData.name} onChange={handleChange} />
            </div>

            <div className="mb-3 me-4">
              <label htmlFor="email" className={styles.formLabel}>Email</label>
              <input type="email" className={`form-control ${styles.formControl}`} id="email" name="email" value={formData.email} onChange={handleChange} />
            </div>

            <div className="mb-3 me-4">
              <label htmlFor="date_of_birth" className={styles.formLabel}>Date of Birth</label>
              <input type="date" className={`form-control ${styles.formControl}`} id="date_of_birth" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} />
            </div>

            <div className="mb-3 me-4">
              <label htmlFor="address" className={styles.formLabel}>Address</label>
              <input type="text" className={`form-control ${styles.formControl}`} id="address" name="address" value={formData.address} onChange={handleChange} />
            </div>
          </form>
        </div>

        {/* Right Form Section */}
        <div className="col-md-5">
          <form onSubmit={handleSubmitUserData}>

            <div className={styles.saveButtonContainer}>
              <button type="submit" className={styles.submitButton}>
                Save
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
