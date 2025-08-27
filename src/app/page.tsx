'use client';

import { useState, useEffect } from 'react';
import {
  HomeIcon,
  UserGroupIcon,
  BellIcon,
  ChartBarIcon,
  ClockIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import Dashboard from '../components/Dashboard';
import UsersManagement from '../components/UsersManagement';
import SendNotificationForm from '../components/SendNotificationForm';
import ScheduledNotifications from '../components/ScheduledNotifications';
import Analytics from '../components/Analytics';
import Settings from '../components/Settings';
import LoginForm from '../components/LoginForm';

const navigation = [
  { name: 'Дашборд', href: '#', icon: HomeIcon, id: 'dashboard' },
  { name: 'Пользователи', href: '#', icon: UserGroupIcon, id: 'users' },
  { name: 'Отправить уведомление', href: '#', icon: BellIcon, id: 'send' },
  { name: 'Запланированные', href: '#', icon: ClockIcon, id: 'scheduled' },
  { name: 'Аналитика', href: '#', icon: ChartBarIcon, id: 'analytics' },
  { name: 'Настройки', href: '#', icon: Cog6ToothIcon, id: 'settings' },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    setActiveTab('dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <UsersManagement />;
      case 'send':
        return (
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">
                Отправить уведомление
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                Отправка push-уведомлений пользователям
              </p>
            </div>
            <SendNotificationForm />
          </div>
        );
      case 'scheduled':
        return <ScheduledNotifications />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow pt-5 bg-white shadow">
            <div className="flex items-center flex-shrink-0 px-4">
              <BellIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900">
                Admin Panel
              </span>
            </div>
            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 pb-4 space-y-1">
                {navigation.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`${
                      activeTab === item.id
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium border-l-4 w-full text-left`}
                  >
                    <item.icon
                      className={`${
                        activeTab === item.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      } mr-3 flex-shrink-0 h-6 w-6`}
                    />
                    {item.name}
                  </button>
                ))}
              </nav>
              
              {/* Logout button */}
              <div className="px-2 pb-4">
                <button
                  onClick={handleLogout}
                  className="group flex items-center px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full text-left"
                >
                  <ArrowRightOnRectangleIcon className="text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-6 w-6" />
                  Выйти
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          {/* Здесь можно добавить мобильное меню при необходимости */}
        </div>

        {/* Main content */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}