export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
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