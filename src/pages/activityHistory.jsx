import styles from '../components/Home/activityHistory.module.css';
import React, { useState, useEffect } from 'react';

import axios from 'axios';

export default function activityHistory() {
  // Dữ liệu cho lịch sử hoạt động
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  // Giới hạn tối đa 5 trang
  const MAX_PAGES = 5;
  const ITEMS_PER_PAGE = 8;
  const MAX_ITEMS = MAX_PAGES * ITEMS_PER_PAGE;

  // Định dạng thời gian từ timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // Map loại dịch vụ từ API sang hiển thị
  const mapServiceType = (type) => {
    const typeMap = {
      driver_monitoring: 'Driver monitoring',
      air_cond_service: 'Air conditioning',
      smart_headlights: 'Smart headlights',
    };
    return typeMap[type] || type;
  };

  const handleGetHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/app/history`, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });

      if (response && response.data) {
        console.log('History fetched successfully: ', response.data);

        // Chuyển đổi dữ liệu API sang định dạng hiển thị
        const formattedActivities = response.data.map((item, index) => ({
          id: index + 1,
          time: formatTimestamp(item.timestamp),
          type: mapServiceType(item.service_type),
          status: item.description,
        }));

        // Sắp xếp dữ liệu thời gian mới nhất lên trước
        formattedActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Giới hạn số lượng items
        const limitedActivities = formattedActivities.slice(0, MAX_ITEMS);

        setActivities(limitedActivities);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setError('Unauthorized. Please login again.');
        console.error('Authentication error:', error);
      } else {
        setError('Failed to load activity history. Please try again later.');
        console.error('Server error:', error);
      }
    } finally {
      setLoading(false);
    }
  };
  // Lấy dữ liệu khi component được mount
  useEffect(() => {
    handleGetHistory();

    // Cập nhật dữ liệu mỗi 30 giây
    const refreshInterval = setInterval(() => {
      handleGetHistory();
    }, 30000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  // Giả lập cập nhật dữ liệu cho thời gian thực
  // useEffect(() => {
  //   // Cập nhật thời gian hiện tại mỗi giây
  //   const activityInterval = setInterval(() => {
  //     const now = new Date();
  //     const hours = String(now.getHours()).padStart(2, '0');
  //     const minutes = String(now.getMinutes()).padStart(2, '0');
  //     const seconds = String(now.getSeconds()).padStart(2, '0');

  //     // Chọn type để thêm vào
  //     const types = ['Driver monitoring', 'Air conditioning', 'Smart headlights'];
  //     const type = types[0];

  //     let newStatus = '';
  //     if (type === types[0]) {
  //       // 3 status of driver monitoring: normal, have signs of drowsiness, danger
  //       const randomNumber = Math.floor(Math.random() * 3);
  //       if (randomNumber === 0) {
  //         newStatus = 'Normal';
  //       } else if (randomNumber === 1) {
  //         newStatus = 'Have signs of drowsiness';
  //       } else if (randomNumber === 2) {
  //         newStatus = 'Danger';
  //       }
  //     } else if (type === types[1]) {
  //       const oldTemp = Math.floor(Math.random * 10) + 18;
  //       const newTemp = Math.floor(Math.random * 10) + 18;
  //       newStatus = `Change from ${oldTemp} to ${newTemp}`;
  //     } else if (type === types[2]) {
  //       // From 1 to 4
  //       const oldTemp = 2;
  //       const newTemp = 4;
  //       newStatus = `Change from ${oldTemp} to ${newTemp}`;
  //     }

  //     setActivities((prevActivity) => {
  //       // Thêm hoạt động mới vào đầu danh sách
  //       const newActivity = {
  //         id: activities.length + 1,
  //         time: `${hours}:${minutes}:${seconds}`,
  //         type: type,
  //         status: newStatus,
  //       };

  //       const newActivities = [newActivity, ...prevActivity];
  //       if (newActivities.length > MAX_ITEMS) {
  //         return newActivities.slice(0, MAX_ITEMS);
  //       }
  //       return newActivities;
  //     });
  //   }, 15000);

  //   // Cleanup các inteval khi component unmout
  //   return () => {
  //     clearInterval(activityInterval);
  //   };
  // }, [activities.length]);

  // Phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = activities.slice(indexOfFirstItem, indexOfLastItem);

  // Tính tổng số trang
  const totalPages = Math.ceil(activities.length / itemsPerPage);

  // Xử lý thay đổi trang
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Xây dựng phân trang
  const renderPagination = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    return (
      <nav aria-label="Pagination">
        <ul className="pagination">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <a
              className="page-link"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage !== 1) handlePageChange(currentPage - 1);
              }}
            >
              <span aria-hidden="true">&laquo;</span>
            </a>
          </li>

          {/*  Số trang */}
          {pageNumbers.map((number) => (
            <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
              <a
                className="page-link"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(number);
                }}
              >
                {number}
              </a>
            </li>
          ))}
          {/* last */}
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <a
              className="page-link"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage !== totalPages) handlePageChange(currentPage + 1);
              }}
            >
              <span aria-hidden="true">&raquo;</span>
            </a>
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <div className={styles.activityHistory}>
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
          <button className="btn btn-sm btn-outline-danger float-end" onClick={handleGetHistory}>
            Retry
          </button>
        </div>
      ) : (
        <></>
      )}
      <table className="table table-striped table-bordered table-hover table-responsive mb-0">
        <thead>
          <tr className={styles.tableHeader}>
            <th width="10%">Time</th>
            <th width="20%">Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length > 0 ? (
            currentItems.map((acitvity) => (
              <tr key={acitvity.id}>
                <td>{acitvity.time}</td>
                <td>{acitvity.type}</td>
                <td>{acitvity.status}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="text-center py-3">
                No activity records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="d-flex mt-3 justify-content-between align-items-center">
        <div className={styles.activityFooter}>
          {activities.length > 0
            ? `Showing ${currentItems.length} in ${activities.length} activities`
            : 'No activities to display'}
        </div>
        {activities.length > itemsPerPage && renderPagination()}
      </div>
    </div>
  );
}
