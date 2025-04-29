import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';

const mock = new MockAdapter(axios);

// Biến lưu trạng thái dịch vụ (giả lập server)
let mockServicesState = {
  air_cond_service: 'on',
  drowsiness_service: 'on',
  headlight_service: 'off',
  dist_service: 'on',
};

// Mock GET /user/
mock.onGet(/\/user\//).reply(200, {
  username: 'test_user',
  name: 'Test User',
  email: 'test@example.com',
  phone: '1234567890',
  address: '123 Test St, City',
  date_of_birth: '25-01-1990',
});

// Mock GET /app/config
mock.onGet(/\/app\/config/).reply(200, mockServicesState);

// Mock GET /app/sensor_data
mock.onGet(/\/app\/sensor_data/).reply((config) => {
  const sensorTypes = config.params.sensor_types.split(',');
  const sensorData = sensorTypes.map((type) => {
    let value;
    switch (type) {
      case 'temp':
        value = (Math.random() * 10 + 20).toFixed(1);
        break;
      case 'humid':
        value = (Math.random() * 50 + 30).toFixed(1);
        break;
      case 'lux':
        value = (Math.random() * 100).toFixed(1);
        break;
      case 'dist':
        value = (Math.random() * 200).toFixed(1);
        break;
      default:
        value = 0;
    }
    return { sensor_type: type, value };
  });
  return [200, sensorData];
});

// Mock PATCH /iot/service
mock.onPatch(/\/iot\/service/).reply((config) => {
  const data = JSON.parse(config.data);
  const serviceType = Object.keys(data)[0];
  const serviceValue = data[serviceType];

  // Cập nhật trạng thái dịch vụ trong mockServicesState
  mockServicesState = {
    ...mockServicesState,
    [serviceType]: serviceValue,
  };

  return [
    200,
    {
      [serviceType]: serviceValue,
    },
  ];
});

// Mock POST /iot/service
mock.onPost(/\/iot\/service/).reply((config) => {
  const data = JSON.parse(config.data);
  return [
    200,
    {
      service_type: data.service_type,
      value: data.value,
      status: 'success',
    },
  ];
});

// Mock SSE /app/events (giả lập thông báo)
const mockNotifications = [
  {
    device_id: 'device_001',
    service_type: 'air_cond_service',
    notification: 'Temperature exceeds 30°C!',
  },
  {
    device_id: 'device_001',
    service_type: 'drowsiness_service',
    notification: 'Driver appears distracted!',
  },
];

// Giả lập gửi thông báo SSE
let notificationIndex = 0;
setInterval(() => {
  if (notificationIndex < mockNotifications.length) {
    const event = new MessageEvent('message', {
      data: JSON.stringify(mockNotifications[notificationIndex]),
    });
    mock.onGet(/\/app\/events/).reply(200, event.data);
    notificationIndex++;
  }
}, 5000);

export default mock;