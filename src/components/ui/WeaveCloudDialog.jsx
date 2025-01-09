import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Cloud, MapPin, Pencil } from 'lucide-react';

const WeaveCloudDialog = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="h-6 w-6 text-purple-500" />
            <DialogTitle>Tecer Nuvens</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <MapPin className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
            <span>Encontre um ponto laranja no mapa - estes são registros de memórias compartilhadas por outros jogadores.</span>
          </div>
          
          <div className="flex items-start gap-4">
            <Pencil className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
            <span>Ao clicar no ponto, você encontrará a opção "Tecer uma nova versão" - use-a para complementar a história original com sua própria perspectiva, criando uma nova camada de significado para aquele lugar especial.</span>
          </div>
        </div>


      </DialogContent>
    </Dialog>
  );
};

export default WeaveCloudDialog;