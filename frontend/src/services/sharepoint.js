import api from './api';

/**
 * Servicio para interactuar con la API de SharePoint
 */
const sharePointService = {
  /**
   * Obtiene la configuración actual de SharePoint
   */
  getSettings: async () => {
    try {
      const response = await api.get('/sharepoint/settings');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualiza la configuración de SharePoint
   * @param {Object} settings - Configuración a actualizar
   */
  updateSettings: async (settings) => {
    try {
      const response = await api.post('/sharepoint/settings', settings);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Sincroniza datos desde SharePoint a la base de datos
   */
  syncFromSharePoint: async () => {
    try {
      const response = await api.post('/sharepoint/sync-from');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Sincroniza datos desde la base de datos a SharePoint
   */
  syncToSharePoint: async () => {
    try {
      const response = await api.post('/sharepoint/sync-to');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default sharePointService;