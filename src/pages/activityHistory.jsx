import styles from '../components/Home/activityHistory.module.css';
import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../hooks/UserContext.jsx';

export default function ActivityHistory() {
  const { activityLog } = useContext(UserContext);
  const [initialActivities, setInitialActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  const MAX_PAGES = 5;
  const ITEMS_PER_PAGE = 8;
  const MAX_ITEMS = MAX_PAGES * ITEMS_PER_PAGE;

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const mapServiceType = (type) => {
    const typeMap = {
      driver_monitoring: 'Driver monitoring',
      air_cond_service: 'Air conditioning',
      smart_headlights: 'Smart headlights',
      headlight: 'Smart headlights',
      air_cond_temp: 'Air conditioning temperature',
    };
    return typeMap[type] || type;
  };

  const handleGetInitialHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/app/action_history`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Action history fetched successfully: ', data);

      const formattedInitialActivities = data.map((item, index) => ({
        id: index + 1,
        time: formatTimestamp(item.timestamp),
        type: mapServiceType(item.service_type) || item.service_type,
        status: item.description,
      }));

      setInitialActivities(formattedInitialActivities.slice(0, 4));
    } catch (error) {
      console.error('Error fetching action history:', error);
      const errorMessage =
        error.message.includes('401')
          ? 'Unauthorized. Please login again.'
          : 'Failed to load action history. Please try again later.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGetInitialHistory();
  }, []);

  // Format dữ liệu từ activityLog
  const formattedActivityLog = Array.isArray(activityLog)
    ? activityLog.map((item, index) => {
        if (item.type === 'notification') {
          return {
            id: initialActivities.length + index + 1,
            time: formatTimestamp(item.timestamp),
            type: mapServiceType(item.service_type) || 'Notification',
            status: item.notification || item.message,
          };
        } else if (item.type === 'action') {
          const actionDetails = item.details;
          let typeDisplay = '';
          let statusDisplay = '';

          switch (item.actionType) {
            case 'service_toggle':
              typeDisplay = `Service Toggle (${actionDetails.serviceType})`;
              statusDisplay = `Set to ${actionDetails.value} - ${
                actionDetails.status === 'success' ? 'Success' : `Failed (${actionDetails.error})`
              }`;
              break;
            case 'user_update':
              typeDisplay = 'User Profile Update';
              statusDisplay =
                actionDetails.status === 'success'
                  ? 'Success'
                  : `Failed (${actionDetails.error})`;
              break;
            case 'avatar_update':
              typeDisplay = 'Avatar Update';
              statusDisplay = `${actionDetails.action} - ${
                actionDetails.status === 'success' ? 'Success' : `Failed (${actionDetails.error})`
              }`;
              break;
            case 'slider_update':
              typeDisplay = `Slider Update (${actionDetails.sliderName})`;
              statusDisplay = `Set to ${actionDetails.value} - ${
                actionDetails.status === 'success' ? 'Success' : `Failed (${actionDetails.error})`
              }`;
              break;
            default:
              typeDisplay = item.actionType || 'Unknown Action';
              statusDisplay = JSON.stringify(actionDetails);
          }

          return {
            id: initialActivities.length + index + 1,
            time: formatTimestamp(item.timestamp),
            type: typeDisplay,
            status: statusDisplay,
          };
        }
        return null;
      }).filter(item => item !== null)
    : [];

  const allActivities = [...initialActivities, ...formattedActivityLog].slice(0, MAX_ITEMS);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = allActivities.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(allActivities.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

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
              <span aria-hidden="true">«</span>
            </a>
          </li>
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
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <a
              className="page-link"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage !== totalPages) handlePageChange(currentPage + 1);
              }}
            >
              <span aria-hidden="true">»</span>
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
          <button className="btn btn-sm btn-outline-danger float-end" onClick={handleGetInitialHistory}>
            Retry
          </button>
        </div>
      ) : (
        <>
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
                currentItems.map((activity) => (
                  <tr key={activity.id}>
                    <td>{activity.time}</td>
                    <td>{activity.type}</td>
                    <td>{activity.status}</td>
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
              {allActivities.length > 0
                ? `Showing ${currentItems.length} in ${allActivities.length} activities`
                : 'No activities to display'}
            </div>
            {allActivities.length > itemsPerPage && renderPagination()}
          </div>
        </>
      )}
    </div>
  );
}