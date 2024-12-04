'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';


export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/map');
    }
  }, [router]);

  const validateForm = () => {
    if (!formData.username || !formData.password) {
      setError('Nome de usuário e senha são obrigatórios');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    const endpoint = isLogin ? 'login' : 'register';
    
    try {
      const response = await fetch(`http://192.168.15.5:5522/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessages = {
          'Username and password are required': 'Nome de usuário e senha são obrigatórios',
          'Invalid credentials': 'Credenciais inválidas',
          'Usuário já existe': 'Usuário já existe',
        };
        
        throw new Error(errorMessages[data.message] || data.message || 'Erro ao processar requisição');
      }
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Check if the user is an admin
      const isAdmin = data.isAdmin;
      
      if (endpoint === 'register') {
        localStorage.setItem('isFirstLogin', 'true');
        setIsLogin(true);
        setError('Cadastro realizado com sucesso. Faça login agora.');
      } else {
        if (isAdmin) {
          router.push('/admin');
        } else if (localStorage.getItem('isFirstLogin') === 'true') {
          router.push('/story/create');
        } else {
          router.push('/map');
        }
      }
    } catch (error) {
      console.error('Erro de autenticação:', error);
      setError(error.message || 'Erro ao conectar com o servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-96">
        <CardHeader className="text-2xl font-bold text-center">
          {isLogin ? 'Entrar' : 'Cadastrar'}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                name="username"
                placeholder="Nome de usuário"
                value={formData.username}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              />
              <Input
                name="password"
                type="password"
                placeholder="Senha"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
                required
                minLength={6}
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Processando...' : isLogin ? 'Entrar' : 'Cadastrar'}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setFormData({ username: '', password: '' });
              }}
              disabled={isLoading}
            >
              {isLogin ? 'Precisa de uma conta?' : 'Já tem uma conta?'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}