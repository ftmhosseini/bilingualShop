import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const email = localStorage.getItem('email');
    return token ? { token, role, email } : null;
  });

  const login = (token, role, email) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('email', email);
    setUser({ token, role, email });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
