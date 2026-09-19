// services/api.js
import axios from 'axios';

// ✅ Use Vite env variable syntax
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),


  // NEW: OTP-based registration methods
  sendOTP: (userData) => api.post('/auth/otp/send-otp', userData),
  verifyEmailAndRegister: (verificationData) => api.post('/auth/otp/verify-email', verificationData),
  checkVerificationStatus: (firebaseUid) => api.get(`/auth/otp/check-verification/${firebaseUid}`),
  resendVerificationEmail: (firebaseUid) => api.post('/auth/otp/resend-verification', { firebaseUid }),

  getCurrentUser: () => api.get('/auth/me'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// Users API calls
export const usersAPI = {
  getAllUsers: () => api.get('/users'),
  getFriends: () => api.get('/friends'), // ✅ Fixed: matches backend /friends/ route
  searchUsers: (query) => api.get(`/friends/search?query=${encodeURIComponent(query)}`), // ✅ Matches backend
  updateProfile: (userData) => api.put('/users/profile', userData),
  getProfile: () => api.get('/users/profile'),
  updateStatus: (data) => api.put('/users/status', data),
  deleteProfile: () => {
    return api.delete('/users/profile');
  }
};

// Friend Request API calls - ✅ Updated to match your backend routes exactly
export const friendRequestAPI = {
  // Send friend request
  sendRequest: (recipientId, message = '') => 
    api.post('/friends/request', { recipientId, message }),
  
  // Get received friend requests (pending requests sent to me)
  getReceivedRequests: () => api.get('/friends/requests/received'),
  
  // Get sent friend requests (pending requests I sent)
  getSentRequests: () => api.get('/friends/requests/sent'),
  
  // Accept friend request
  acceptRequest: (requestId) => api.put(`/friends/request/${requestId}/accept`),
  
  // Reject friend request
  rejectRequest: (requestId) => api.put(`/friends/request/${requestId}/reject`),
  
  // Remove friend (matches your backend route)
  removeFriend: (friendId) => api.delete(`/friends/remove/${friendId}`),
  
  // ✅ REMOVED: getRequestStatus method since backend doesn't provide it
  // Instead, we'll use the relationshipStatus from search results
};

// Messages API calls
export const messagesAPI = {
  getMessages: (userId) => api.get(`/messages/${userId}`),
  sendMessage: (messageData) => api.post('/messages', messageData),
  // Added for unread message functionality
  getConversation: (userId) => api.get(`/messages/conversation/${userId}`),
  markAsRead: (userId) => api.put(`/messages/read/${userId}`),
};

// Rooms API calls
export const roomsAPI = {
  getRooms: () => api.get('/rooms'),
  createRoom: (roomData) => api.post('/rooms', roomData),
  joinRoom: (roomId) => api.post(`/rooms/${roomId}/join`),
  leaveRoom: (roomId) => api.post(`/rooms/${roomId}/leave`),
};

export default api;