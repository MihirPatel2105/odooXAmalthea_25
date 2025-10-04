import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import Button from '../../components/common/Button';

const ROLES = ['employee', 'manager', 'admin', 'auditor'];

const UserCreate = () => {
  const navigate = useNavigate();
  const { post } = useApi();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    department: '',
    role: 'employee',
    managerId: '',
    isActive: true
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [managers, setManagers] = useState([]);
  useEffect(() => {
    // Fetch managers/admins for dropdown
    const fetchManagers = async () => {
      try {
        const response = await get('/users?role=manager');
        setManagers(response.data.users.filter(u => ['manager', 'admin'].includes(u.role)));
      } catch (err) {
        setManagers([]);
      }
    };
    fetchManagers();
  }, [get]);

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
  await post('/users', form);
      navigate('/admin/users');
    } catch (err) {
      setError('Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Create User</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">First Name</label>
          <input type="text" name="firstName" value={form.firstName} onChange={handleChange} className="input w-full" required />
        </div>
        <div>
          <label className="block font-medium">Last Name</label>
          <input type="text" name="lastName" value={form.lastName} onChange={handleChange} className="input w-full" required />
        </div>
        <div>
          <label className="block font-medium">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} className="input w-full" required />
        </div>
        <div>
          <label className="block font-medium">Password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} className="input w-full" required minLength={6} />
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
          <label className="block font-medium">Manager</label>
          <select name="managerId" value={form.managerId} onChange={handleChange} className="input w-full">
            <option value="">None</option>
            {managers.map((manager) => (
              <option key={manager._id} value={manager._id}>
                {manager.firstName} {manager.lastName} ({manager.role})
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center">
          <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
          <label className="ml-2">Active</label>
        </div>
        <div className="flex space-x-2">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Creating...' : 'Create User'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/users')}>
            Cancel
          </Button>
        </div>
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </form>
    </div>
  );
};

export default UserCreate;
