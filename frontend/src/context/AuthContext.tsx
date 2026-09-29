import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, SupportedLanguage } from '../types';
import { api } from '../services/api';
import i18n from '../i18n';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, lang: SupportedLanguage) => Promise<void>;
  logout: () => void;
  updateLanguage: (lang: SupportedLanguage) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('dermasathi_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const profile = await api.getCurrentUser();
          setUser(profile);
          if (profile.preferred_language) {
            i18n.changeLanguage(profile.preferred_language);
          }
        } catch {
          localStorage.removeItem('dermasathi_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email: string, pass: string) => {
    const data = await api.login(email, pass);
    localStorage.setItem('dermasathi_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    if (data.user.preferred_language) {
      updateLanguage(data.user.preferred_language as SupportedLanguage);
    }
  };

  const register = async (email: string, pass: string, name: string, lang: SupportedLanguage) => {
    const data = await api.register(email, pass, name, lang);
    localStorage.setItem('dermasathi_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    updateLanguage(lang);
  };

  const logout = () => {
    localStorage.removeItem('dermasathi_token');
    setToken(null);
    setUser(null);
  };

  const updateLanguage = (lang: SupportedLanguage) => {
    localStorage.setItem('dermasathi_preferred_language', lang);
    i18n.changeLanguage(lang);
    if (user) {
      setUser({ ...user, preferred_language: lang });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      updateLanguage
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
