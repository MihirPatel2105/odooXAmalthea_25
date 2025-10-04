import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ApprovalCard from '../../components/approvals/ApprovalCard';
import Pagination from '../../components/common/Pagination';

const Approvals = () => {
  const { get } = useApi();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    const fetchPendingApprovals = async () => {
      try {
        setLoading(true);
        const response = await get('/expenses/pending-approvals');
        setApprovals(response.data.expenses);
        setPagination(response.data.pagination);
      } catch (error) {
        console.error('Failed to fetch pending approvals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingApprovals();
  }, [get]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>

      {approvals.length === 0 ? (
        <div className="card text-center py-12">
          <h3 className="text-lg font-semibold text-gray-900">No pending approvals</h3>
          <p className="mt-1 text-sm text-gray-500">There are currently no expenses awaiting your approval.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {approvals.map((expense) => (
            <ApprovalCard key={expense._id} expense={expense} />
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={(page) => setFilters({ ...filters, page })}
        />
      )}
    </div>
  );
};

export default Approvals;
