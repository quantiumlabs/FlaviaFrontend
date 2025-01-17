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
            <Pencil className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
            <span>Agora, é a sua vez de tecer algo novo nesse céu compartilhado. Adicione suas palavras, sua visão, seu olhar. Cada fio que você entrelaça transforma o que foi contado em algo maior. </span>
          </div>
          
          <div className="flex items-start gap-4">
            <MapPin className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
            <span>Missão: Encontre um ponto laranja no mapa. Ao clicar nele, você poderá complementar a história com áudio, foto ou texto.</span>
          </div>
        </div>


      </DialogContent>
    </Dialog>
  );
};

export default WeaveCloudDialog;