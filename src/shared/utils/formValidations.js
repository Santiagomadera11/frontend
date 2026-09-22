
export const formValidations = {
  isOnlyLetters: (value) => {
    return /^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]*$/.test(value);
  },

  isOnlyNumbers: (value) => {
    return /^\d*$/.test(value);
  },

  hasAtSymbol: (value) => {
    return value.includes("@");
  },

  validateName: (value) => {
    if (!value.trim()) {
      return "El nombre es requerido";
    }
    if (!formValidations.isOnlyLetters(value)) {
      return "El nombre solo debe contener letras";
    }
    return "";
  },

  validateDocument: (value) => {
    if (value && !formValidations.isOnlyNumbers(value)) {
      return "El documento solo debe contener números";
    }
    return "";
  },

  validatePhone: (value) => {
    if (value && !formValidations.isOnlyNumbers(value)) {
      return "El teléfono solo debe contener números";
    }
    return "";
  },

  validateEmail: (value) => {
    if (value && !formValidations.hasAtSymbol(value)) {
      return "El correo debe contener el símbolo @";
    }
    return "";
  },

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
