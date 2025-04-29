import React, { useState, useRef } from 'react';
import { useContract } from '../../context/ContractContext';

const ImportExportTools = () => {
  const { importFromExcel, exportToExcel, loading, error } = useContract();
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const fileInputRef = useRef(null);

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setImportStatus(null);

    try {
      const result = await importFromExcel(file);
      setImportStatus({
        success: true,
        message: `Importación exitosa: ${result?.contracts_imported || 0} contratos importados`
      });
    } catch (err) {
      setImportStatus({
        success: false,
        message: 'Error al importar archivo'
      });
    } finally {
      setImporting(false);
      // Limpiar el input file para permitir cargar el mismo archivo nuevamente
      e.target.value = null;
    }
  };

  const handleExportClick = async () => {
    setExporting(true);
    try {
      await exportToExcel();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 bg-white border-b flex flex-wrap justify-between items-center">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">Importar/Exportar</h3>
        {importStatus && (
          <div className={`text-sm p-2 rounded ${
            importStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {importStatus.message}
          </div>
        )}
      </div>
      
      <div className="flex space-x-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx,.xls"
          className="hidden"
        />
        
        <button
          onClick={handleImportClick}
          disabled={importing || loading}
          className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-orange-300 flex items-center"
        >
          {importing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Importando...
            </>
          ) : (
            <>
              <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Importar Excel
            </>
          )}
        </button>
        
        <button
          onClick={handleExportClick}
          disabled={exporting || loading}
          className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300 flex items-center"
        >
          {exporting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Exportando...
            </>
          ) : (
            <>
              <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar Excel
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ImportExportTools;