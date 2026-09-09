/**
 * Utilidades de validación para formularios
 */

export const formValidations = {
  // Valida que solo contenga letras y espacios
  isOnlyLetters: (value) => {
    return /^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]*$/.test(value);
  },

  // Valida que solo contenga números
  isOnlyNumbers: (value) => {
    return /^\d*$/.test(value);
  },

  // Valida que contenga @
  hasAtSymbol: (value) => {
    return value.includes("@");
  },

  // Validar nombre (solo letras)
  validateName: (value) => {
    if (!value.trim()) {
      return "El nombre es requerido";
    }
    if (!formValidations.isOnlyLetters(value)) {
      return "El nombre solo debe contener letras";
    }
    return "";
  },

  // Validar documento (solo números)
  validateDocument: (value) => {
    if (value && !formValidations.isOnlyNumbers(value)) {
      return "El documento solo debe contener números";
    }
    return "";
  },

  // Validar teléfono (solo números)
  validatePhone: (value) => {
    if (value && !formValidations.isOnlyNumbers(value)) {
      return "El teléfono solo debe contener números";
    }
    return "";
  },

  // Validar correo (debe tener @)
  validateEmail: (value) => {
    if (value && !formValidations.hasAtSymbol(value)) {
      return "El correo debe contener el símbolo @";
    }
    return "";
  },

  // Validar servicio/descripción (solo letras y números para descripciones)
  validateService: (value) => {
    if (!value.trim()) {
      return "El servicio es requerido";
    }
    if (!formValidations.isOnlyLetters(value)) {
      return "El servicio solo debe contener letras";
    }
    return "";
  }
};
