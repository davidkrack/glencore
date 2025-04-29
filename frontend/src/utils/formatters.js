export const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };
  
  // Formatea un número como moneda
  export const formatCurrency = (amount, currency = 'USD', locale = 'es-CL') => {
    if (amount === undefined || amount === null) return '';
    
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    });
    
    return formatter.format(amount);
  };
  
  // Formatea un texto a formato título (primera letra de cada palabra en mayúscula)
  export const formatTitle = (text) => {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Trunca un texto largo
  export const truncateText = (text, maxLength = 50) => {
    if (!text || text.length <= maxLength) return text;
    
    return text.substring(0, maxLength) + '...';
  };