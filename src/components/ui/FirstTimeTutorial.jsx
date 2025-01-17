import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const FirstTimeTutorial = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState(0);
  const [timer, setTimer] = useState(30);
  const [showInitialDialog, setShowInitialDialog] = useState(true);
  const [showWaitingDialog, setShowWaitingDialog] = useState(false);
  const [showReadyButton, setShowReadyButton] = useState(false);

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

  useEffect(() => {
    if (isOpen) {
      const initialTimeout = setTimeout(() => {
        setShowInitialDialog(false);
      }, 5000);

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
  }, [isOpen]);

  useEffect(() => {
    if (!showInitialDialog && timer === 0 && step < dialogContent.length - 1 && !showWaitingDialog) {
      const stepTimeout = setTimeout(() => {
        setStep((prev) => prev + 1);
      }, 10000);

      return () => clearTimeout(stepTimeout);
    }
  }, [showInitialDialog, timer, step, showWaitingDialog]);

  const handleNo = () => {
    setShowWaitingDialog(true);
    setShowReadyButton(true);

    setTimeout(() => {
      setShowWaitingDialog(false);
      setShowInitialDialog(false);
      setTimer(0);
      setStep(dialogContent.length);
    }, 5000);
  };

  const handleReady = () => {
    onComplete(true);
  };

  const calculateProgress = () => {
    if (timer > 0) return 0;
    return ((step + 1) / dialogContent.length) * 100;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Ready Button */}
      {showReadyButton && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <Button onClick={handleReady} className="px-8 py-2 bg-primary hover:bg-primary/90">
            Estou pronto
          </Button>
        </div>
      )}

      {/* Waiting Dialog */}
      {showWaitingDialog && (
        <Dialog open={true} hideClose>
          <DialogContent className="sm:max-w-lg" hideClose>
            <div className="p-6 text-center">
              <p className="text-lg">
                Quando estiver pronto, pare e grave a sua história.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Main Dialog */}
      {!showWaitingDialog && !showReadyButton && (showInitialDialog || timer === 0) && step < dialogContent.length && (
        <Dialog open={true} hideClose>
          <DialogContent className="sm:max-w-lg" hideClose>
            <div className="p-6">
              {timer > 0 ? (
                <div className="text-center space-y-4">
                  <p className="text-lg">
                    Bem-vindo! Para começar, observe as histórias ao seu redor.
                  </p>
                  <p className="text-sm text-gray-500">
                    O diálogo irá desaparecer para que você possa observar melhor o ambiente...
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <Progress value={calculateProgress()} className="w-full mb-4" />
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
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default FirstTimeTutorial;