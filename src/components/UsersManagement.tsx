import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  MagnifyingGlassIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PaperAirplaneIcon 
} from '@heroicons/react/24/outline';
import { fetchUsers, User } from '../lib/api';
import SendNotificationForm from './SendNotificationForm';

// Убираем локальные интерфейсы и используем типы из api.ts
interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface UsersResponse {
  users: User[]; // Используем User из api.ts
  pagination: PaginationInfo;
}

export default function UsersManagement() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showNotificationForm, setShowNotificationForm] = useState(false);

  const { data, isLoading, error } = useQuery<UsersResponse>({
    queryKey: ['users', page, search],
    queryFn: () => fetchUsers({ page, search, limit: 20 }),
    placeholderData: (previousData) => previousData,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'IOS':
        return '🍎';
      case 'ANDROID':
        return '🤖';
      case 'WEB':
        return '🌐';
      default:
        return '📱';
    }
  };

  if (showNotificationForm && selectedUser) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <button
            onClick={() => {
              setShowNotificationForm(false);
              setSelectedUser(null);
            }}
            className="text-blue-600 hover:text-blue-500"
          >
            ← Назад к пользователям
          </button>
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Отправить уведомление пользователю
          </h2>
          <p className="text-sm text-gray-600">
            {selectedUser.name} ({selectedUser.email})
          </p>
        </div>
        <SendNotificationForm
          userId={selectedUser.id}
          onSuccess={() => {
            setShowNotificationForm(false);
            setSelectedUser(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Управление пользователями
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Список всех пользователей и их push-токенов
        </p>
      </div>

      {/* Поиск */}
      <div className="mb-6">
        <div className="max-w-lg">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Поиск по email или имени..."
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-20 rounded-lg"></div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">
            Ошибка загрузки пользователей: {error.message}
          </div>
        </div>
      ) : (
        <>
          {/* Список пользователей */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {data?.users.map((user) => (
                <li key={user.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.name?.charAt(0) || user.email.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              {user.name || 'Без имени'}
                            </p>
                            {user.emailVerified ? (
                              <CheckCircleIcon className="ml-2 h-4 w-4 text-green-500" />
                            ) : (
                              <XCircleIcon className="ml-2 h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {user.email}
                          </p>
                          <div className="mt-1 flex items-center space-x-4">
                            <span className="text-xs text-gray-500">
                              ID: {user.id}
                            </span>
                            <span className="text-xs text-gray-500">
                              Регистрация: {formatDate(user.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {/* Push токены */}
                        <div className="flex items-center space-x-2">
                          <DevicePhoneMobileIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {user.pushTokens.length}
                          </span>
                          {user.pushTokens.length > 0 && (
                            <div className="flex space-x-1">
                              {user.pushTokens.map((token, index) => (
                                <span key={index} title={`${token.platform} - ${formatDate(token.lastUsed)}`}>
                                  {getPlatformIcon(token.platform)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Запланированные уведомления */}
                        {user.scheduledNotifications.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <ClockIcon className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm text-yellow-600">
                              {user.scheduledNotifications.length}
                            </span>
                          </div>
                        )}

                        {/* Кнопка отправки уведомления */}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowNotificationForm(true);
                          }}
                          className="inline-flex items-center p-2 border border-transparent rounded-full text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          title="Отправить уведомление"
                        >
                          <PaperAirplaneIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Детали токенов (раскрывающиеся) */}
                    {user.pushTokens.length > 0 && (
                      <div className="mt-3 border-t border-gray-100 pt-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {user.pushTokens.map((token, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-900">
                                  {getPlatformIcon(token.platform)} {token.platform}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">
                                    ID: {token.id}
                                  </span>
                                  {/* Показываем статус активности */}
                                  {token.isActive ? (
                                    <CheckCircleIcon className="h-3 w-3 text-green-500" title="Активен" />
                                  ) : (
                                    <XCircleIcon className="h-3 w-3 text-red-500" title="Неактивен" />
                                  )}
                                </div>
                              </div>
                              {token.deviceId && (
                                <div className="mt-1">
                                  <span className="text-xs text-gray-500">
                                    Device: {token.deviceId}
                                  </span>
                                </div>
                              )}
                              <div className="mt-1">
                                <span className="text-xs text-gray-500">
                                  Последнее использование: {formatDate(token.lastUsed)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Запланированные уведомления */}
                    {user.scheduledNotifications.length > 0 && (
                      <div className="mt-3 border-t border-gray-100 pt-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Запланированные уведомления:
                        </h4>
                        <div className="space-y-2">
                          {user.scheduledNotifications.map((notification) => (
                            <div key={notification.id} className="flex items-center justify-between bg-yellow-50 rounded-lg p-2">
                              <span className="text-sm text-yellow-800">
                                {notification.type}
                              </span>
                              <span className="text-xs text-yellow-600">
                                {formatDate(notification.scheduledFor)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Пагинация */}
          {data?.pagination && data.pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Предыдущая
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= data.pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Следующая
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Показано <span className="font-medium">{(page - 1) * 20 + 1}</span> -
                    <span className="font-medium"> {Math.min(page * 20, data.pagination.total)}</span> из
                    <span className="font-medium"> {data.pagination.total}</span> результатов
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Предыдущая
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      {page} из {data.pagination.pages}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= data.pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Следующая
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}