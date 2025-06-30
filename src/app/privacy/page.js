"use client";

import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Shield, Lock, ScrollText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const PrivacyPolicySection = ({ title, content, isActive, onClick }) => (
  <motion.div
    className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
      isActive 
        ? 'bg-violet-100 border-violet-500 shadow-lg' 
        : 'border-violet-200 bg-white/80 hover:border-violet-300'
    }`}
    onClick={onClick}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <h3 className="font-['Press_Start_2P'] text-lg text-violet-900 mb-4">{title}</h3>
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2 text-violet-700"
        >
          {Array.isArray(content) ? (
            <ul className="space-y-2">
              {content.map((item, idx) => (
                <motion.li 
                  key={idx}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex gap-2 items-start"
                >
                  <Sparkles className="flex-shrink-0 mt-1 w-4 h-4 text-violet-400" />
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          ) : (
            <p>{content}</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

const PrivacyPolicy = () => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(null);
  const currentDate = new Date().toLocaleDateString('pt-BR');
  
  
  const sections = [
    {
      id: 1,
      title: "1. Controlador dos Dados",
      content: "A Uork, inscrita no CNPJ 50218836000135, com sede em PRAÇA TIRADENTES, 250, é responsável pelo tratamento dos dados pessoais coletados.",
      icon: Shield
    },
    {
      id: 2,
      title: "2. Dados Coletados",
      content: [
        "Dados de localização para associar histórias a locais específicos.",
        "Conteúdo gerado pelo usuário: áudios, imagens e textos."
      ],
      icon: Lock
    },
    {
      id: 3,
      title: "3. Finalidade do Tratamento de Dados",
      content: [
        "Disponibilizar o serviço e conteúdo no jogo.",
        "Garantir segurança e prevenir fraudes.",
        "Cumprir obrigações legais."
      ],
      icon: ScrollText
    },
    {
      id: 4,
      title: "4. Bases Legais para o Tratamento",
      content: [
        "Consentimento do usuário.",
        "Execução de contrato.",
        "Cumprimento de obrigação legal.",
        "Legítimo interesse."
      ],
      icon: Shield
    },
    {
      id: 5,
      title: "5. Compartilhamento de Dados",
      content: "Os dados podem ser compartilhados com prestadores de serviços e autoridades governamentais, quando necessário.",
      icon: Lock
    },
    {
      id: 6,
      title: "6. Direitos do Titular dos Dados",
      content: "O usuário tem direito de acessar, corrigir, excluir e solicitar portabilidade dos dados.",
      icon: Shield
    },
    {
      id: 7,
      title: "7. Armazenamento e Segurança dos Dados",
      content: "Os dados são armazenados em servidores seguros, protegidos contra acessos não autorizados.",
      icon: Lock
    },
    {
      id: 8,
      title: "8. Retenção dos Dados",
      content: "Os dados serão mantidos pelo tempo necessário para cumprir as finalidades descritas nesta política.",
      icon: ScrollText
    },
    {
      id: 9,
      title: "9. Transferência Internacional de Dados",
      content: "Se houver transferência de dados para servidores no exterior, garantiremos conformidade com a LGPD.",
      icon: Shield
    },
    {
      id: 10,
      title: "10. Cookies e Tecnologias de Rastreamento",
      content: "Utilizamos cookies para melhorar a experiência. O usuário pode gerenciar as preferências de cookies no navegador.",
      icon: Lock
    }
  ];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-violet-100 to-violet-200">
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <motion.button
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500 text-white hover:bg-violet-600 transition-colors font-['Press_Start_2P'] text-sm mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </motion.button>

          {/* Title Section */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-12 text-center"
          >
            <h1 className="font-['Press_Start_2P'] text-4xl text-violet-900 mb-4">
              Política de Privacidade
            </h1>
            <p className="text-violet-600">
              Última atualização: {currentDate}
            </p>
          </motion.div>

          {/* Introduction */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-6 mb-8 rounded-lg border-2 border-violet-200 shadow-lg bg-white/80"
          >
            <p className="text-violet-800">
              A <span className="font-['Press_Start_2P'] text-violet-900">Uork</span> está 
              comprometida em proteger a privacidade dos usuários do jogo 
              <span className="font-['Press_Start_2P'] text-violet-900"> "Céus"</span>, 
              em conformidade com a Lei Geral de Proteção de Dados (LGPD).
            </p>
          </motion.div>

          {/* Sections */}
          <div className="space-y-4">
            {sections.map((section, index) => (
              <PrivacyPolicySection
                key={section.id}
                title={section.title}
                content={section.content}
                isActive={activeSection === section.id}
                onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
              />
            ))}
          </div>

          {/* Contact Section */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-8 text-center"
          >
            <p className="text-violet-700">
              Para dúvidas ou solicitações, entre em contato:
              <a 
                href="mailto:contato@quantiumlabs.com.br"
                className="block mt-2 font-['Press_Start_2P'] text-violet-500 hover:text-violet-600 transition-colors"
              >
                contato@quantiumlabs.com.br
              </a>
            </p>
          </motion.div>

          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 text-center text-violet-500 font-['Press_Start_2P'] text-sm"
          >
            V QL1.5.0 2025
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
