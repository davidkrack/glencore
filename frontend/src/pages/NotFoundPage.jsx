import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-6">Página no encontrada</p>
      <Link 
        to="/"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Volver al inicio
      </Link>
    </div>
  );
};

export default NotFoundPage;