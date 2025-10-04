import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import { useApi } from '../../hooks/useApi';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

const ApprovalRules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const { get, post, put, del } = useApi();

  useEffect(() => {
    fetchApprovalRules();
  }, []);

  const fetchApprovalRules = async () => {
    try {
      setLoading(true);
      const response = await get('/admin/approval-rules');
      setRules(response.data.rules);
    } catch (error) {
      console.error('Failed to fetch approval rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = () => {
    setSelectedRule(null);
    setShowModal(true);
  };

  const handleEditRule = (rule) => {
    setSelectedRule(rule);
    setShowModal(true);
  };

  const handleDeleteRule = async (ruleId) => {
    if (window.confirm('Are you sure you want to delete this approval rule?')) {
      try {
        await del(`/admin/approval-rules/${ruleId}`);
        toast.success('Approval rule deleted successfully');
        fetchApprovalRules();
      } catch (error) {
        toast.error('Failed to delete approval rule');
        console.error('Failed to delete rule:', error);
      }
    }
  };

  const handleSaveRule = async (ruleData) => {
    try {
      if (selectedRule) {
        await put(`/admin/approval-rules/${selectedRule._id}`, ruleData);
        toast.success('Approval rule updated successfully');
      } else {
        await post('/admin/approval-rules', ruleData);
        toast.success('Approval rule created successfully');
      }
      setShowModal(false);
      fetchApprovalRules();
    } catch (error) {
      toast.error('Failed to save approval rule');
      console.error('Failed to save rule:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Approval Rules</h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure automated approval workflows for expenses.
          </p>
        </div>
        <Button
          onClick={handleCreateRule}
          icon={<PlusIcon className="h-4 w-4" />}
        >
          Create Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="card text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No approval rules</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create your first approval rule to automate expense approvals.
          </p>
          <div className="mt-6">
            <Button onClick={handleCreateRule}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rules.map((rule) => (
            <div key={rule._id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                  <p className="text-sm text-gray-600">{rule.description}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  rule.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {rule.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm">
                  <span className="text-gray-500">Amount Range:</span>
                  <span className="ml-2 font-medium">
                    {formatCurrency(rule.conditions.amountRange.min)} - {formatCurrency(rule.conditions.amountRange.max)}
                  </span>
                </div>
                
                {rule.conditions.categories.length > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-500">Categories:</span>
                    <span className="ml-2 font-medium">
                      {rule.conditions.categories.join(', ')}
                    </span>
                  </div>
                )}

                <div className="text-sm">
                  <span className="text-gray-500">Approval Steps:</span>
                  <span className="ml-2 font-medium">
                    {rule.approvalFlow.length}
                  </span>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditRule(rule)}
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDeleteRule(rule._id)}
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ApprovalRuleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        rule={selectedRule}
        onSave={handleSaveRule}
      />
    </div>
  );
};

const ApprovalRuleModal = ({ isOpen, onClose, rule, onSave }) => {
  // This would be a complex form for creating/editing approval rules
  // Implementation would include form fields for rule conditions, approval flow, etc.
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={rule ? 'Edit Approval Rule' : 'Create Approval Rule'}
      size="lg"
    >
      <div className="p-4">
        <p className="text-gray-600">
          Approval rule form implementation would go here with fields for:
        </p>
        <ul className="mt-2 text-sm text-gray-500 list-disc list-inside">
          <li>Rule name and description</li>
          <li>Amount range conditions</li>
          <li>Category filters</li>
          <li>Department filters</li>
          <li>Approval flow steps</li>
          <li>Conditional approval rules</li>
        </ul>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({})}>Save Rule</Button>
        </div>
      </div>
    </Modal>
  );
};

export default ApprovalRules;
