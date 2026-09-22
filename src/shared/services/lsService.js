export const LS = {
  USERS: 'syspharma_users',
  USER: 'syspharma_user',
  CART: 'syspharma_cart',
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
    try {
      window.dispatchEvent(new CustomEvent(`${key}_updated`, { detail: { key } }));
    } catch {
    }
    try {
      window.dispatchEvent(new Event(`${key}_updated`));
    } catch {
    }
    try {
      window.dispatchEvent(new Event('storage'));
    } catch {
    }
    return true;
  } catch {
    return false;
  }
};
