import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ClockIcon,
  XCircleIcon,
  UserIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { 
  fetchScheduledNotifications, 
  cancelScheduledNotification,
  cleanupScheduler 
} from '../lib/api';

interface ScheduledNotification {
  id: string;
  type: string;
  scheduledFor: string;
  executed: boolean;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    email: string;
    name?: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ScheduledNotificationsResponse {
  notifications: ScheduledNotification[];
  pagination: PaginationInfo;
}

export default function ScheduledNotifications() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [executedFilter, setExecutedFilter] = useState<string>('');
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<ScheduledNotificationsResponse>({
    queryKey: ['scheduled-notifications', page, typeFilter, executedFilter],
    queryFn: () => fetchScheduledNotifications({
      page,
      type: typeFilter || undefined,
      executed: executedFilter === 'true' ? true : executedFilter === 'false' ? false : undefined,
    }),
    placeholderData: (previousData) => previousData,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelScheduledNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const cleanupMutation = useMutation({
    mutationFn: cleanupScheduler,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'WELCOME':
        return 'bg-green-100 text-green-800';
      case 'DISCOUNT_10MIN':
        return 'bg-yellow-100 text-yellow-800';
      case 'INACTIVITY_1HOUR':
        return 'bg-blue-100 text-blue-800';
      case 'RETENTION':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'WELCOME':
        return 'Welcome';
      case 'DISCOUNT_10MIN':
        return 'Discount 10min';
      case 'INACTIVITY_1HOUR':
        return 'Inactivity 1h';
      case 'RETENTION':
        return 'Retention';
      default:
        return type;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Scheduled Notifications
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage automatic and scheduled notifications
        </p>
      </div>

      {/* Filters and actions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="flex space-x-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All types</option>
            <option value="WELCOME">Welcome</option>
            <option value="DISCOUNT_10MIN">Discount 10min</option>
            <option value="INACTIVITY_1HOUR">Inactivity 1h</option>
            <option value="RETENTION">Retention</option>
          </select>

          <select
            value={executedFilter}
            onChange={(e) => setExecutedFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            <option value="false">Pending</option>
            <option value="true">Executed</option>
          </select>
        </div>

        <button
          onClick={() => cleanupMutation.mutate()}
          disabled={cleanupMutation.isPending}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {cleanupMutation.isPending ? 'Cleaning...' : 'Cleanup Executed'}
        </button>
      </div>

      {isLoading ? (
        <div className="animate-pulse">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">
            Loading error: {error.message}
          </div>
        </div>
      ) : (
        <>
          {/* Notifications list */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {data?.notifications.map((notification) => (
                <li key={notification.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {notification.executed ? (
                          <CheckCircleIcon className="h-6 w-6 text-green-500" />
                        ) : (
                          <ClockIcon className="h-6 w-6 text-yellow-500" />
                        )}
                      </div>
                      
                      <div className="ml-4">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                            {getTypeName(notification.type)}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </span>
                        </div>
                        
                        <div className="mt-1 text-sm text-gray-500">
                          {notification.body}
                        </div>
                        
                        <div className="mt-2 flex items-center space-x-4">
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">
                              {notification.user.name || notification.user.email}
                            </span>
                          </div>
                          
                          <span className="text-xs text-gray-500">
                            Scheduled for: {formatDate(notification.scheduledFor)}
                          </span>
                          
                          {notification.executed && (
                            <span className="text-xs text-green-600">
                              Executed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {!notification.executed && (
                        <button
                          onClick={() => cancelMutation.mutate(notification.id)}
                          disabled={cancelMutation.isPending}
                          className="inline-flex items-center p-2 border border-transparent rounded-full text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          title="Cancel notification"
                        >
                          <XCircleIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Additional data */}
                  {notification.data && Object.keys(notification.data).length > 0 && (
                    <div className="mt-3 ml-10 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-xs font-medium text-gray-900 mb-2">
                        Additional data:
                      </h4>
                      <pre className="text-xs text-gray-600 font-mono">
                        {JSON.stringify(notification.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= data.pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(page - 1) * 20 + 1}</span> to
                    <span className="font-medium"> {Math.min(page * 20, data.pagination.total)}</span> of
                    <span className="font-medium"> {data.pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      {page} of {data.pagination.pages}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= data.pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}

          {/* Success messages */}
          {cleanupMutation.isSuccess && (
            <div className="mt-4 rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">
                Executed notifications cleaned up successfully
              </div>
            </div>
          )}

          {cancelMutation.isSuccess && (
            <div className="mt-4 rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">
                Notification cancelled successfully
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}