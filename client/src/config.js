// API Configuration
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "https://getsocialnow.onrender.com";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    GOOGLE: `${API_BASE_URL}/auth/google`,
  },
  USERS: {
    GET_USER: (id) => `${API_BASE_URL}/users/${id}`,
    UPDATE_USER: (id) => `${API_BASE_URL}/users/${id}/update`,
    SEARCH: (query) =>
      `${API_BASE_URL}/users/search/${encodeURIComponent(query)}`,
    GET_FRIENDS: (id) => `${API_BASE_URL}/users/${id}/friends`,
    ADD_REMOVE_FRIEND: (id, friendId) =>
      `${API_BASE_URL}/users/${id}/${friendId}`,
  },
  POSTS: {
    CREATE: `${API_BASE_URL}/posts`,
    GET_FEED: (page = 1, limit = 10) =>
      `${API_BASE_URL}/posts?page=${page}&limit=${limit}`,
    GET_USER_POSTS: (userId, page = 1, limit = 10) =>
      `${API_BASE_URL}/posts/${userId}/posts?page=${page}&limit=${limit}`,
    LIKE: (id) => `${API_BASE_URL}/posts/${id}/like`,
    COMMENT: (id) => `${API_BASE_URL}/posts/${id}/comment`,
    LIKE_COMMENT: (postId, commentId) =>
      `${API_BASE_URL}/posts/${postId}/comment/${commentId}/like`,
    DELETE: (id) => `${API_BASE_URL}/posts/${id}/delete`,
    DELETE_COMMENT: (postId, commentId) =>
      `${API_BASE_URL}/posts/${postId}/comment/${commentId}/delete`,
  },
  HEALTH: `${API_BASE_URL}/health`,
};
