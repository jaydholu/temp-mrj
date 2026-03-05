import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Plus, Star, Trash2, Edit, ShoppingCart, 
  DollarSign, ExternalLink, ArrowRight, Sparkles
} from 'lucide-react';
import Hero from '../components/common/Hero';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { BookCardSkeleton } from '../components/common/Skeleton';
import { toast } from '../components/common/Toast';
import api from '../api/axios';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [sortBy, setSortBy] = useState('priority_desc');
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    genre: '',
    priority: 3,
    notes: '',
    price: '',
    where_to_buy: '',
  });

  useEffect(() => {
    loadWishlist();
  }, [sortBy]);

  const loadWishlist = async () => {
    try {
      const response = await api.get('/wishlist', {
        params: { sort: sortBy, limit: 100 }
      });
      setWishlist(response.data.wishlist || []);
    } catch (error) {
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      isbn: '',
      genre: '',
      priority: 3,
      notes: '',
      price: '',
      where_to_buy: '',
    });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    
    try {
      const response = await api.post('/wishlist', {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
      });
      
      setWishlist(prev => [response.data, ...prev]);
      toast.success('Added to wishlist!');
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add item');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await api.put(`/wishlist/${editingItem.id}`, {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
      });
      
      setWishlist(prev => prev.map(item => 
        item.id === editingItem.id ? response.data : item
      ));
      toast.success('Wishlist item updated!');
      setShowEditModal(false);
      setEditingItem(null);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update item');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    
    try {
      await api.delete(`/wishlist/${deletingItem.id}`);
      setWishlist(prev => prev.filter(item => item.id !== deletingItem.id));
      toast.success('Removed from wishlist');
      setShowDeleteDialog(false);
      setDeletingItem(null);
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleMoveToLibrary = async (item) => {
    try {
      await api.post(`/wishlist/${item.id}/move-to-library`);
      setWishlist(prev => prev.filter(i => i.id !== item.id));
      toast.success('Book moved to your library!');
    } catch (error) {
      toast.error('Failed to move book');
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      author: item.author || '',
      isbn: item.isbn || '',
      genre: item.genre || '',
      priority: item.priority || 3,
      notes: item.notes || '',
      price: item.price || '',
      where_to_buy: item.where_to_buy || '',
    });
    setShowEditModal(true);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      1: 'text-dark-400 bg-dark-100 dark:bg-dark-800',
      2: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
      3: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
      4: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
      5: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    };
    return colors[priority] || colors[3];
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      1: 'Low',
      2: 'Medium-Low',
      3: 'Medium',
      4: 'High',
      5: 'Very High',
    };
    return labels[priority] || 'Medium';
  };

  const WishlistForm = ({ onSubmit, submitLabel }) => (
    <form onSubmit={onSubmit} className="space-y-5">
      <Input
        label="Book Title"
        name="title"
        value={formData.title}
        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
        placeholder="Enter book title"
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Author"
          name="author"
          value={formData.author}
          onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
          placeholder="Author name"
        />

        <Input
          label="Genre"
          name="genre"
          value={formData.genre}
          onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
          placeholder="e.g., Fiction, Mystery"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="ISBN (optional)"
          name="isbn"
          value={formData.isbn}
          onChange={(e) => setFormData(prev => ({ ...prev, isbn: e.target.value }))}
          placeholder="ISBN-10 or ISBN-13"
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-dark-700 dark:text-dark-300">
            Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
            className="input-field"
          >
            <option value={1}>⭐ Low</option>
            <option value={2}>⭐⭐ Medium-Low</option>
            <option value={3}>⭐⭐⭐ Medium</option>
            <option value={4}>⭐⭐⭐⭐ High</option>
            <option value={5}>⭐⭐⭐⭐⭐ Very High</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Price (optional)"
          name="price"
          type="number"
          step="0.01"
          icon={DollarSign}
          value={formData.price}
          onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
          placeholder="0.00"
        />

        <Input
          label="Where to Buy"
          name="where_to_buy"
          value={formData.where_to_buy}
          onChange={(e) => setFormData(prev => ({ ...prev, where_to_buy: e.target.value }))}
          placeholder="Amazon, local bookstore, etc."
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-dark-700 dark:text-dark-300">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          placeholder="Why you want to read this book..."
          className="input-field resize-none"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            resetForm();
          }}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 
                  dark:from-dark-950 dark:via-dark-900 dark:to-dark-950">
      
      {/* Hero Section */}
      <Hero
        title="My Wishlist"
        subtitle="Books you're excited to read next"
        gradient={false}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="inline-flex items-center gap-2 px-6 py-3 glass-strong rounded-full"
        >
          <Sparkles className="text-purple-500" size={24} />
          <span className="text-2xl font-bold text-dark-900 dark:text-dark-50">
            {wishlist.length} {wishlist.length === 1 ? 'Book' : 'Books'}
          </span>
        </motion.div>
      </Hero>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowAddModal(true)}
            >
              Add to Wishlist
            </Button>
          </div>

          {wishlist.length > 0 && (
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field text-sm py-2 w-full sm:w-auto"
            >
              <option value="priority_desc">Highest Priority</option>
              <option value="priority_asc">Lowest Priority</option>
              <option value="date_desc">Recently Added</option>
              <option value="date_asc">Oldest First</option>
              <option value="title_asc">Title (A-Z)</option>
            </select>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : wishlist.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty"
            description="Start adding books you want to read"
            action={
              <Button variant="primary" icon={Plus} onClick={() => setShowAddModal(true)}>
                Add First Book
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card-hover p-6 space-y-4"
              >
                {/* Priority Badge */}
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                    {getPriorityLabel(item.priority)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 
                               flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingItem(item);
                        setShowDeleteDialog(true);
                      }}
                      className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 
                               flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Title & Author */}
                <div>
                  <h3 className="font-bold text-lg text-dark-900 dark:text-dark-50 line-clamp-2 mb-1">
                    {item.title}
                  </h3>
                  {item.author && (
                    <p className="text-sm text-dark-600 dark:text-dark-400 italic">
                      by {item.author}
                    </p>
                  )}
                </div>

                {/* Genre */}
                {item.genre && (
                  <span className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900/30 
                                 text-primary-700 dark:text-primary-300 rounded-full text-xs">
                    {item.genre}
                  </span>
                )}

                {/* Notes */}
                {item.notes && (
                  <p className="text-sm text-dark-600 dark:text-dark-400 line-clamp-2">
                    {item.notes}
                  </p>
                )}

                {/* Price & Where to Buy */}
                <div className="flex items-center justify-between text-sm">
                  {item.price && (
                    <span className="text-dark-700 dark:text-dark-300 font-medium">
                      ${parseFloat(item.price).toFixed(2)}
                    </span>
                  )}
                  {item.where_to_buy && (
                    <a
                      href={item.where_to_buy.startsWith('http') ? item.where_to_buy : `https://${item.where_to_buy}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                    >
                      Buy <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                {/* Action Button */}
                <Button
                  variant="primary"
                  icon={ArrowRight}
                  onClick={() => handleMoveToLibrary(item)}
                  className="w-full"
                  size="sm"
                >
                  Move to Library
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add to Wishlist"
        size="lg"
      >
        <WishlistForm onSubmit={handleAdd} submitLabel="Add to Wishlist" />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingItem(null);
          resetForm();
        }}
        title="Edit Wishlist Item"
        size="lg"
      >
        <WishlistForm onSubmit={handleEdit} submitLabel="Save Changes" />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeletingItem(null);
        }}
        onConfirm={handleDelete}
        title="Remove from Wishlist?"
        message={
          <>
            Are you sure you want to remove <strong>"{deletingItem?.title}"</strong> from your wishlist?
          </>
        }
        confirmText="Remove"
        cancelText="Cancel"
        danger
      />
    </div>
  );
};

export default Wishlist;