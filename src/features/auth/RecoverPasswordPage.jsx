
import React, { useState } from "react";
import { passwordRecoveryService } from "./passwordRecoveryService";

const RecoverPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    const result = await passwordRecoveryService.sendRecoveryEmail(email);
    if (result.error) {
      setError(result.message);
    } else {
      setMessage("¡Éxito! Código enviado. Revisa tu correo.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">Recuperar Contraseña</h2>
        <label className="block mb-2 text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring focus:border-blue-300"
          placeholder="Ingresa tu correo"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition-all"
        >
          Enviar enlace de recuperación
        </button>
        {message && <p className="mt-4 text-green-600 text-center">{message}</p>}
        {error && <p className="mt-4 text-red-600 text-center">{error}</p>}
      </form>
    </div>
  );
};

export default RecoverPasswordPage;
