import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Map, Target, Users, Cloud, Leaf, Swords, Crosshair } from 'lucide-react';

const TutorialDialog = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      title: "Explorando o Céus",
      description: "Vou te mostrar como jogar, compartilhar e descobrir histórias ao seu redor.",
      icon: Map,
      color: "bg-blue-500"
    },
    {
      title: "Desafios Disponíveis",
      description: "Você pode participar de diferentes desafios para compartilhar suas histórias:",
      challenges: [
        {
          icon: Cloud,
          title: "Colecionar Névoas",
          description: "Compartilhe suas histórias pelo mundo"
        },
        {
          icon: Users,
          title: "Céus Cruzados",
          description: "Crie histórias com outros jogadores"
        },
        {
          icon: Leaf,
          title: "Céus nas mãos",
          description: "Compartilhe histórias de objetos"
        },
        {
          icon: Target,
          title: "Tecer nuvens",
          description: "Complemente outras histórias"
        }
      ],
      icon: Swords,
      color: "bg-yellow-500"
    },
    {
      title: "Navegando pelo Mapa",
      description: "Explore histórias próximas a você! As cores dos marcadores indicam diferentes tipos de histórias:\n• Laranja: Histórias pessoais\n• Azul: Histórias colaborativas\n• Roxo: Histórias de objetos",
      icon: Map,
      color: "bg-green-500"
    },
    {
      title: "Explorando Livremente",
      description: "Para navegar livremente pelo mapa:\n• Clique duas vezes no botão de GPS no canto superior direito para desativar o rastreamento\n• Agora você pode arrastar o mapa e explorar outras regiões\n• Clique novamente no botão de GPS quando quiser voltar à sua localização",
      icon: Crosshair,
      color: "bg-indigo-500"
    },
    {
      title: "Sua pagina pessoal",
      description: "Lá você pode aceitar pedidos de modificações das suas histórias ou sair da sua conta",
      icon: Users,
      color: "bg-purple-500"
    },
  ];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const currentStepData = tutorialSteps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center text-center p-4">
          <div className={`${currentStepData.color} p-3 rounded-full mb-4`}>
            <currentStepData.icon className="h-6 w-6 text-white" />
          </div>
          
          <h2 className="text-xl font-semibold mb-2">{currentStepData.title}</h2>
          
          {currentStepData.challenges ? (
            <div className="w-full space-y-3 my-4">
              {currentStepData.challenges.map((challenge, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-white rounded-full">
                    <challenge.icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium">{challenge.title}</h3>
                    <p className="text-sm text-gray-500">{challenge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 whitespace-pre-line">{currentStepData.description}</p>
          )}
          
          <div className="flex justify-between w-full mt-6">
            <div className="flex gap-1">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                    index === currentStep ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <Button onClick={handleNext}>
              {currentStep === tutorialSteps.length - 1 ? 'Começar' : 'Próximo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TutorialDialog;