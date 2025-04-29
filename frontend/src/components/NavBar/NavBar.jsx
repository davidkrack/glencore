import React from 'react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png'; // Asegúrate de tener un logo

const NavBar = () => {
  const { currentUser, logout } = useAuth();

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <img className="h-8 w-auto" src={logo} alt="Logo" />
              <span className="ml-2 text-xl font-bold text-gray-800">Sourcing Plan</span>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center">
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <span className="mr-3 text-sm font-medium text-gray-700">
                    {currentUser?.full_name || currentUser?.username}
                  </span>
                  <button
                    onClick={logout}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;