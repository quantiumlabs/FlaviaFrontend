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
      const response = await fetch(`http://localhost:5522/auth/${endpoint}`, {
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
        localStorage.setItem('isFirstLogin', 'true'); // Marca como primeiro login
        router.push('/story/create'); // Redireciona para o fluxo de registro
      } else {
        router.push('/map'); // Redireciona para o mapa
      }
    } catch (error) {
      setError(error.message);
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
              className="pr-10 text-base sm:text-lg" // Adiciona tamanho de fonte responsivo
              aria-label="Nome de usuário"
            />
              <label htmlFor="username" className="absolute inset-y-0 right-0 flex items-center px-3">
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
                className="pr-10 text-base sm:text-lg" // Adiciona tamanho de fonte responsivo
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
                <AlertDescription>Houve um erro nos nossos servidores. Por favor, tente novamente mais tarde.</AlertDescription>
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