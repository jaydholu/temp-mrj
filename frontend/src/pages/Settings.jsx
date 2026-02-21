import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Mail, Lock, Calendar, MapPin, Globe, 
  BookOpen, Target, Heart, Image, Trash2, Save
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Settings = () => {
  const { user, logout, updateProfile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [profileData, setProfileData] = useState({
    full_name: '',
    username: '',
    email: '',
    bio: '',
    birthdate: '',
    gender: '',
    country: '',
    city: '',
    favorite_genre: '',
    favorite_book: '',
    reading_goal: '',
    hobbies: '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      setProfileData(response.data);
      setProfilePicturePreview(response.data.profile_picture);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be under 10MB');
        return;
      }
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onload = () => setProfilePicturePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const formData = new FormData();
      Object.keys(profileData).forEach(key => {
        if (profileData[key]) {
          formData.append(key, profileData[key]);
        }
      });
      
      if (profilePicture) {
        formData.append('profile_picture', profilePicture);
      }

      await api.put('/users/profile', formData);
      await updateProfile();
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      await api.put('/users/password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      toast.success('Password updated successfully!');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    try {
      await api.delete('/users/profile-picture');
      setProfilePicture(null);
      setProfilePicturePreview(null);
      toast.success('Profile picture removed');
    } catch (error) {
      toast.error('Failed to remove profile picture');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/users/account');
      toast.success('Account deleted successfully');
      logout();
    } catch (error) {
      toast.error('Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading settings..." />;
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Heart },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'danger', label: 'Danger Zone', icon: Trash2 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 
                  dark:from-dark-950 dark:via-dark-900 dark:to-dark-950">
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        <PageHeader
          title="Settings"
          description="Manage your account and preferences"
          icon={User}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Tabs Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl 
                              transition-all duration-200 text-left ${
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  
                  {/* Profile Picture */}
                  <div className="card p-6">
                    <h3 className="text-xl font-bold text-dark-900 dark:text-dark-50 mb-4">
                      Profile Picture
                    </h3>
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        {profilePicturePreview ? (
                          <img
                            src={profilePicturePreview}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover ring-4 ring-primary-500/20"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 
                                        flex items-center justify-center text-white text-3xl font-bold">
                            {profileData.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-3">
                        <input
                          type="file"
                          id="profile-picture"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          className="hidden"
                        />
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="secondary"
                            icon={Image}
                            onClick={() => document.getElementById('profile-picture').click()}
                          >
                            Upload Photo
                          </Button>
                          {profilePicturePreview && (
                            <Button
                              type="button"
                              variant="ghost"
                              icon={Trash2}
                              onClick={handleDeleteProfilePicture}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-dark-500 dark:text-dark-500">
                          JPG, PNG or GIF. Max size 10MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="card p-6 space-y-4">
                    <h3 className="text-xl font-bold text-dark-900 dark:text-dark-50 mb-4">
                      Basic Information
                    </h3>
                    
                    <Input
                      label="Full Name"
                      name="name"
                      icon={User}
                      value={profileData.name}
                      onChange={handleProfileChange}
                      placeholder="John Doe"
                    />

                    <Input
                      label="User ID"
                      name="userid"
                      icon={User}
                      value={profileData.userid}
                      disabled
                      placeholder="johndoe123"
                    />

                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      icon={Mail}
                      value={profileData.email}
                      disabled
                      placeholder="you@example.com"
                    />

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-dark-700 dark:text-dark-300">
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        value={profileData.bio}
                        onChange={handleProfileChange}
                        rows={4}
                        placeholder="Tell us about yourself..."
                        className="input-field resize-none"
                      />
                    </div>
                  </div>

                  {/* Personal Details */}
                  <div className="card p-6 space-y-4">
                    <h3 className="text-xl font-bold text-dark-900 dark:text-dark-50 mb-4">
                      Personal Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Birth Date"
                        name="birthdate"
                        type="date"
                        icon={Calendar}
                        value={profileData.birthdate}
                        onChange={handleProfileChange}
                      />

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-dark-700 dark:text-dark-300">
                          Gender
                        </label>
                        <select
                          name="gender"
                          value={profileData.gender}
                          onChange={handleProfileChange}
                          className="input-field"
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      </div>

                      <Input
                        label="Country"
                        name="country"
                        icon={Globe}
                        value={profileData.country}
                        onChange={handleProfileChange}
                        placeholder="United States"
                      />

                      <Input
                        label="City"
                        name="city"
                        icon={MapPin}
                        value={profileData.city}
                        onChange={handleProfileChange}
                        placeholder="New York"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      icon={Save}
                      loading={saving}
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  
                  <div className="card p-6 space-y-4">
                    <h3 className="text-xl font-bold text-dark-900 dark:text-dark-50 mb-4">
                      Reading Preferences
                    </h3>

                    <Input
                      label="Favorite Genre"
                      name="favorite_genre"
                      icon={BookOpen}
                      value={profileData.favorite_genre}
                      onChange={handleProfileChange}
                      placeholder="e.g., Science Fiction"
                    />

                    <Input
                      label="Favorite Book"
                      name="favorite_book"
                      icon={Heart}
                      value={profileData.favorite_book}
                      onChange={handleProfileChange}
                      placeholder="e.g., 1984 by George Orwell"
                    />

                    <Input
                      label="Annual Reading Goal"
                      name="reading_goal"
                      type="number"
                      icon={Target}
                      value={profileData.reading_goal}
                      onChange={handleProfileChange}
                      placeholder="e.g., 24 books"
                    />

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-dark-700 dark:text-dark-300">
                        Hobbies
                      </label>
                      <textarea
                        name="hobbies"
                        value={profileData.hobbies}
                        onChange={handleProfileChange}
                        rows={3}
                        placeholder="Your other interests and hobbies..."
                        className="input-field resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      icon={Save}
                      loading={saving}
                    >
                      Save Preferences
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  
                  <div className="card p-6 space-y-4">
                    <h3 className="text-xl font-bold text-dark-900 dark:text-dark-50 mb-4">
                      Change Password
                    </h3>

                    <Input
                      label="Current Password"
                      name="current_password"
                      type="password"
                      icon={Lock}
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                    />

                    <Input
                      label="New Password"
                      name="new_password"
                      type="password"
                      icon={Lock}
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                    />

                    <Input
                      label="Confirm New Password"
                      name="confirm_password"
                      type="password"
                      icon={Lock}
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      icon={Save}
                      loading={saving}
                    >
                      Update Password
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="card p-6 border-2 border-red-200 dark:border-red-800">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
                        Delete Account
                      </h3>
                      <p className="text-dark-600 dark:text-dark-400">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                    </div>

                    <div className="glass-strong bg-red-50 dark:bg-red-900/20 p-4 rounded-xl 
                                  border border-red-200 dark:border-red-800">
                      <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                        This will permanently:
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                        <li>Delete all your books and reading data</li>
                        <li>Remove your profile and account information</li>
                        <li>Cancel any active subscriptions</li>
                        <li>This action cannot be undone</li>
                      </ul>
                    </div>

                    <Button
                      variant="danger"
                      icon={Trash2}
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      Delete My Account
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account?"
        message="Are you absolutely sure? This action cannot be undone. All your data will be permanently deleted."
        confirmText="Delete My Account"
        cancelText="Cancel"
        danger
        loading={deleting}
      />
    </div>
  );
};

export default Settings;