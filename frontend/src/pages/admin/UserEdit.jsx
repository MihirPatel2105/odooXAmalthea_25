import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import Button from '../../components/common/Button';

const ROLES = ['admin', 'manager', 'employee', 'auditor'];

const UserEdit = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { get, put } = useApi();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    role: '',
    managerId: '',
    isActive: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
  const response = await get(`/users/${userId}`);
        setUser(response.data.user);
        setForm({
          firstName: response.data.user.firstName || '',
          lastName: response.data.user.lastName || '',
          email: response.data.user.email || '',
          department: response.data.user.department || '',
          role: response.data.user.role || '',
          managerId: response.data.user.managerId?._id || '',
          isActive: response.data.user.isActive
        });
      } catch (err) {
        setError('Failed to load user');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [get, userId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
  await put(`/users/${userId}`, form);
      navigate('/admin/users');
    } catch (err) {
      setError('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Edit User</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">First Name</label>
          <input type="text" name="firstName" value={form.firstName} onChange={handleChange} className="input w-full" />
        </div>
        <div>
          <label className="block font-medium">Last Name</label>
          <input type="text" name="lastName" value={form.lastName} onChange={handleChange} className="input w-full" />
        </div>
        <div>
          <label className="block font-medium">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} className="input w-full" disabled />
        </div>
        <div>
          <label className="block font-medium">Department</label>
          <input type="text" name="department" value={form.department} onChange={handleChange} className="input w-full" />
        </div>
        <div>
          <label className="block font-medium">Role</label>
          <select name="role" value={form.role} onChange={handleChange} className="input w-full">
            {ROLES.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium">Manager ID</label>
          <input type="text" name="managerId" value={form.managerId} onChange={handleChange} className="input w-full" />
        </div>
        <div className="flex items-center">
          <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
          <label className="ml-2">Active</label>
        </div>
        <div className="flex space-x-2">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/users')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserEdit;
