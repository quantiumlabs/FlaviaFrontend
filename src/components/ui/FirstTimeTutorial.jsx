import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const FirstTimeTutorial = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState(0);
  const [hasDeclinedOnce, setHasDeclinedOnce] = useState(false);
  const [timer, setTimer] = useState(30);
  const [showInitialDialog, setShowInitialDialog] = useState(true);
  const [restartKey, setRestartKey] = useState(0); // Chave para forçar reinicialização

  const dialogContent = [
    {
      message: "Olhe ao seu redor... Já percebeu como cada passo conta uma história?",
      className: "text-xl font-medium",
    },
    {
      message: "Enquanto seus pés tocam o chão, deixe seus pensamentos se misturarem ao caminho. Observe as pessoas que passam, as marcas que deixam.",
      className: "text-lg",
    },
    {
      message: "Simplesmente contemple o caminho que está fazendo. Quando algo chamar sua atenção, uma conexão, um sentimento com o lugar... pare.",
      className: "text-lg",
    },
    {
      message: "Já sentiu uma conexão? Algo que te inspirou?",
      className: "text-xl font-medium",
    },
  ];

  // Reinicia o diálogo e o cronômetro
  const resetDialog = () => {
    setStep(0);
    setTimer(30);
    setShowInitialDialog(true);
    setRestartKey((prev) => prev + 1); // Incrementa a chave para reiniciar os efeitos
  };

  useEffect(() => {
    if (isOpen) {
      // Exibe o diálogo inicial por 3 segundos
      const initialTimeout = setTimeout(() => {
        setShowInitialDialog(false);
      }, 5000);

      // Atualiza o cronômetro
      const timerInterval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearTimeout(initialTimeout);
        clearInterval(timerInterval);
      };
    }
  }, [isOpen, restartKey]); // Reinicia o efeito ao mudar a chave

  useEffect(() => {
    // Avança os passos do diálogo
    if (!showInitialDialog && timer === 0 && step < dialogContent.length - 1) {
      const stepTimeout = setTimeout(() => {
        setStep((prev) => prev + 1);
      }, 10000);

      return () => clearTimeout(stepTimeout);
    }
  }, [showInitialDialog, timer, step]);

  const handleNo = () => {
    setHasDeclinedOnce(true);
    resetDialog(); // Reinicia o fluxo
  };

  const getDeclineResponse = () => {
    return hasDeclinedOnce ? "Continue caminhando até estar pronto" : "Caminhe!";
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Floating Timer */}
      {timer > 0 && !showInitialDialog && (
        <div className="fixed top-4 right-4 bg-white/90 backdrop-blur rounded-lg shadow-lg p-3 z-50">
          <span className="text-lg font-medium">{timer}s</span>
        </div>
      )}

      {/* Main Dialog */}
      {showInitialDialog || timer === 0 ? (
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-lg">
            <div className="p-6">
              {timer > 0 ? (
                <div className="text-center space-y-4">
                  <p className="text-lg">
                    Bem-vindo! Para começar, observe as histórias ao seu redor por {timer} segundos.
                  </p>
                  <p className="text-sm text-gray-500">
                    O diálogo irá desaparecer para que você possa observar melhor o ambiente...
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className={dialogContent[step].className}>
                    {dialogContent[step].message}
                  </p>

                  {step === dialogContent.length - 1 && (
                    <div className="flex justify-center gap-4 mt-6">
                      <Button onClick={() => onComplete(true)} className="px-8">
                        Sim
                      </Button>
                      <Button variant="outline" onClick={handleNo} className="px-8">
                        Não
                      </Button>
                    </div>
                  )}

                  {hasDeclinedOnce && step === 0 && (
                    <p className="text-center text-gray-600 mt-4">
                      {getDeclineResponse()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
};

export default FirstTimeTutorial;