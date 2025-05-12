import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../components/Home/activityHistory.module.css';
import { useUserContext } from '../hooks/UserContext.jsx';
import { formatTimestamp, mapServiceType, handleRefreshToken } from '../utils/helpers.js';

export default function ActivityHistory() {
  const navigate = useNavigate();
  const { actionHistory, addActionHistory, clearUserContext } = useUserContext();
  const [initialActivities, setInitialActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const MAX_PAGES = 5;
  const MAX_ITEMS = MAX_PAGES * itemsPerPage;

  const handleGetInitialHistory = async (retry = true) => {
    if (actionHistory && actionHistory.length >= 4) {
      const formattedInitialActivities = actionHistory.map((item, index) => ({
        id: index + 1,
        time: formatTimestamp(item.timestamp),
        type: mapServiceType(item.service_type),
        status: item.description,
      }));
      setInitialActivities(formattedInitialActivities);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/app/action_history`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 401 && retry) {
        const refreshed = await handleRefreshToken(navigate, clearUserContext);
        if (refreshed) {
          return handleGetInitialHistory(false);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Action history fetched successfully: ', data);
      await addActionHistory(data);

      const formattedInitialActivities = data.map((item, index) => ({
        id: index + 1,
        time: formatTimestamp(item.timestamp),
        type: mapServiceType(item.service_type),
        status: item.description,
      }));
      setInitialActivities(formattedInitialActivities);
    } catch (error) {
      console.error('Error fetching action history:', error);
      const errorMessage = error.message.includes('401')
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

  const allActivities = useMemo(() => {
    return initialActivities
      .filter((item, index, self) => {
        const key = `${item.time}-${item.type}-${item.status}`;
        return index === self.findIndex((t) => `${t.time}-${t.type}-${t.status}` === key);
      })
      .slice(0, MAX_ITEMS);
  }, [initialActivities]);

  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return allActivities.slice(indexOfFirstItem, indexOfLastItem);
  }, [allActivities, currentPage, itemsPerPage]);

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
          <button
            className="btn btn-sm btn-outline-danger float-end"
            onClick={() => handleGetInitialHistory()}
          >
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