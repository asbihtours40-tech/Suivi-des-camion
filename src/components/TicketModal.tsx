import React, { useState } from 'react';
import { X, Printer, Scale, Anchor, Warehouse, CheckCircle2, ZoomIn, ZoomOut, FileText } from 'lucide-react';
import { Transaction } from '../types';
import { formatDateFrench, formatWeight, formatTons, computeTransitDuration } from '../utils/storage';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  // Ultra-compact scale by default (0.78 for Bon de sortie Port, 0.82 for Bon de pesée)
  const isCompleted = transaction?.status === 'Terminé';
  const [scaleFactor, setScaleFactor] = useState<number>(isCompleted ? 0.82 : 0.78);

  if (!isOpen || !transaction) return null;

  const duration = computeTransitDuration(transaction.exitPortTime, transaction.entryDepotTime);

  const handlePrint = () => {
    window.print();
  };

  const handleZoomOut = () => {
    setScaleFactor(prev => Math.max(0.60, Number((prev - 0.08).toFixed(2))));
  };

  const handleZoomIn = () => {
    setScaleFactor(prev => Math.min(1.10, Number((prev + 0.08).toFixed(2))));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto transition-all max-w-[340px] w-full">
        
        {/* Modal Controls Bar */}
        <div className="bg-slate-900 text-white px-3 py-1.5 flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">
              {isCompleted ? 'Bon de Pesée Cosumar' : 'Bon de Sortie Port'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Quick Zoom buttons */}
            <div className="flex items-center bg-slate-800 rounded px-1 py-0.5 border border-slate-700 text-[10px]">
              <button
                onClick={handleZoomOut}
                className="px-0.5 text-slate-300 hover:text-white cursor-pointer"
                title="Réduire davantage la taille du bon"
              >
                <ZoomOut className="w-2.5 h-2.5" />
              </button>
              <span className="px-1 font-mono text-[9px] text-cyan-300">
                {Math.round(scaleFactor * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="px-0.5 text-slate-300 hover:text-white cursor-pointer"
                title="Agrandir la taille du bon"
              >
                <ZoomIn className="w-2.5 h-2.5" />
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-semibold transition cursor-pointer"
              title="Imprimer le bon format ticket"
            >
              <Printer className="w-3 h-3" />
              <span>Imprimer</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Content (Ultra compact layout) */}
        <div 
          id="printable-ticket" 
          className="bg-white text-slate-900 font-sans p-3 origin-top transition-transform"
          style={{
            transform: `scale(${scaleFactor})`,
            transformOrigin: 'top center',
            marginBottom: `${(scaleFactor - 1) * 340}px`
          }}
        >
          
          {/* Header Ticket: Cosumar Brand */}
          <div className="border-b border-slate-900 pb-1.5 mb-2 text-center relative">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <span className="font-bold text-[9px] text-blue-900 uppercase tracking-wider">
                كـوسـومـار • COSUMAR
              </span>
            </div>
            <h2 className="font-black uppercase tracking-tight text-slate-900 text-xs leading-tight">
              {isCompleted ? 'BON DE PESÉE PONT-BASCULE' : 'BON DE SORTIE PORT'}
            </h2>
            <div className="text-[8px] font-semibold text-slate-500">
              {isCompleted ? 'Réception Site Cosumar' : '(SANS PESÉE AU PORT)'}
            </div>

            <div className="mt-1 inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 font-mono text-[9px] font-bold">
              <span>N° :</span>
              <span className="text-blue-700 font-black">{transaction.id}</span>
            </div>
          </div>

          {/* Core Information Grid */}
          <div className="space-y-1 text-[10px] mb-2">
            
            {/* Truck & Driver */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-50 rounded border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[7px] uppercase font-bold">Matricule Camion</span>
                <span className="font-mono text-[11px] font-black text-slate-900 bg-yellow-100 px-1 rounded border border-yellow-300 inline-block">
                  {transaction.truckID}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[7px] uppercase font-bold">Conducteur</span>
                <span className="font-bold text-slate-800 text-[10px] truncate block leading-tight">
                  {transaction.driverName}
                </span>
              </div>
            </div>

            {/* Merchandise */}
            <div className="p-1 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-500 block text-[7px] uppercase font-bold">Marchandise / Produit</span>
              <span className="font-bold text-slate-900 text-[10px] block leading-tight">{transaction.product}</span>
              {transaction.carrier && (
                <div className="text-[8px] text-slate-500 mt-0.5">
                  Transporteur : <strong className="text-slate-700">{transaction.carrier}</strong>
                </div>
              )}
            </div>

            {/* Departure Port Time */}
            <div className="flex justify-between items-center py-0.5 border-b border-slate-200 text-[9px]">
              <span className="text-slate-600 flex items-center gap-1">
                <Anchor className="w-2.5 h-2.5 text-blue-600" />
                Sortie Port :
              </span>
              <span className="font-mono font-semibold text-slate-900">
                {formatDateFrench(transaction.exitPortTime)}
              </span>
            </div>

            {/* Destination */}
            <div className="flex justify-between items-center py-0.5 border-b border-slate-200 text-[9px]">
              <span className="text-slate-600 flex items-center gap-1">
                <Warehouse className="w-2.5 h-2.5 text-amber-600" />
                Destination :
              </span>
              <span className="font-bold text-amber-900">
                Usine Cosumar
              </span>
            </div>

            {/* If In Transit Notice */}
            {!isCompleted && (
              <div className="p-1.5 bg-amber-50 border border-amber-300 rounded text-amber-900 space-y-0.5 mt-1">
                <div className="font-bold text-[8px] flex items-center gap-1">
                  <span>⚠️ MENTION OBLIGATOIRE :</span>
                </div>
                <p className="text-[8px] leading-snug">
                  Camion sorti du Port <strong>SANS PESÉE</strong>. Pesage officiel obligatoire (Brut & Tare) à l'arrivée au pont-bascule de <strong>Cosumar</strong>.
                </p>
              </div>
            )}

            {/* If Completed: Weights Table for Bon de Pesée */}
            {isCompleted && (
              <div className="space-y-1 pt-0.5">
                <div className="flex justify-between items-center py-0.5 border-b border-slate-200 text-[9px]">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Warehouse className="w-2.5 h-2.5 text-amber-600" />
                    Entrée Cosumar :
                  </span>
                  <span className="font-mono font-semibold text-slate-900">
                    {formatDateFrench(transaction.entryDepotTime)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600 text-[8px]">
                  <span>Durée de transit :</span>
                  <span className="font-semibold text-slate-800">{duration}</span>
                </div>

                {/* Weighbridge Results */}
                <div className="mt-1 border border-slate-900 rounded overflow-hidden">
                  <div className="bg-slate-900 text-white px-1.5 py-0.5 font-bold text-[8px] uppercase tracking-wider flex justify-between">
                    <span>Relevé Pont-Bascule Cosumar</span>
                    <span className="text-amber-400">Métrologie</span>
                  </div>

                  <div className="p-1 space-y-0.5 bg-slate-50/50">
                    <div className="flex justify-between items-center text-[9px]">
                      <span className="text-slate-600">Poids Brut :</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatWeight(transaction.grossWeight)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[9px]">
                      <span className="text-slate-600">Tare (camion vide) :</span>
                      <span className="font-mono font-bold text-slate-700">
                        {formatWeight(transaction.tare)}
                      </span>
                    </div>

                    <div className="pt-0.5 border-t border-slate-900 flex justify-between items-baseline">
                      <div>
                        <span className="font-black text-[9px] uppercase text-slate-900 block">POIDS NET FACTURABLE :</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-xs text-emerald-800 block leading-tight">
                          {formatWeight(transaction.netWeight)}
                        </span>
                        <span className="font-bold text-[8px] text-emerald-600">
                          {formatTons(transaction.netWeight)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {transaction.notes && (
              <div className="text-[8px] text-slate-500 italic pt-0.5">
                Note : {transaction.notes}
              </div>
            )}

          </div>

          {/* Signatures & Stamps */}
          <div className="grid grid-cols-2 gap-1 pt-1 border-t border-dashed border-slate-300 text-center text-[7px]">
            <div className="p-1 border border-slate-200 rounded min-h-[32px] flex flex-col justify-between">
              <span className="font-bold text-slate-500 uppercase">Visa Conducteur</span>
              <span className="font-mono text-slate-400">Lu et approuvé</span>
            </div>
            <div className="p-1 border border-slate-200 rounded min-h-[32px] flex flex-col justify-between">
              <span className="font-bold text-slate-500 uppercase">
                {isCompleted ? 'Pont-Bascule Cosumar' : 'Capitainerie Port'}
              </span>
              <span className="font-mono text-emerald-700 font-bold flex items-center justify-center gap-0.5">
                <CheckCircle2 className="w-2 h-2" /> Validé
              </span>
            </div>
          </div>

          {/* Barcode visual fake */}
          <div className="mt-1 pt-1 border-t border-slate-100 flex flex-col items-center justify-center text-slate-400">
            <div className="font-mono text-xs tracking-[0.2em] font-black select-none leading-none">
              ||| | |||| || ||| || |||| | ||
            </div>
            <span className="font-mono text-[6px] text-slate-400 mt-0.5">
              REF-PORT-COSUMAR-{transaction.id}-{transaction.truckID}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
