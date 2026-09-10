// Small helper functions to manage Local Storage keys used across the app
export const LS = {
  USERS: 'syspharma_users',
  USER: 'syspharma_user',
  CART: 'syspharma_cart',
  PEDIDOS: 'syspharma_pedidos'
};

export const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
};

export const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // emit an event so other components can react
    // Dispatch both a CustomEvent (with detail) and a plain Event for broader compatibility
    try {
      window.dispatchEvent(new CustomEvent(`${key}_updated`, { detail: { key } }));
    } catch {
      // ignore if CustomEvent not supported
    }
    try {
      window.dispatchEvent(new Event(`${key}_updated`));
    } catch {
      // ignore
    }
    try {
      // also dispatch a generic 'storage' event to notify listeners that rely on that
      window.dispatchEvent(new Event('storage'));
    } catch {
      // ignore
    }
    return true;
  } catch {
    return false;
  }
};
