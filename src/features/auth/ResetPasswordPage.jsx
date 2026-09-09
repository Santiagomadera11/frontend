import React, { useState } from "react";

const ResetPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    // Aquí iría la lógica para enviar el cambio de contraseña al backend
    // Ejemplo:
    // const result = await passwordRecoveryService.resetPassword(email, code, newPassword);
    // if (result.error) setError(result.message);
    // else setMessage("¡Contraseña actualizada!");
    setMessage("(Simulado) Contraseña actualizada si el código es válido.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">Cambiar Contraseña</h2>
        <label className="block mb-2 text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring focus:border-blue-300"
          placeholder="Ingresa tu correo"
        />
        <label className="block mb-2 text-sm font-medium text-gray-700">Código de recuperación</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring focus:border-blue-300"
          placeholder="Ingresa el código recibido"
        />
        <label className="block mb-2 text-sm font-medium text-gray-700">Nueva contraseña</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring focus:border-blue-300"
          placeholder="Ingresa la nueva contraseña"
        />
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded transition-all"
        >
          Cambiar contraseña
        </button>
        {message && <p className="mt-4 text-green-600 text-center">{message}</p>}
        {error && <p className="mt-4 text-red-600 text-center">{error}</p>}
      </form>
    </div>
  );
};

export default ResetPasswordPage;
