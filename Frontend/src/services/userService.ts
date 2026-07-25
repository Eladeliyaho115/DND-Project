import { api } from '../api/axiosClient.ts';

export interface User {
  id: string | number;
  email: string;
  name?: string;
}

// שליפת כל המשתמשים
export const fetchUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/users');
  return response.data;
};

// יצירת משתמש חדש
export const createNewUser = async (userData: { email: string; name?: string }): Promise<User> => {
  const response = await api.post<User>('/users', userData);
  return response.data;
};

export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};