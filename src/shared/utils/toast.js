export const toast = {
  success: (message, title) => {
    try {
      window.dispatchEvent(
        new CustomEvent("app:toast", {
          detail: { message, type: "success", title },
        }),
      );
    } catch {
    }
  },
  error: (message, title) => {
    try {
      window.dispatchEvent(
        new CustomEvent("app:toast", {
          detail: { message, type: "error", title },
        }),
      );
    } catch {
      console.error("toast error:", message);
    }
  },
  info: (message, title) => {
    try {
      window.dispatchEvent(
        new CustomEvent("app:toast", {
          detail: { message, type: "info", title },
        }),
      );
    } catch {
    }
  },
  // allow simple call like toast('msg')
  __call: (message) => {
    try {
      window.dispatchEvent(
        new CustomEvent("app:toast", { detail: { message, type: "success" } }),
      );
    } catch {
      // ignore if CustomEvent not supported
    }
  },
};

// support default export for convenience
export default toast;
