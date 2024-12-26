import React from 'react';
import { LogOut, MapIcon, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MapProfileSection = ({ user, onLogout, isOpen }) => {
  if (!isOpen) return null;

  const isAdmin = user?.username?.toLowerCase() === 'admin';

  return (
    <div className="absolute top-20 left-4 z-30 w-72 rounded-lg bg-white/80 backdrop-blur-lg shadow-lg p-4 transition-all duration-300 ease-in-out">
      <div className="space-y-4">
        {/* User Profile Section */}
        <div className="flex items-center space-x-3 pb-4 border-b border-gray-200/50">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-xl font-semibold text-white">
              {user?.username?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">
              {user?.username || 'Usuário'}
            </h3>
            <p className="text-sm text-gray-500">
              Online
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="space-y-2">
          {isAdmin && (
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:text-gray-900"
              onClick={() => window.location.href = '/admin'}
            >
              <Settings className="mr-2 h-4 w-4" />
              Painel do Administrador
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-gray-900"
            onClick={onLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MapProfileSection;