import React, { useState, useEffect } from 'react';
import { X, Scale, AlertCircle, CheckCircle2, Search, ArrowRight, Printer, Clock } from 'lucide-react';
import { Transaction } from '../types';
import { formatWeight, formatDateFrench, computeTransitDuration } from '../utils/storage';

interface ArriveeDepotModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  initialSelectedTruckId: string | null;
  onSubmitWeighing: (transactionId: string, gross: number, tare: number, notes?: string) => Transaction;
  onPrintTicket: (transaction: Transaction) => void;
}

export const ArriveeDepotModal: React.FC<ArriveeDepotModalProps> = ({
  isOpen,
  onClose,
  transactions,
  initialSelectedTruckId,
  onSubmitWeighing,
  onPrintTicket,
}) => {
  const inTransitTrucks = transactions.filter(t => t.status === 'En transit');

  const [selectedTruckId, setSelectedTruckId] = useState<string>('');
  const [searchTruckInput, setSearchTruckInput] = useState<string>('');
  const [grossInput, setGrossInput] = useState<string>('');
  const [tareInput, setTareInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Success summary state (matches VBA MsgBox)
  const [successData, setSuccessData] = useState<{
    transaction: Transaction;
    brut: number;
    tare: number;
    net: number;
  } | null>(null);

  useEffect(() => {
    if (initialSelectedTruckId) {
      setSelectedTruckId(initialSelectedTruckId);
    } else if (inTransitTrucks.length > 0 && !selectedTruckId) {
      setSelectedTruckId(inTransitTrucks[0].id);
    }
  }, [initialSelectedTruckId, inTransitTrucks, selectedTruckId]);

  // Clean inputs on open/close
  useEffect(() => {
    if (!isOpen) {
      setGrossInput('');
      setTareInput('');
      setNotesInput('');
      setError(null);
      setSuccessData(null);
      setSearchTruckInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedTransaction = transactions.find(t => t.id === selectedTruckId) || inTransitTrucks[0] || null;

  // Filter trucks for searchable picker
  const filteredTrucks = inTransitTrucks.filter(t => 
    t.truckID.toLowerCase().includes(searchTruckInput.toLowerCase()) ||
    t.driverName.toLowerCase().includes(searchTruckInput.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTruckInput.toLowerCase())
  );

  const grossNum = parseFloat(grossInput);
  const tareNum = parseFloat(tareInput);
  const isGrossValid = !isNaN(grossNum) && grossNum > 0;
  const isTareValid = !isNaN(tareNum) && tareNum >= 0;
  const netCalculated = isGrossValid && isTareValid && grossNum > tareNum ? grossNum - tareNum : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTransaction) {
      setError('Aucun camion en transit sélectionné.');
      return;
    }

    if (!isGrossValid) {
      setError('Veuillez saisir un Poids Brut valide (supérieur à 0 Kg).');
      return;
    }

    if (!isTareValid) {
      setError('Veuillez saisir une Tare valide (supérieure ou égale à 0 Kg).');
      return;
    }

    if (grossNum <= tareNum) {
      setError('Erreur de pesée : Le Poids Brut doit être strictement supérieur à la Tare du camion.');
      return;
    }

    setError(null);
    const updated = onSubmitWeighing(
      selectedTransaction.id, 
      grossNum, 
      tareNum,
      notesInput.trim() || undefined
    );

    setSuccessData({
      transaction: updated,
      brut: grossNum,
      tare: tareNum,
      net: grossNum - tareNum,
    });
  };

  const handleResetAndClose = () => {
    setError(null);
    setSuccessData(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-xs">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/10 ring-1 ring-white/20">
              <Scale className="w-4 h-4 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-200 bg-amber-900/50 px-1.5 py-0.2 rounded">
                  Macro 2 • EnregistrerArriveeCosumar
                </span>
                <span className="text-[11px] text-amber-100 font-bold">
                  Pont-Bascule Cosumar
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5">
                Entrée & Pesage Obligatoire à Cosumar
              </h3>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1 rounded text-amber-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5">
          {successData ? (
            /* Compact success dialog */
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs text-slate-800">
                  <p className="font-bold text-sm text-emerald-950">
                    Arrivée et Pesée enregistrées à Cosumar pour {successData.transaction.truckID} !
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Pesée Cosumar validée conformément au processus macro.
                  </p>
                </div>
              </div>

              {/* MsgBox Details */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between py-0.5 border-b border-slate-200">
                  <span className="text-slate-500">Camion :</span>
                  <span className="font-mono font-bold text-slate-900 bg-yellow-100 px-1.5 py-0.2 rounded border border-yellow-300">
                    {successData.transaction.truckID}
                  </span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-200">
                  <span className="text-slate-500">Produit :</span>
                  <span className="font-semibold text-slate-800">{successData.transaction.product}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Poids Brut :</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatWeight(successData.brut)}
                  </span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Tare :</span>
                  <span className="font-mono font-bold text-slate-700">
                    {formatWeight(successData.tare)}
                  </span>
                </div>
                <div className="flex justify-between py-1 bg-emerald-100/70 px-2 rounded font-bold text-emerald-900">
                  <span>POIDS NET :</span>
                  <span className="font-mono text-sm">{formatWeight(successData.net)}</span>
                </div>
                <div className="flex justify-between py-0.5 text-[11px] text-slate-500">
                  <span>Heure Entrée Cosumar :</span>
                  <span className="font-mono font-medium text-slate-700">
                    {formatDateFrench(successData.transaction.entryDepotTime)}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => onPrintTicket(successData.transaction)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-xs transition cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer Bon de Pesée</span>
                </button>
                <button
                  onClick={handleResetAndClose}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded text-xs transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : inTransitTrucks.length === 0 ? (
            /* No trucks in transit */
            <div className="text-center py-6 space-y-2">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                Aucun camion "En transit" actuellement
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Le pesage à Cosumar requiert qu'un camion soit d'abord parti du Port sans pesée.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleResetAndClose}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-xs rounded transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            /* Main Form */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Error Banner */}
              {error && (
                <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Step 1: Select In-Transit Truck */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  1. Sélectionner le camion arrivant au pont-bascule Cosumar <span className="text-red-500">*</span>
                </label>
                
                {/* Search / Filter if more than 3 trucks */}
                {inTransitTrucks.length > 3 && (
                  <div className="relative mb-1.5">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filtrer immatriculation ou chauffeur..."
                      value={searchTruckInput}
                      onChange={(e) => setSearchTruckInput(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800"
                    />
                  </div>
                )}

                {/* Truck selection pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {filteredTrucks.map((t) => {
                    const isSelected = selectedTransaction?.id === t.id;
                    const duration = computeTransitDuration(t.exitPortTime);

                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTruckId(t.id)}
                        className={`p-2 rounded border transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-50/80 border-amber-500 ring-1 ring-amber-500'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-black text-slate-900 bg-yellow-100 px-1.5 py-0.2 rounded border border-yellow-300">
                            {t.truckID}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">{t.id}</span>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-700 font-medium truncate">
                          {t.product}
                        </div>
                        <div className="mt-0.5 flex items-center justify-between text-[10px] text-slate-500">
                          <span className="truncate">{t.driverName}</span>
                          <span className="flex items-center gap-0.5 text-amber-800 font-semibold shrink-0">
                            <Clock className="w-2.5 h-2.5" />
                            {duration}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Truck Selected Recap */}
              {selectedTransaction && (
                <div className="p-2.5 bg-amber-50/60 rounded border border-amber-200 text-xs space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-amber-900">Camion : <strong className="font-mono">{selectedTransaction.truckID}</strong></span>
                    <span className="text-slate-600">Chauffeur : <strong>{selectedTransaction.driverName}</strong></span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Sortie Port :</span>
                    <span className="text-slate-700">{formatDateFrench(selectedTransaction.exitPortTime)}</span>
                  </div>
                  <div className="flex justify-between pt-0.5 border-t border-amber-200/60 font-semibold text-amber-900 text-[11px]">
                    <span>Durée trajet Port ➔ Cosumar :</span>
                    <span>{computeTransitDuration(selectedTransaction.exitPortTime)}</span>
                  </div>
                </div>
              )}

              {/* Weighing Inputs (Gross & Tare) */}
              <div className="border-t border-slate-200 pt-2.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-amber-600" />
                    2. Pesage obligatoire au Pont-Bascule Cosumar
                  </span>
                  <span className="text-[10px] text-slate-500">Unité : Kg</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Gross Weight (Brut) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Poids Brut (en Kg) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="input-gross-weight"
                        type="number"
                        min="1"
                        step="10"
                        value={grossInput}
                        onChange={(e) => setGrossInput(e.target.value)}
                        placeholder="ex: 42350"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 font-mono font-bold text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                        Kg
                      </div>
                    </div>
                  </div>

                  {/* Tare Weight (Tare) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Tare du camion à vide (en Kg) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="input-tare-weight"
                        type="number"
                        min="0"
                        step="10"
                        value={tareInput}
                        onChange={(e) => setTareInput(e.target.value)}
                        placeholder="ex: 14820"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 font-mono font-bold text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                        Kg
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net calculation preview box */}
                <div className="p-2 bg-slate-100 rounded border border-slate-200 flex items-center justify-between">
                  <div className="text-[11px]">
                    <span className="font-bold text-slate-700 block">Poids Net Calculé (Brut - Tare) :</span>
                    <span className="text-[10px] text-slate-500">Calcul automatique conforme formule VBA</span>
                  </div>
                  <div className="text-right">
                    {netCalculated !== null ? (
                      <span className="font-mono font-black text-base text-emerald-800">
                        {formatWeight(netCalculated)}
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-slate-400 italic">
                        En attente saisie...
                      </span>
                    )}
                  </div>
                </div>

                {/* Observations */}
                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                    Observations de pesée (optionnel)
                  </label>
                  <input
                    type="text"
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="ex: Échantillonnage conforme, bâche scellée"
                    className="w-full px-2.5 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  id="btn-submit-arrivee-depot"
                  type="submit"
                  disabled={!selectedTransaction || !isGrossValid || !isTareValid || grossNum <= tareNum}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-white font-semibold text-xs rounded shadow-xs transition cursor-pointer ${
                    !selectedTransaction || !isGrossValid || !isTareValid || grossNum <= tareNum
                      ? 'bg-slate-400 cursor-not-allowed opacity-60'
                      : 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Valider Pesée Cosumar</span>
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
