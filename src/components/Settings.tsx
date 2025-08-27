import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  TrashIcon,
  WrenchScrewdriverIcon,
  HeartIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { cleanupInactiveTokens, getSystemHealth } from '../lib/api';

export default function Settings() {
  const queryClient = useQueryClient();

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: getSystemHealth,
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });

  const cleanupMutation = useMutation({
    mutationFn: cleanupInactiveTokens,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const getHealthStatus = () => {
    if (healthLoading) return { color: 'text-gray-500', text: 'Проверяем...' };
    if (!health) return { color: 'text-red-500', text: 'Недоступен' };
    if (health.status === 'healthy') return { color: 'text-green-500', text: 'Работает' };
    return { color: 'text-red-500', text: 'Ошибки' };
  };

  const healthStatus = getHealthStatus();

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Настройки системы
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Системные настройки и обслуживание
        </p>
      </div>

      {/* Состояние системы */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Состояние системы
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <HeartIcon className={`h-5 w-5 ${healthStatus.color} mr-2`} />
                <span className="text-sm text-gray-700">Общий статус</span>
              </div>
              <span className={`text-sm font-medium ${healthStatus.color}`}>
                {healthStatus.text}
              </span>
            </div>

            {health && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Подключение к Expo API</span>
                  <span className={`text-sm font-medium ${
                    health.expo === 'connected' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {health.expo === 'connected' ? 'Подключено' : 'Отключено'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">База данных</span>
                  <span className={`text-sm font-medium ${
                    health.database === 'connected' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {health.database === 'connected' ? 'Подключена' : 'Ошибка'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Последняя проверка</span>
                  <span className="text-sm text-gray-500">
                    {new Date(health.timestamp).toLocaleString('ru-RU')}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Обслуживание */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Обслуживание
          </h3>
          
          <div className="space-y-6">
            {/* Очистка неактивных токенов */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <TrashIcon className="h-8 w-8 text-gray-400 mr-4" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Очистка неактивных токенов
                  </h4>
                  <p className="text-sm text-gray-500">
                    Удалить push-токены, которые не использовались более 30 дней
                  </p>
                </div>
              </div>
              <button
                onClick={() => cleanupMutation.mutate()}
                disabled={cleanupMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {cleanupMutation.isPending ? 'Очистка...' : 'Очистить'}
              </button>
            </div>

            {/* Результат очистки */}
            {cleanupMutation.isSuccess && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-700">
                  Удалено неактивных токенов: {cleanupMutation.data?.deletedCount || 0}
                </div>
              </div>
            )}

            {cleanupMutation.isError && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">
                  Ошибка очистки: {cleanupMutation.error?.message}
                </div>
              </div>
            )}

            {/* Предупреждение */}
            <div className="rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    Важно
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Операции обслуживания могут занять некоторое время</li>
                      <li>Удаленные токены невозможно восстановить</li>
                      <li>Рекомендуется выполнять очистку в нерабочее время</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Информация о системе */}
      <div className="bg-white shadow rounded-lg mt-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Информация о системе
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Версии компонентов
              </h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Admin Panel: v1.0.0</div>
                <div>API: v2.0</div>
                <div>Notifications Service: v2.0</div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Конфигурация
              </h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>API URL: {process.env.NEXT_PUBLIC_API_URL || 'default'}</div>
                <div>Environment: {process.env.NODE_ENV || 'development'}</div>
                <div>Build Date: {new Date().toLocaleDateString('ru-RU')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}