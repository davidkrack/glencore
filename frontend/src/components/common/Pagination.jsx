import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // No mostrar si solo hay una página
  if (totalPages <= 1) return null;
  
  // Crear un array de números de página
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    // Si hay menos de 7 páginas, mostrar todas
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Siempre mostrar la primera página
      pageNumbers.push(1);
      
      // Calcular las páginas a mostrar alrededor de la página actual
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Ajustar si estamos cerca del principio o final
      if (currentPage <= 3) {
        endPage = 5;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 4;
      }
      
      // Mostrar "..." si hay un salto al principio
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      // Añadir páginas intermedias
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Mostrar "..." si hay un salto al final
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Siempre mostrar la última página
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  return (
    <div className="flex justify-center items-center">
      <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
        {/* Botón de página anterior */}
        <button
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${
            currentPage === 1 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-gray-500 hover:bg-gray-50'
          } text-sm font-medium border-gray-300`}
        >
          <span className="sr-only">Anterior</span>
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        
        {/* Botones de números de página */}
        {getPageNumbers().map((pageNumber, index) => (
          <button
            key={index}
            onClick={() => typeof pageNumber === 'number' && onPageChange(pageNumber)}
            disabled={pageNumber === '...'}
            className={`relative inline-flex items-center px-4 py-2 border ${
              pageNumber === currentPage
                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                : pageNumber === '...'
                  ? 'bg-white border-gray-300 text-gray-500'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
            } text-sm font-medium`}
          >
            {pageNumber}
          </button>
        ))}
        
        {/* Botón de página siguiente */}
        <button
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${
            currentPage === totalPages 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-gray-500 hover:bg-gray-50'
          } text-sm font-medium border-gray-300`}
        >
          <span className="sr-only">Siguiente</span>
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </nav>
    </div>
  );
};

export default Pagination;