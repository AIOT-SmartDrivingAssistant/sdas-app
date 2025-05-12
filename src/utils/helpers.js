export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export const mapServiceType = (type) => {
  const typeMap = {
    driver_monitoring: 'Driver monitoring',
    air_cond_service: 'Air conditioning',
    smart_headlights: 'Smart headlights',
    headlight: 'Smart headlights',
    air_cond_temp: 'Air conditioning temperature',
  };
  return typeMap[type] || type;
};

export const handleRefreshToken = async (navigate, clearUserContext) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/refresh`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    return true;
  } catch (error) {
    console.error('Refresh token failed:', error);
    clearUserContext();
    navigate('/login');
    return false;
  }
};