import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  sendNotificationToAll, 
  sendNotificationToUser, 
  sendNotificationToSegment,
  NotificationData 
} from '../lib/api';

interface SendNotificationFormProps {
  userId?: number;
  onSuccess?: () => void;
}

interface SendNotificationFormData {
  target: 'all' | 'user' | 'segment';
  targetUserId?: number;
  platform?: 'IOS' | 'ANDROID';
  registeredAfter?: string;
  registeredBefore?: string;
  title: string;
  body: string;
  data?: string; // JSON строка для формы
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;
}

export default function SendNotificationForm({ userId, onSuccess }: SendNotificationFormProps) {
  const [isAdvanced, setIsAdvanced] = useState(false);
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<SendNotificationFormData>({
    defaultValues: {
      target: userId ? 'user' : 'all',
      targetUserId: userId,
      priority: 'default',
      channelId: 'default',
      ttl: 2419200,
    }
  });

  const sendMutation = useMutation({
    mutationFn: async (data: SendNotificationFormData) => {
      let parsedData: Record<string, any> | undefined;
      
      // Парсим JSON данные если они есть
      if (data.data && typeof data.data === 'string' && data.data.trim()) {
        try {
          parsedData = JSON.parse(data.data);
        } catch (error) {
          throw new Error('Неверный формат JSON в дополнительных данных');
        }
      }

      const notification = {
        title: data.title,
        body: data.body,
        data: parsedData,
        badge: data.badge,
        channelId: data.channelId,
        priority: data.priority,
        ttl: data.ttl,
      };

      switch (data.target) {
        case 'user':
          return sendNotificationToUser(data.targetUserId!, notification);
        case 'all':
          return sendNotificationToAll(notification);
        case 'segment':
          return sendNotificationToSegment({
            notification,
            criteria: {
              platform: data.platform,
              registeredAfter: data.registeredAfter,
              registeredBefore: data.registeredBefore,
              hasActiveTokens: true,
            },
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      reset();
      onSuccess?.();
    },
  });

  const onSubmit = (data: SendNotificationFormData) => {
    sendMutation.mutate(data);
  };

  const watchTarget = watch('target');

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Отправить уведомление
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Цель отправки */}
          {!userId && (
            <div>
              <label className="text-base font-medium text-gray-900">
                Кому отправить
              </label>
              <fieldset className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      {...register('target')}
                      value="all"
                      type="radio"
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <label className="ml-3 block text-sm font-medium text-gray-700">
                      Всем пользователям
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      {...register('target')}
                      value="user"
                      type="radio"
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <label className="ml-3 block text-sm font-medium text-gray-700">
                      Конкретному пользователю
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      {...register('target')}
                      value="segment"
                      type="radio"
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <label className="ml-3 block text-sm font-medium text-gray-700">
                      По критериям
                    </label>
                  </div>
                </div>
              </fieldset>
            </div>
          )}

          {/* ID пользователя */}
          {watchTarget === 'user' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ID пользователя
              </label>
              <input
                {...register('targetUserId', { 
                  required: watchTarget === 'user',
                  valueAsNumber: true 
                })}
                type="number"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="123"
              />
              {errors.targetUserId && (
                <p className="mt-2 text-sm text-red-600">Укажите ID пользователя</p>
              )}
            </div>
          )}

          {/* Критерии сегментации */}
          {watchTarget === 'segment' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-md">
              <h4 className="text-sm font-medium text-gray-900">Критерии отбора</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Платформа
                </label>
                <select
                  {...register('platform')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Все платформы</option>
                  <option value="IOS">iOS</option>
                  <option value="ANDROID">Android</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Зарегистрированы после
                  </label>
                  <input
                    {...register('registeredAfter')}
                    type="date"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Зарегистрированы до
                  </label>
                  <input
                    {...register('registeredBefore')}
                    type="date"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Заголовок */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Заголовок
            </label>
            <input
              {...register('title', { required: 'Заголовок обязателен' })}
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Новое уведомление"
            />
            {errors.title && (
              <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Текст */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Текст уведомления
            </label>
            <textarea
              {...register('body', { required: 'Текст уведомления обязателен' })}
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Текст вашего уведомления..."
            />
            {errors.body && (
              <p className="mt-2 text-sm text-red-600">{errors.body.message}</p>
            )}
          </div>

          {/* Дополнительные настройки */}
          <div>
            <button
              type="button"
              onClick={() => setIsAdvanced(!isAdvanced)}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {isAdvanced ? 'Скрыть' : 'Показать'} дополнительные настройки
            </button>
          </div>

          {isAdvanced && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-md">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Badge
                  </label>
                  <input
                    {...register('badge', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Приоритет
                  </label>
                  <select
                    {...register('priority')}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="default">По умолчанию</option>
                    <option value="normal">Обычный</option>
                    <option value="high">Высокий</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    TTL (секунды)
                  </label>
                  <input
                    {...register('ttl', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Канал (Android)
                </label>
                <input
                  {...register('channelId')}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="default"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Дополнительные данные (JSON)
                </label>
                <textarea
                  {...register('data')}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono text-xs"
                  placeholder='{"type": "marketing", "screen": "home"}'
                />
                <p className="mt-1 text-xs text-gray-500">
                  Валидный JSON объект с дополнительными данными
                </p>
              </div>
            </div>
          )}

          {/* Результат отправки */}
          {sendMutation.isError && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">
                Ошибка: {sendMutation.error?.message}
              </div>
            </div>
          )}

          {sendMutation.isSuccess && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">
                Уведомление успешно отправлено!
              </div>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => reset()}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Очистить
            </button>
            <button
              type="submit"
              disabled={sendMutation.isPending}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {sendMutation.isPending ? 'Отправляется...' : 'Отправить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}