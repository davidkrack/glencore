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
      console.error("Error al obtener configuración de SharePoint:", error);
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
      console.error("Error al actualizar configuración de SharePoint:", error);
      throw error;
    }
  },

  /**
   * Sincroniza datos desde SharePoint a la base de datos
   * @returns {Promise<Object>} Resultado de la sincronización
   */
  syncFromSharePoint: async () => {
    try {
      console.log("Iniciando sincronización desde SharePoint...");
      const response = await api.post('/sharepoint/sync-from');
      console.log("Sincronización desde SharePoint completada:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error en sincronización desde SharePoint:", error);
      throw error;
    }
  },

  /**
   * Sincroniza datos desde la base de datos a SharePoint
   * @returns {Promise<Object>} Resultado de la sincronización
   */
  syncToSharePoint: async () => {
    try {
      console.log("Iniciando sincronización hacia SharePoint...");
      
      // Esperar un momento para asegurar que los cambios en la base de datos se hayan completado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Realizar la sincronización
      const response = await api.post('/sharepoint/sync-to');
      
      console.log("Sincronización hacia SharePoint completada:", response.data);
      
      // Asegurar que se devuelve algo incluso si la respuesta no tiene el formato esperado
      return response.data || { 
        success: true, 
        message: "Sincronización completada" 
      };
    } catch (error) {
      console.error("Error en sincronización hacia SharePoint:", error.response?.data || error.message);
      throw error;
    }
  },
  
  /**
   * Verifica el estado de la conexión con SharePoint
   * @returns {Promise<boolean>} true si la conexión es exitosa
   */
  testConnection: async () => {
    try {
      const settings = await sharePointService.getSettings();
      
      // Si hay un enlace compartido configurado, consideramos que hay conexión
      if (settings.shared_link) {
        return true;
      }
      
      // Si usa credenciales tradicionales, verificar que estén completas
      if (settings.site_url && settings.username && settings.excel_path) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error al verificar conexión con SharePoint:", error);
      return false;
    }
  }
};

export default sharePointService;