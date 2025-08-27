import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { fetchNotificationAnalytics } from '../lib/api';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Analytics() {
  const [days, setDays] = useState(7);

  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', days],
    queryFn: () => fetchNotificationAnalytics(days),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  interface DataItem {
    name: string;
    value: number;
  }

  interface StatusItem {
    status: string;
    _count: { id: number };
  }

  interface TypeItem {
    type: string;
    _count: { id: number };
  }

  interface DailyItem {
    sentAt: string;
    _count: { id: number };
  }

  const statusData: DataItem[] = data?.byStatus?.map((item: StatusItem) => ({
    name: item.status,
    value: item._count.id,
  })) || [];

  const typeData: DataItem[] = data?.byType?.map((item: TypeItem) => ({
    name: item.type,
    value: item._count.id,
  })) || [];

  const dailyData = data?.daily?.map((item: DailyItem) => ({
    date: formatDate(item.sentAt),
    count: item._count.id,
  })) || [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Notification Analytics
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Statistics for push notification delivery and performance
        </p>
      </div>

      {/* Period selector */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <CalendarIcon className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-700">Period:</span>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={1}>1 day</option>
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-80 rounded-lg"></div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">
            Error loading analytics: {error.message}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily chart */}
          <div className="bg-white p-6 shadow rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Daily Notifications
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Delivery status */}
          <div className="bg-white p-6 shadow rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delivery Status
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => 
                    `${name} ${percent !== undefined ? (percent * 100).toFixed(0) : 0}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((_entry: DataItem, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Notification types */}
          <div className="bg-white p-6 shadow rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Notification Types
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => 
                    `${name} ${percent !== undefined ? (percent * 100).toFixed(0) : 0}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeData.map((_entry: DataItem, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Summary */}
          <div className="bg-white p-6 shadow rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Period Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Period</span>
                <span className="text-sm font-medium">
                  {days} {days === 1 ? 'day' : 'days'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total notifications</span>
                <span className="text-sm font-medium">
                  {statusData.reduce((sum: number, item: DataItem) => sum + item.value, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Successfully delivered</span>
                <span className="text-sm font-medium text-green-600">
                  {statusData.find((s: DataItem) => s.name === 'SENT')?.value || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Failed</span>
                <span className="text-sm font-medium text-red-600">
                  {statusData.find((s: DataItem) => s.name === 'FAILED')?.value || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Average per day</span>
                <span className="text-sm font-medium">
                  {Math.round(statusData.reduce((sum: number, item: DataItem) => sum + item.value, 0) / days)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}