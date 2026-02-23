import api from './axios';

export const usersApi = {
  // Get profile
  getProfile: async () => {
    const response = await api.get('/user/account/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (formData) => {
    const response = await api.put('/user/account/profile/update', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload profile picture
  uploadProfilePicture: async (file) => {
    const formData = new FormData();
    formData.append('profile_picture', file);
    
    const response = await api.post('/user/account/profile/picture/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete profile picture
  deleteProfilePicture: async () => {
    const response = await api.delete('/user/account/profile/picture/delete');
    return response.data;
  },

  // Update password
  updatePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/user/account/password/change', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  // Delete account
  deleteAccount: async () => {
    const response = await api.delete('/user/account/delete');
    return response.data;
  },
};

export default usersApi;