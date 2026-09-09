import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// import TestApp from "./TestApp.jsx";
import App from "./App.jsx";
// import { authService } from "./features/auth/authService";
// import { rolesService } from "./features/settings/rolesService";
// import { permissionService } from "./features/settings/permissionService";


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
