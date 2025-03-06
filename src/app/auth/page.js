'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check for token - keep existing pattern
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        // Verify the stored data has proper format
        const user = JSON.parse(userData);
        if (user && user.id && user.username) {
          router.push('/map');
          return;
        }
      } catch (e) {
        // Invalid user data, clear it
        clearInvalidData();
      }
    }
    
    // If we get here, either no token or invalid data
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get('mode');
    if (mode === 'register') {
      setIsLogin(false);
    }
  }, [router]);

  const clearInvalidData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const validateForm = () => {
    // More robust validation
    const usernameValid = formData.username.trim().length >= 3;
    const passwordValid = formData.password.length >= 8;
    
    if (!usernameValid) {
      setError('O nome de usuário deve ter pelo menos 3 caracteres.');
      return false;
    }
    
    if (!passwordValid) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return false;
    }
    
    return true;
  };

  const getErrorMessage = (message) => {
    // Generic error messages for security
    const errorMessages = {
      'Invalid credentials': 'Credenciais inválidas. Verifique seu nome de usuário e senha.',
      'Username and password are required': 'Por favor, preencha todos os campos',
      'Usuário já existe': 'Este nome de usuário não está disponível',
      'default': 'Houve um erro. Por favor, tente novamente mais tarde.'
    };

    return errorMessages[message] || errorMessages.default;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin ? 'login' : 'register';
      
      // Add a request ID header for improved security
      const requestId = Math.random().toString(36).substring(2, 15);
      
      const response = await fetch(`https://ceusgame.com:5522/auth/${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password
        }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro inesperado.');
      }

      // Keep the existing storage pattern as is
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (!isLogin) {
        localStorage.setItem('isFirstLogin', 'true');
      }
      
      router.push('/map');
      
    } catch (error) {
      setError(getErrorMessage(error.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <Card className="max-w-md w-full mx-4 shadow-lg rounded-xl bg-white p-6 space-y-6">
        <CardHeader className="text-center py-2">
          <CardTitle className="text-2xl font-semibold text-blue-600">
            {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
          </CardTitle>
          <p className="text-blue-400 text-sm">
            {isLogin
              ? 'Faça login para acessar sua conta.'
              : 'Cadastre-se para começar sua jornada.'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                id="username"
                name="username"
                placeholder="Nome de usuário"
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, username: e.target.value }))
                }
                disabled={isLoading}
                required
                className="pr-10 text-base sm:text-lg"
                aria-label="Nome de usuário"
              />
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                disabled={isLoading}
                required
                minLength={8}
                className="pr-10 text-base sm:text-lg"
                aria-label="Senha"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center px-3"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              className={clsx(
                'w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2',
                isLoading && 'cursor-not-allowed'
              )}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin h-5 w-5" />
                  <span>Carregando...</span>
                </div>
              ) : isLogin ? (
                'Entrar'
              ) : (
                'Cadastrar'
              )}
            </Button>
          </form>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-blue-500 hover:underline"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFormData({ username: '', password: '' });
            }}
          >
            {isLogin
              ? 'Não tem uma conta? Cadastre-se'
              : 'Já tem uma conta? Entre aqui'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}