import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  TrashIcon,
  HeartIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { cleanupInactiveTokens, getSystemHealth } from '../lib/api';

export default function Settings() {
  const queryClient = useQueryClient();

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: getSystemHealth,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const cleanupMutation = useMutation({
    mutationFn: cleanupInactiveTokens,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const getHealthStatus = () => {
    if (healthLoading) return { color: 'text-gray-500', text: 'Checking...' };
    if (!health) return { color: 'text-red-500', text: 'Unavailable' };
    if (health.status === 'healthy') return { color: 'text-green-500', text: 'Healthy' };
    return { color: 'text-red-500', text: 'Issues' };
  };

  const healthStatus = getHealthStatus();

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          System Settings
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          System configuration and maintenance
        </p>
      </div>

      {/* System status */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            System Status
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <HeartIcon className={`h-5 w-5 ${healthStatus.color} mr-2`} />
                <span className="text-sm text-gray-700">Overall status</span>
              </div>
              <span className={`text-sm font-medium ${healthStatus.color}`}>
                {healthStatus.text}
              </span>
            </div>

            {health && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Expo API connection</span>
                  <span className={`text-sm font-medium ${
                    health.expo === 'connected' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {health.expo === 'connected' ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Database</span>
                  <span className={`text-sm font-medium ${
                    health.database === 'connected' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {health.database === 'connected' ? 'Connected' : 'Error'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Last check</span>
                  <span className="text-sm text-gray-500">
                    {new Date(health.timestamp).toLocaleString('en-US')}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Maintenance */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Maintenance
          </h3>
          
          <div className="space-y-6">
            {/* Cleanup inactive tokens */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <TrashIcon className="h-8 w-8 text-gray-400 mr-4" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Cleanup inactive tokens
                  </h4>
                  <p className="text-sm text-gray-500">
                    Remove push tokens that haven't been used for more than 30 days
                  </p>
                </div>
              </div>
              <button
                onClick={() => cleanupMutation.mutate()}
                disabled={cleanupMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {cleanupMutation.isPending ? 'Cleaning...' : 'Cleanup'}
              </button>
            </div>

            {/* Cleanup result */}
            {cleanupMutation.isSuccess && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-700">
                  Inactive tokens removed: {cleanupMutation.data?.deletedCount || 0}
                </div>
              </div>
            )}

            {cleanupMutation.isError && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">
                  Cleanup error: {cleanupMutation.error?.message}
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    Important
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Maintenance operations may take some time</li>
                      <li>Deleted tokens cannot be restored</li>
                      <li>Recommended to run cleanup during off-hours</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System information */}
      <div className="bg-white shadow rounded-lg mt-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            System Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Component versions
              </h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Admin Panel: v1.0.0</div>
                <div>API: v2.0</div>
                <div>Notifications Service: v2.0</div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Configuration
              </h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>API URL: {process.env.NEXT_PUBLIC_API_URL || 'default'}</div>
                <div>Environment: {process.env.NODE_ENV || 'development'}</div>
                <div>Build Date: {new Date().toLocaleDateString('en-US')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}