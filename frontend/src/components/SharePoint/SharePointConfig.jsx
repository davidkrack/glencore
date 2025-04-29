import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const SharePointConfig = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    site_url: '',
    username: '',
    password: '',
    excel_path: '',
    shared_link: '',
    auto_sync_enabled: false,
    auto_sync_interval_minutes: 60
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [syncLoading, setSyncLoading] = useState(false);
  const [useDirectLink, setUseDirectLink] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sharepoint/settings');
      
      // Determinar si estamos usando el enlace directo
      const useDirect = 'shared_link' in response.data;
      setUseDirectLink(useDirect);
      
      setFormData({
        ...formData,
        ...response.data,
        password: '' // No se recibe la contraseña por seguridad
      });
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.detail || 'Error al cargar configuración', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/sharepoint/settings', formData);
      setMessage({ text: 'Configuración guardada correctamente', type: 'success' });
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.detail || 'Error al guardar configuración', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFrom = async () => {
    try {
      setSyncLoading(true);
      const response = await api.post('/sharepoint/sync-from');
      setMessage({ text: response.data.message, type: 'success' });
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.detail || 'Error en la sincronización', 
        type: 'error' 
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSyncTo = async () => {
    try {
      setSyncLoading(true);
      const response = await api.post('/sharepoint/sync-to');
      setMessage({ text: response.data.message, type: 'success' });
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.detail || 'Error en la sincronización', 
        type: 'error' 
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const toggleMode = () => {
    setUseDirectLink(!useDirectLink);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Configuración de SharePoint</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {message.text && (
            <div className={`mb-4 p-3 rounded ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <div className="mb-4">
            <button
              onClick={toggleMode}
              className="mb-4 px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
            >
              {useDirectLink 
                ? "Cambiar a modo de conexión con credenciales" 
                : "Cambiar a modo de conexión con enlace compartido"}
            </button>
            
            <div className="bg-gray-100 p-3 rounded text-sm text-gray-700 mb-4">
              <p>Modo actual: <strong>{useDirectLink ? "Enlace compartido directo" : "Conexión con credenciales"}</strong></p>
              {useDirectLink && (
                <p className="mt-1">Este modo permite usar un enlace compartido de SharePoint sin necesidad de credenciales.</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {useDirectLink ? (
              <div>
                <label className="block text-sm font-medium text-gray-700">Enlace compartido de SharePoint</label>
                <input
                  type="text"
                  name="shared_link"
                  value={formData.shared_link}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://schconsulting1-my.sharepoint.com/:x:/g/personal/..."
                />
                <p className="mt-1 text-xs text-gray-500">Debe ser un enlace que permita editar el documento</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">URL del Sitio SharePoint</label>
                  <input
                    type="text"
                    name="site_url"
                    value={formData.site_url}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://schconsulting1-my.sharepoint.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre de Usuario</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="usuario@tucompañia.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                  />
                  <p className="mt-1 text-xs text-gray-500">Deje en blanco para mantener la contraseña actual</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Ruta del Archivo Excel</label>
                  <input
                    type="text"
                    name="excel_path"
                    value={formData.excel_path}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="/personal/david_candia_schconsulting_cl/Documents/Sourcing Plan Glencore.xlsx"
                  />
                </div>
              </>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto_sync_enabled"
                name="auto_sync_enabled"
                checked={formData.auto_sync_enabled}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="auto_sync_enabled" className="ml-2 block text-sm text-gray-900">
                Habilitar sincronización automática
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Intervalo de sincronización (minutos)</label>
              <input
                type="number"
                name="auto_sync_interval_minutes"
                value={formData.auto_sync_interval_minutes}
                onChange={handleChange}
                min="5"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="pt-4 border-t flex justify-between">
              <div>
                <button
                  type="button"
                  onClick={handleSyncFrom}
                  disabled={syncLoading}
                  className="mr-2 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300"
                >
                  {syncLoading ? 'Sincronizando...' : 'Importar desde SharePoint'}
                </button>
                <button
                  type="button"
                  onClick={handleSyncTo}
                  disabled={syncLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                >
                  {syncLoading ? 'Sincronizando...' : 'Exportar a SharePoint'}
                </button>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                >
                  {loading ? 'Guardando...' : 'Guardar Configuración'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SharePointConfig;