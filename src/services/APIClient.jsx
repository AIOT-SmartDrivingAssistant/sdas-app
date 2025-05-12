let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, success) => {
    failedQueue.forEach((prom) => {
        if (success) {
            prom.resolve(success);
        } else {
            prom.reject(error);
        }
    });
    failedQueue = [];
};

async function apiClient(method, url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    const fetchOptions = {
        method,
        headers,
        credentials: 'include',
        ...(options.body && { body: options.body }),
        ...options,
    };

    // eslint-disable-next-line no-useless-catch
    try {
        const response = await fetch(url, fetchOptions);
        const data = await response.json();

        if (!response.ok) {
            if (
                response.status === 401 &&
                data?.detail === 'Invalid or expired session token' &&
                !fetchOptions._retry
            ) {
                fetchOptions._retry = true;

                if (isRefreshing) {
                    // Queue the request until the token is refreshed
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    })
                        .then(async () => {
                            const res = await fetch(url, fetchOptions);
                            return await res.json();
                        })
                        .catch((err) => Promise.reject(err));
                }

                isRefreshing = true;

                try {
                    const refreshResponse = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/refresh`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                    });
                    const refreshData = await refreshResponse.json();

                    if (!refreshResponse.ok) {
                        throw new Error(refreshData.message || 'Token refresh failed');
                    }
                    
                    processQueue(null, true);
                    const retryResponse = await fetch(url, fetchOptions);
                    return retryResponse.json();
                } catch (refreshError) {
                    processQueue(refreshError);
                    window.dispatchEvent(new CustomEvent('refresh_fail'));
                    throw refreshError;
                } finally {
                    isRefreshing = false;
                }
            }
            console.error(data);
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

export default apiClient;