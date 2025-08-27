import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  UserGroupIcon, 
  DevicePhoneMobileIcon, 
  BellIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline';
import { fetchDashboardStats } from '../lib/api';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 text-gray-400">
            {icon}
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="text-lg font-medium text-gray-900">
              {value}
            </dd>
          </dl>
        </div>
      </div>
      {trend && (
        <div className="mt-4">
          <div className="flex items-center text-sm">
            <span className={`font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}
            </span>
            <span className="text-gray-500 ml-1">{trend.label}</span>
          </div>
        </div>
      )}
    </div>
  </div>
);

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">
            Ошибка загрузки данных: {error.message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Панель управления уведомлениями
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Обзор системы push-уведомлений
        </p>
      </div>

      {/* Основная статистика */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Всего пользователей"
          value={stats?.users?.total || 0}
          icon={<UserGroupIcon />}
        />
        <StatsCard
          title="Активные токены"
          value={stats?.pushTokens?.active || 0}
          icon={<DevicePhoneMobileIcon />}
        />
        <StatsCard
          title="Запланированные"
          value={stats?.notifications?.scheduled || 0}
          icon={<ClockIcon />}
        />
        <StatsCard
          title="Отправлено сегодня"
          value={stats?.notifications?.logs?.sent || 0}
          icon={<BellIcon />}
        />
      </div>

      {/* Планировщик */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Статус планировщика
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Активные задачи</span>
                <span className="text-sm font-medium">
                  {stats?.scheduler?.activeTasks || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Выполнено сегодня</span>
                <span className="text-sm font-medium">
                  {stats?.scheduler?.executedToday || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Ошибки</span>
                <span className="text-sm font-medium text-red-600">
                  {stats?.scheduler?.errors || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Статистика доставки
            </h3>
            <div className="space-y-3">
              {Object.entries(stats?.notifications?.logs || {}).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <div className="flex items-center">
                    {status === 'sent' && <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />}
                    {status === 'failed' && <XCircleIcon className="h-4 w-4 text-red-500 mr-2" />}
                    {status === 'pending' && <ClockIcon className="h-4 w-4 text-yellow-500 mr-2" />}
                    <span className="text-sm text-gray-500 capitalize">
                      {status}
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Быстрые действия
          </h3>
          <div className="flex flex-wrap gap-4">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Отправить всем
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Очистить планировщик
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Удалить неактивные токены
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}