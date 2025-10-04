import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Profile = () => {
  const { user, getProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profile = await getProfile();
        setProfileData(profile);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [getProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Profile Details</h1>
      <div className="mt-6">
        <p className="text-lg font-semibold">Name: {user.firstName} {user.lastName}</p>
        <p>Email: {user.email}</p>
        <p>Role: {user.role}</p>
        <p>Department: {user.department || 'N/A'}</p>
      </div>
    </div>
  );
};

export default Profile;
