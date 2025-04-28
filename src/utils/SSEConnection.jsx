import React, { useEffect, useState } from 'react';

const SSEConnection = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const source = new EventSource(
        `${import.meta.env.VITE_SERVER_URL}/app/events`,
        {withCredentials: true}
    );

    source.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      setNotifications((prev) => [...prev, notification]);
      console.log('Received notification:', notification);
    };

    source.onerror = (error) => {
      console.error('SSE error:', error);
    };
  }, []);

  return (
    <div>
      <h2>Notifications</h2>
      <ul>
        {notifications.map((notif, index) => (
          <li key={index}>
            {notif.notification_type}: {JSON.stringify(notif.data)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SSEConnection;