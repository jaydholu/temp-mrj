import api from './axios';

export const booksApi = {
  // Get all books with filters
  getBooks: async (params = {}) => {
    const response = await api.get('/books', { params });
    return response.data;
  },

  // Get single book
  getBook: async (id) => {
    const response = await api.get(`/books/${id}`);
    return response.data;
  },

  // Create book
  createBook: async (formData) => {
    const response = await api.post('/books', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update book
  updateBook: async (id, formData) => {
    const response = await api.put(`/books/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete book
  deleteBook: async (id) => {
    const response = await api.delete(`/books/${id}`);
    return response.data;
  },

  // Toggle favorite
  toggleFavorite: async (id) => {
    const response = await api.patch(`/books/${id}/favorite`);
    return response.data;
  },

  // Get favorites
  getFavorites: async () => {
    const response = await api.get('/books/favorites');
    return response.data;
  },

  // Get stats
  getStats: async () => {
    const response = await api.get('/books/stats');
    return response.data;
  },

  // Upload cover image
  uploadCover: async (id, file) => {
    const formData = new FormData();
    formData.append('cover', file);
    
    const response = await api.post(`/books/${id}/cover`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default booksApi;