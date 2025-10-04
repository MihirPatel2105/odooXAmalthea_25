import React from 'react';
import CompanySettings from '../../components/admin/CompanySettings';

const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your company settings and configurations.
        </p>
      </div>
      
      <CompanySettings />
    </div>
  );
};

export default Settings;
