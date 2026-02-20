import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, BookOpen, Heart, Calendar, Search } from 'lucide-react';
import Hero from '../components/common/Hero';
import PageHeader from '../components/common/PageHeader';
import StatsCard from '../components/common/StatsCard';
import BookCard from '../components/books/BookCard';
import SearchBar from '../components/common/SearchBar';
import BookFilters from '../components/books/BookFilters';
import EmptyState from '../components/common/EmptyState';
import { BookCardSkeleton } from '../components/common/Skeleton';
import Button from '../components/common/Button';
import { toast } from '../components/common/Toast';
import { useBooks } from '../hooks/useBooks';

const Home = () => {
  const { books, stats, loading, deleteBook, toggleFavorite, searchBooks, fetchStats } = useBooks();
  const [showFilters, setShowFilters] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({});

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearch = (query) => {
    searchBooks({ ...currentFilters, search: query });
  };

  const handleFilterApply = (filters) => {
    setCurrentFilters(filters);
    searchBooks(filters);
  };

  const handleDelete = async (bookId) => {
    try {
      await deleteBook(bookId);
      toast.success('Book deleted successfully');
    } catch (error) {
      toast.error('Failed to delete book');
    }
  };

  const handleFavoriteToggle = async (bookId) => {
    try {
      await toggleFavorite(bookId);
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 
                  dark:from-dark-950 dark:via-dark-900 dark:to-dark-950">
      
      {/* Hero Section */}
      <Hero
        title="Your Reading Journey"
        subtitle="Track, organize, and celebrate every book you read"
        icon={BookOpen}
      >
        <div className="flex flex-wrap gap-4 justify-center pt-6">
          <Link to="/add-book">
            <Button variant="primary" icon={Plus} size="lg">
              Add New Book
            </Button>
          </Link>
          <Link to="/favorites">
            <Button variant="secondary" icon={Heart} size="lg">
              View Favorites
            </Button>
          </Link>
        </div>
      </Hero>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          <StatsCard
            title="Total Books"
            value={stats?.total_books || 0}
            icon={BookOpen}
            color="primary"
            index={0}
          />
          <StatsCard
            title="Books Finished"
            value={stats?.books_finished || 0}
            icon={TrendingUp}
            color="success"
            trend="up"
            trendValue="+12% this month"
            index={1}
          />
          <StatsCard
            title="Favorites"
            value={stats?.favorites_count || 0}
            icon={Heart}
            color="warning"
            index={2}
          />
          <StatsCard
            title="Currently Reading"
            value={stats?.currently_reading || 0}
            icon={Calendar}
            color="info"
            index={3}
          />
        </motion.div>

        {/* Average Rating */}
        {stats?.average_rating > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card p-6 mb-12 text-center"
          >
            <div className="inline-flex items-center gap-4">
              <div className="text-5xl font-bold text-gradient">
                {stats.average_rating.toFixed(1)}
              </div>
              <div className="text-left">
                <div className="text-dark-900 dark:text-dark-50 font-semibold">
                  Average Rating
                </div>
                <div className="text-sm text-dark-600 dark:text-dark-400">
                  Across {stats.total_books} books
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search & Filters */}
        <div className="mb-8">
          <SearchBar
            onSearch={handleSearch}
            onFilterToggle={() => setShowFilters(true)}
            placeholder="Search by title, author, or genre..."
            showFilters
          />
        </div>

        {/* Books Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-dark-900 dark:text-dark-50">
              Your Library
              {books.length > 0 && (
                <span className="ml-3 text-lg font-normal text-dark-600 dark:text-dark-400">
                  ({books.length} {books.length === 1 ? 'book' : 'books'})
                </span>
              )}
            </h2>

            {books.length > 0 && (
              <div className="flex gap-2">
                <select className="input-field text-sm py-2">
                  <option value="date_desc">Recently Added</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="title_asc">Title (A-Z)</option>
                  <option value="title_desc">Title (Z-A)</option>
                  <option value="rating_desc">Highest Rated</option>
                  <option value="rating_asc">Lowest Rated</option>
                </select>
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <BookCardSkeleton key={i} />
              ))}
            </div>
          ) : books.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No books yet"
              description="Start building your library by adding your first book"
              action={
                <Link to="/add-book">
                  <Button variant="primary" icon={Plus}>
                    Add Your First Book
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((book, index) => (
                <BookCard
                  key={book.id}
                  book={book}
                  index={index}
                  onDelete={handleDelete}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      <BookFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleFilterApply}
        initialFilters={currentFilters}
      />
    </div>
  );
};

export default Home;