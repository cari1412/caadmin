import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  sendNotificationToAll, 
  sendNotificationToUser, 
  sendNotificationToSegment
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
  data?: string; // JSON string for form
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
      let parsedData: Record<string, unknown> | undefined;
      
      // Parse JSON data if provided
      if (data.data && typeof data.data === 'string' && data.data.trim()) {
        try {
          parsedData = JSON.parse(data.data);
        } catch {
          throw new Error('Invalid JSON format in additional data');
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
          Send Notification
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Target selection */}
          {!userId && (
            <div>
              <label className="text-base font-medium text-gray-900">
                Send to
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
                      All users
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
                      Specific user
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
                      By criteria
                    </label>
                  </div>
                </div>
              </fieldset>
            </div>
          )}

          {/* User ID */}
          {watchTarget === 'user' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                User ID
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
                <p className="mt-2 text-sm text-red-600">Please specify user ID</p>
              )}
            </div>
          )}

          {/* Segmentation criteria */}
          {watchTarget === 'segment' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-md">
              <h4 className="text-sm font-medium text-gray-900">Selection criteria</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Platform
                </label>
                <select
                  {...register('platform')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">All platforms</option>
                  <option value="IOS">iOS</option>
                  <option value="ANDROID">Android</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Registered after
                  </label>
                  <input
                    {...register('registeredAfter')}
                    type="date"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Registered before
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

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              {...register('title', { required: 'Title is required' })}
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="New notification"
            />
            {errors.title && (
              <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Message body
            </label>
            <textarea
              {...register('body', { required: 'Message body is required' })}
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Your notification message..."
            />
            {errors.body && (
              <p className="mt-2 text-sm text-red-600">{errors.body.message}</p>
            )}
          </div>

          {/* Advanced settings */}
          <div>
            <button
              type="button"
              onClick={() => setIsAdvanced(!isAdvanced)}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {isAdvanced ? 'Hide' : 'Show'} advanced settings
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
                    Priority
                  </label>
                  <select
                    {...register('priority')}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="default">Default</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    TTL (seconds)
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
                  Channel (Android)
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
                  Additional data (JSON)
                </label>
                <textarea
                  {...register('data')}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono text-xs"
                  placeholder='{"type": "marketing", "screen": "home"}'
                />
                <p className="mt-1 text-xs text-gray-500">
                  Valid JSON object with additional data
                </p>
              </div>
            </div>
          )}

          {/* Result messages */}
          {sendMutation.isError && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">
                Error: {sendMutation.error?.message}
              </div>
            </div>
          )}

          {sendMutation.isSuccess && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">
                Notification sent successfully!
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => reset()}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={sendMutation.isPending}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {sendMutation.isPending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}