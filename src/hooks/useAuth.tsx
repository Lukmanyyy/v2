import React, { createContext, useContext, useState, useEffect } from 'react';

type User = {
  username: string;
  token: string;
};

interface AuthContextType {
  user: User | null;
  login: (token: string, username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem('auth_token');
    const username = localStorage.getItem('auth_username');
    if (token && username) {
      return { token, username };
    }
    return null;
  });

  const login = (token: string, username: string) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_username', username);
    setUser({ token, username });
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
    localStorage.setItem('finance_data', JSON.stringify([]));
    localStorage.setItem('finance_accounts', JSON.stringify([]));
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
