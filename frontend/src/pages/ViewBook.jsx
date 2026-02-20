import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Edit, Trash2, Calendar, User, BookOpen, 
  FileText, Globe, Package, Hash, Building
} from 'lucide-react';
import { format } from 'date-fns';
import Button from '../components/common/Button';
import StarRating from '../components/books/StarRating';
import FavoriteButton from '../components/books/FavoriteButton';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from '../components/common/Toast';
import { useBooks } from '../hooks/useBooks';

const ViewBook = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getBook, deleteBook, toggleFavorite } = useBooks();
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadBook();
  }, [id]);

  const loadBook = async () => {
    try {
      const data = await getBook(id);
      setBook(data);
    } catch (error) {
      toast.error('Failed to load book');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteBook(id);
      toast.success('Book deleted successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to delete book');
    } finally {
      setDeleting(false);
    }
  };

  const handleFavoriteToggle = async () => {
    try {
      await toggleFavorite(id);
      setBook(prev => ({ ...prev, is_favorite: !prev.is_favorite }));
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading book details..." />;
  }

  if (!book) {
    return null;
  }

  const InfoItem = ({ icon: Icon, label, value }) => {
    if (!value) return null;
    
    return (
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 
                      flex items-center justify-center flex-shrink-0">
          <Icon className="text-primary-600 dark:text-primary-400" size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-dark-500 dark:text-dark-500">{label}</div>
          <div className="font-medium text-dark-900 dark:text-dark-50 break-words">
            {value}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 
                  dark:from-dark-950 dark:via-dark-900 dark:to-dark-950">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Cover & Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            
            {/* Cover Image */}
            <div className="card p-0 overflow-hidden">
              <div className="relative">
                {book.cover_image ? (
                  <img
                    src={book.cover_image}
                    alt={`${book.title} cover`}
                    className="w-full h-[600px] object-cover"
                  />
                ) : (
                  <div className="w-full h-[600px] bg-gradient-to-br from-dark-100 to-dark-200 
                                dark:from-dark-800 dark:to-dark-900 flex items-center justify-center">
                    <BookOpen className="w-32 h-32 text-dark-400 dark:text-dark-600" />
                  </div>
                )}
                
                {/* Favorite Button */}
                <div className="absolute top-4 right-4">
                  <FavoriteButton
                    isFavorite={book.is_favorite}
                    onToggle={handleFavoriteToggle}
                    size="lg"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="card p-6 space-y-3">
              <Link to={`/books/${id}/edit`}>
                <Button variant="secondary" icon={Edit} className="w-full">
                  Edit Book
                </Button>
              </Link>
              <Button
                variant="danger"
                icon={Trash2}
                onClick={() => setShowDeleteDialog(true)}
                className="w-full"
              >
                Delete Book
              </Button>
            </div>
          </motion.div>

          {/* Right Column - Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            
            {/* Title & Meta */}
            <div className="card p-8">
              <div className="space-y-4">
                <div>
                  {book.genre && (
                    <span className="inline-block px-4 py-1 bg-primary-100 dark:bg-primary-900/30 
                                   text-primary-700 dark:text-primary-300 rounded-full text-sm 
                                   font-medium mb-3">
                      {book.genre}
                    </span>
                  )}
                  <h1 className="text-4xl md:text-5xl font-bold font-serif text-dark-900 dark:text-dark-50">
                    {book.title}
                  </h1>
                </div>

                {book.author && (
                  <p className="text-xl text-dark-600 dark:text-dark-400 flex items-center gap-2">
                    <User size={20} />
                    <span className="italic">by {book.author}</span>
                  </p>
                )}

                {book.rating > 0 && (
                  <div className="flex items-center gap-4">
                    <StarRating rating={book.rating} size="lg" readonly />
                    <span className="text-2xl font-bold text-dark-900 dark:text-dark-50">
                      {book.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Reading Info */}
            <div className="card p-8">
              <h2 className="text-2xl font-bold text-dark-900 dark:text-dark-50 mb-6">
                Reading Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoItem
                  icon={Calendar}
                  label="Started Reading"
                  value={book.reading_started ? 
                    format(new Date(book.reading_started), 'MMMM dd, yyyy') : null}
                />
                <InfoItem
                  icon={Calendar}
                  label="Finished Reading"
                  value={book.reading_finished ? 
                    format(new Date(book.reading_finished), 'MMMM dd, yyyy') : 'Currently Reading'}
                />
              </div>
            </div>

            {/* Book Details */}
            <div className="card p-8">
              <h2 className="text-2xl font-bold text-dark-900 dark:text-dark-50 mb-6">
                Book Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoItem icon={Hash} label="ISBN" value={book.isbn} />
                <InfoItem icon={Building} label="Publisher" value={book.publisher} />
                <InfoItem 
                  icon={Calendar} 
                  label="Publication Year" 
                  value={book.publication_year} 
                />
                <InfoItem icon={Globe} label="Language" value={book.language} />
                <InfoItem 
                  icon={BookOpen} 
                  label="Page Count" 
                  value={book.page_count ? `${book.page_count} pages` : null} 
                />
                <InfoItem 
                  icon={Package} 
                  label="Format" 
                  value={book.format ? book.format.charAt(0).toUpperCase() + book.format.slice(1) : null} 
                />
              </div>
            </div>

            {/* Description */}
            {book.description && (
              <div className="card p-8">
                <h2 className="text-2xl font-bold text-dark-900 dark:text-dark-50 mb-4">
                  Your Review
                </h2>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-dark-700 dark:text-dark-300 whitespace-pre-wrap">
                    {book.description}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Book?"
        message={
          <>
            Are you sure you want to delete <strong>"{book.title}"</strong>? 
            This action cannot be undone.
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        danger
        loading={deleting}
      />
    </div>
  );
};

export default ViewBook;