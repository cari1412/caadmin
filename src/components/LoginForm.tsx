import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { BellIcon } from '@heroicons/react/24/outline';
import { login } from '../lib/api';

interface LoginFormProps {
  onLogin: () => void;
}

interface LoginData {
  email: string;
  password: string;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>();

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Attempting login with:', data.email);
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'https://mobi.prospecttrade.org/api');
      
      const response = await login(data.email, data.password);
      console.log('Login response:', response);
      
      onLogin();
    } catch (err: unknown) {
      console.error('Login error:', err);
      
      // Type guard для axios error
      const isAxiosError = (error: unknown): error is { response?: { data?: { message?: string }, status?: number }, code?: string, message?: string } => {
        return typeof error === 'object' && error !== null;
      };
      
      if (isAxiosError(err)) {
        console.error('Error response:', err.response?.data);
        console.error('Error status:', err.response?.status);
      }
      
      let errorMessage = 'Ошибка авторизации';
      
      if (isAxiosError(err)) {
        if (err.response?.status === 404) {
          errorMessage = 'Эндпоинт не найден. Проверьте настройки сервера.';
        } else if (err.response?.status === 401) {
          errorMessage = 'Неверный email или пароль';
        } else if (err.response?.status === 403) {
          errorMessage = 'Доступ запрещен';
        } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
          errorMessage = 'Ошибка сети. Проверьте соединение с сервером.';
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center">
            <BellIcon className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Админ панель уведомлений
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Войдите, используя данные администратора
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                {...register('email', {
                  required: 'Email обязателен',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Некорректный email'
                  }
                })}
                type="email"
                autoComplete="email"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email администратора"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Пароль
              </label>
              <input
                {...register('password', {
                  required: 'Пароль обязателен',
                  minLength: {
                    value: 6,
                    message: 'Пароль должен содержать минимум 6 символов'
                  }
                })}
                type="password"
                autoComplete="current-password"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Пароль"
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">
                {error}
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Используйте учетные данные администратора для доступа к панели управления уведомлениями
            </p>
          </div>

          {/* Debug info - можно удалить в продакшне */}
          <div className="text-center">
            <p className="text-xs text-gray-400">
              API: {process.env.NEXT_PUBLIC_API_URL || 'https://mobi.prospecttrade.org/api'}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}