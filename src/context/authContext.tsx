"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { InactivityWarning } from '@/components/InactivityWarning';

interface User {
  uid: string;
  name: string;
  email: string;
  type: string;
  isActive: boolean;
  establishmentId?: string;
  establishment?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const router = useRouter();
  const isLoggingOut = useRef(false); // Evita múltiplos redirecionamentos

  // Definir isAuthenticated antes dos useEffects
  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    // Tenta restaurar sessão do localStorage
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Interceptor global para tratar 401
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401 && !isLoggingOut.current) {
          isLoggingOut.current = true;
          setUser(null);
          setToken(null);
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          router.push('/auth/signin');
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [router]);

  // Logout por inatividade (1 hora)
  useEffect(() => {
    if (!isAuthenticated) return;

    const inactivityTimeout = 60 * 60 * 1000; // 1 hora em millisegundos
    const warningTimeout = 55 * 60 * 1000; // 5 minutos antes do logout
    let timeoutId: NodeJS.Timeout;
    let warningId: NodeJS.Timeout;
    let hasShownWarning = false;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      clearTimeout(warningId);
      hasShownWarning = false;
      setShowInactivityWarning(false);

      // Timer para mostrar aviso 5 minutos antes
      warningId = setTimeout(() => {
        if (!hasShownWarning && !isLoggingOut.current) {
          hasShownWarning = true;
          setShowInactivityWarning(true);
        }
      }, warningTimeout);

      // Timer principal para logout
      timeoutId = setTimeout(() => {
        if (!isLoggingOut.current) {
          isLoggingOut.current = true;
          setUser(null);
          setToken(null);
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          router.push('/auth/signin');
        }
      }, inactivityTimeout);
    };

    // Eventos que resetam o timer de inatividade
    const events = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 
      'click', 'keydown', 'wheel', 'focus', 'blur'
    ];

    const handleActivity = () => {
      resetTimeout();
    };

    // Adicionar listeners para todos os eventos
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Iniciar o timer
    resetTimeout();

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(warningId);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [isAuthenticated, router]);

  const handleContinueSession = () => {
    setShowInactivityWarning(false);
    // O timer será resetado automaticamente pela próxima atividade
  };

  const handleLogout = () => {
    isLoggingOut.current = true;
    setShowInactivityWarning(false);
    setUser(null);
    setToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    router.push('/auth/signin');
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/user/auth/login`, {
        email,
        password,
      });
      const { user, access_token } = response.data;
      if (!user.isActive) {
        localStorage.setItem('user', JSON.stringify(user));
        router.push('/auth/blocked');
        return;
      }
      setUser(user);
      setToken(access_token);
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      router.push('/dashboard');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Erro ao fazer login');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, loading }}>
      {children}
      <InactivityWarning
        isVisible={showInactivityWarning}
        onContinue={handleContinueSession}
        onLogout={handleLogout}
        timeLeft={300} // 5 minutos em segundos
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}; 