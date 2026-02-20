import { useState, useCallback } from 'react';
import { booksApi } from '../api/books';

export const useBooks = () => {
  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get all books
  const fetchBooks = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await booksApi.getBooks(params);
      setBooks(data);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get single book
  const getBook = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await booksApi.getBook(id);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create book
  const createBook = useCallback(async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await booksApi.createBook(formData);
      setBooks(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update book
  const updateBook = useCallback(async (id, formData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await booksApi.updateBook(id, formData);
      setBooks(prev => prev.map(book => book.id === id ? data : book));
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete book
  const deleteBook = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await booksApi.deleteBook(id);
      setBooks(prev => prev.filter(book => book.id !== id));
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback(async (id) => {
    try {
      const data = await booksApi.toggleFavorite(id);
      setBooks(prev => prev.map(book => 
        book.id === id ? { ...book, is_favorite: data.is_favorite } : book
      ));
      return data;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  // Get favorites
  const getFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await booksApi.getFavorites();
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get stats
  const fetchStats = useCallback(async () => {
    setError(null);
    try {
      const data = await booksApi.getStats();
      setStats(data);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  // Search books
  const searchBooks = useCallback(async (filters) => {
    return fetchBooks(filters);
  }, [fetchBooks]);

  return {
    books,
    stats,
    loading,
    error,
    fetchBooks,
    getBook,
    createBook,
    updateBook,
    deleteBook,
    toggleFavorite,
    getFavorites,
    fetchStats,
    searchBooks,
  };
};

export default useBooks;