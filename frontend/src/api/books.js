import api from './axios';

export const booksApi = {
  // Get all books with filters
  getBooks: async (params = {}) => {
    const response = await api.get('/books', { params });
    return response.data;
  },

  // Get single book
  getBook: async (id) => {
    const response = await api.get(`/books/book/${id}`);
    return response.data;
  },

  // Create book — sends JSON (cover image uploaded separately)
  createBook: async (formData) => {
    // Convert FormData to a plain JSON object
    const data = {};
    for (const [key, value] of formData.entries()) {
      if (key !== 'cover_image') {
        data[key] = value === '' ? null : value;
      }
    }
    // Convert numeric fields from string to number
    if (data.rating !== null && data.rating !== undefined) data.rating = parseFloat(data.rating) || 0;
    if (data.page_count) data.page_count = parseInt(data.page_count);
    if (data.publication_year) data.publication_year = parseInt(data.publication_year);

    const response = await api.post('/books/', data);

    // If there's a cover image, upload it separately
    const coverImage = formData.get('cover_image');
    if (coverImage && coverImage.size > 0 && response.data?.id) {
      try {
        await booksApi.uploadCover(response.data.id, coverImage);
      } catch (e) {
        console.warn('Cover upload failed, but book was created:', e);
      }
    }

    return response.data;
  },

  // Update book — sends JSON (cover image uploaded separately)
  updateBook: async (id, formData) => {
    // Convert FormData to a plain JSON object
    const data = {};
    for (const [key, value] of formData.entries()) {
      if (key !== 'cover_image') {
        data[key] = value === '' ? null : value;
      }
    }
    // Convert numeric fields from string to number
    if (data.rating !== null && data.rating !== undefined) data.rating = parseFloat(data.rating) || 0;
    if (data.page_count) data.page_count = parseInt(data.page_count);
    if (data.publication_year) data.publication_year = parseInt(data.publication_year);

    const response = await api.put(`/books/book/${id}`, data);

    // If there's a cover image, upload it separately
    const coverImage = formData.get('cover_image');
    if (coverImage && coverImage.size > 0) {
      try {
        await booksApi.uploadCover(id, coverImage);
      } catch (e) {
        console.warn('Cover upload failed, but book was updated:', e);
      }
    }

    return response.data;
  },

  // Delete book
  deleteBook: async (id) => {
    const response = await api.delete(`/books/book/${id}`);
    return response.data;
  },

  // Toggle favorite
  toggleFavorite: async (id) => {
    const response = await api.patch(`/books/book/${id}/favorite`);
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
    const coverFormData = new FormData();
    coverFormData.append('file', file);

    const response = await api.post(`/books/book/${id}/cover`, coverFormData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default booksApi;