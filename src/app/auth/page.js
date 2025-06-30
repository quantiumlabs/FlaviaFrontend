'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/map');
    } else {
      const searchParams = new URLSearchParams(window.location.search);
      const mode = searchParams.get('mode');
      if (mode === 'register') {
        setIsLogin(false);
      }
    }
  }, [router]);

  const validateForm = () => formData.username && formData.password;

  const getErrorMessage = (message) => {
    const errorMessages = {
      'Invalid credentials': 'Usuário ou senha incorretos. Por favor, verifique suas informações.',
      'Username and password are required': 'Preencha todos os campos para continuar.',
      'Usuário já existe': 'Este nome de usuário já está em uso.',
      'default': 'Ops, algo deu errado por aqui. Nossa equipe já está verificando. Tente novamente mais tarde.'    };

    return errorMessages[message] || errorMessages.default;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin ? 'login' : 'register';
      const response = await fetch(`https://ceusgame.com:5522/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro inesperado.');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (!isLogin) {
        localStorage.setItem('isFirstLogin', 'true');
        router.push('/map');
      } else {
        router.push('/map');
      }
    } catch (error) {
      setError(getErrorMessage(error.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Card className="p-6 mx-4 space-y-6 w-full max-w-md bg-white rounded-xl shadow-lg">
        <CardHeader className="py-2 text-center">
          <CardTitle className="text-2xl font-semibold text-blue-600">
            {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
          </CardTitle>
          <p className="text-sm text-blue-400">
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
              <label htmlFor="username" className="flex absolute inset-y-0 right-0 items-center px-3">
              </label>
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
                minLength={6}
                className="pr-10 text-base sm:text-lg"
                aria-label="Senha"
              />
              <button
                type="button"
                className="flex absolute inset-y-0 right-0 items-center px-3"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                <div className="flex gap-2 justify-center items-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
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
