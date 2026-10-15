import React, { useState } from 'react';
import { X, Truck, Search, Plus, ArrowRight, ShieldCheck } from 'lucide-react';
import { COSUMAR_FLEET, CosumarTruck } from '../data/cosumarFleet';

interface CosumarFleetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTruckForDepart: (truck: CosumarTruck) => void;
}

export const CosumarFleetModal: React.FC<CosumarFleetModalProps> = ({
  isOpen,
  onClose,
  onSelectTruckForDepart,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = COSUMAR_FLEET.filter(
    t => t.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
         t.driver.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-xs flex flex-col max-h-[85vh]">
        
        {/* Mobile Header matching Cosumar app */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-white text-blue-900 font-black flex items-center justify-center text-[10px] shadow">
              كوسومار
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-wide">
                  COSUMAR • Camions Chargés
                </span>
                <span className="text-[10px] bg-blue-500/40 text-blue-100 font-semibold px-2 py-0.2 rounded-full border border-blue-400/30">
                  {COSUMAR_FLEET.length} véhicules
                </span>
              </div>
              <p className="text-[10px] text-blue-200">
                Répertoire officiel des matricules et conducteurs affectés au flux Port &rarr; Cosumar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-blue-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher par matricule (ex: 70605A55, 12325D6) ou conducteur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <span className="text-[11px] text-slate-500 shrink-0 font-medium">
            {filtered.length} / {COSUMAR_FLEET.length}
          </span>
        </div>

        {/* Fleet List (matching Cosumar mobile design) */}
        <div className="p-3 overflow-y-auto divide-y divide-slate-100 flex-1 space-y-1">
          {filtered.map((item, idx) => (
            <div
              key={item.plate}
              className="p-2.5 rounded-lg bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 transition flex items-center justify-between gap-3 shadow-2xs group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs text-slate-900 bg-yellow-100 px-2 py-0.2 rounded border border-yellow-300 tracking-wide">
                      {item.plate}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase">
                      Conducteur :
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5 group-hover:text-blue-900">
                    {item.driver}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectTruckForDepart(item);
                  onClose();
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-medium transition cursor-pointer shadow-xs shrink-0"
              >
                <span>+ Sortie Port</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Données synchronisées depuis l'application mobile Cosumar
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded text-xs transition cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
