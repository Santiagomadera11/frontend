import { apiClient } from '../../shared/utils/apiClient';

const API_URL = '/api/Auth';

export async function sendRecoveryEmail(email) {
  try {
    const response = await apiClient.post(`${API_URL}/forgot-password`, { email });
    return response.data;
  } catch (error) {
    return { error: true, message: error.response?.data?.message || 'Error al enviar el correo' };
  }
}
