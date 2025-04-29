import * as yup from 'yup';

// Esquema de validación para contratos
export const contractSchema = yup.object().shape({
  contract_number: yup.string()
    .required('El número de contrato es requerido')
    .min(3, 'El número debe tener al menos 3 caracteres'),
  
  description: yup.string()
    .required('La descripción es requerida')
    .min(5, 'La descripción debe tener al menos 5 caracteres'),
  
  supplier: yup.string()
    .required('El proveedor es requerido'),
  
  status: yup.string()
    .required('El estado es requerido')
    .oneOf(['Active', 'Pending', 'Closed'], 'Estado no válido'),
  
  start_date: yup.date()
    .required('La fecha de inicio es requerida')
    .min(new Date(2024, 0, 1), 'La fecha debe ser posterior a 2024')
    .max(new Date(2030, 11, 31), 'La fecha debe ser anterior a 2031'),
  
  end_date: yup.date()
    .required('La fecha de fin es requerida')
    .min(
      yup.ref('start_date'),
      'La fecha de fin debe ser posterior a la fecha de inicio'
    )
    .max(new Date(2030, 11, 31), 'La fecha debe ser anterior a 2031'),
  
  currency: yup.string()
    .required('La moneda es requerida')
    .oneOf(['USD', 'EUR', 'CLP'], 'Moneda no válida'),
  
  total_amount: yup.number()
    .required('El monto total es requerido')
    .positive('El monto debe ser positivo'),
  
  remaining_amount: yup.number()
    .required('El monto restante es requerido')
    .min(0, 'El monto restante no puede ser negativo')
    .max(
      yup.ref('total_amount'),
      'El monto restante no puede ser mayor al monto total'
    ),
});

// Esquema de validación para usuarios
export const userSchema = yup.object().shape({
  username: yup.string()
    .required('El nombre de usuario es requerido')
    .min(4, 'El nombre de usuario debe tener al menos 4 caracteres'),
  
  email: yup.string()
    .required('El email es requerido')
    .email('Email no válido'),
  
  password: yup.string()
    .required('La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  
  full_name: yup.string()
    .required('El nombre completo es requerido'),
});