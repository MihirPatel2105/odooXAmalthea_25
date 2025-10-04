import { useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useApi = () => {
  const get = useCallback(async (url, config = {}) => {
    try {
      const response = await api.get(url, config);
      return response.data;
    } catch (error) {
      console.error(`GET ${url} failed:`, error);
      throw error;
    }
  }, []);

  const post = useCallback(async (url, data, config = {}) => {
    try {
      const response = await api.post(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`POST ${url} failed:`, error);
      throw error;
    }
  }, []);

  const put = useCallback(async (url, data, config = {}) => {
    try {
      const response = await api.put(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`PUT ${url} failed:`, error);
      throw error;
    }
  }, []);

  const del = useCallback(async (url, config = {}) => {
    try {
      const response = await api.delete(url, config);
      return response.data;
    } catch (error) {
      console.error(`DELETE ${url} failed:`, error);
      throw error;
    }
  }, []);

  const patch = useCallback(async (url, data, config = {}) => {
    try {
      const response = await api.patch(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`PATCH ${url} failed:`, error);
      throw error;
    }
  }, []);

  // Helper method for file uploads
  const upload = useCallback(async (url, formData, onProgress) => {
    try {
      const response = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      });
      return response.data;
    } catch (error) {
      console.error(`UPLOAD ${url} failed:`, error);
      throw error;
    }
  }, []);

  // Helper method for downloads
  const download = useCallback(async (url, filename, config = {}) => {
    try {
      const response = await api.get(url, {
        ...config,
        responseType: 'blob',
      });
      
      // Create blob link to download
      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return response.data;
    } catch (error) {
      console.error(`DOWNLOAD ${url} failed:`, error);
      throw error;
    }
  }, []);

  return { 
    get, 
    post, 
    put, 
    delete: del, 
    patch, 
    upload, 
    download 
  };
};

export default useApi;
