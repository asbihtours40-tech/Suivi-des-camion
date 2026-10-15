import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Scale, 
  Lock, 
  Unlock, 
  Clock, 
  Anchor, 
  Warehouse, 
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { formatDateFrench } from '../utils/storage';

interface HeaderProps {
  isUnlocked: boolean;
  onOpenUnlockModal: () => void;
  onLockSheet: () => void;
  onOpenDepartModal: () => void;
  onOpenArriveeModal: () => void;
  onOpenFleetModal?: () => void;
  inTransitCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  isUnlocked,
  onOpenUnlockModal,
  onLockSheet,
  onOpenDepartModal,
  onOpenArriveeModal,
  onOpenFleetModal,
  inTransitCount,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
      {/* Top system info bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800/80">
        <div className="flex items-center gap-4 text-slate-300">
          <div className="flex items-center gap-1.5 font-medium tracking-wide">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SYSTÈME EN LIGNE</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300">Feuille Excel : <strong className="text-white font-mono">Saisie_Donnees</strong></span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{formatDateFrench(currentTime.toISOString())}</span>
          </div>
        </div>

        {/* Protection sheet indicator */}
        <div className="flex items-center gap-2">
          {isUnlocked ? (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2.5 py-1 rounded-md">
              <Unlock className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium">Feuille déverrouillée (Mode Superviseur)</span>
              <button
                id="btn-lock-sheet"
                onClick={onLockSheet}
                className="ml-2 text-xs underline text-amber-200 hover:text-white cursor-pointer"
                title="Verrouiller la feuille"
              >
                Verrouiller
              </button>
            </div>
          ) : (
            <button
              id="btn-unlock-sheet"
              onClick={onOpenUnlockModal}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-md border border-slate-700 transition cursor-pointer"
              title="Déverrouiller avec le code 1234"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Feuille protégée (Code : 1234)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main navigation & action bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Operational Corridor Name */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-900/30 ring-1 ring-white/10">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Suivi Logistique Port &rarr; Cosumar
                </h1>
                <span className="bg-cyan-500/20 text-cyan-300 text-xs font-semibold px-2 py-0.5 rounded border border-cyan-500/30">
                  VBA Process v2.4
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Anchor className="w-3.5 h-3.5 text-blue-400" />
                  <strong>Port Autonome</strong> (Départ sans pesée)
                </span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="flex items-center gap-1">
                  <Warehouse className="w-3.5 h-3.5 text-amber-400" />
                  <strong>Site Cosumar</strong> (Pesage obligatoire)
                </span>
              </div>
            </div>
          </div>

            {/* Direct Macro Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Flotte Cosumar List Trigger */}
            {onOpenFleetModal && (
              <button
                id="btn-open-fleet-modal"
                onClick={onOpenFleetModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs rounded-lg transition cursor-pointer"
                title="Consulter les 38 camions chargés Cosumar (Matricules & Conducteurs)"
              >
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Flotte Cosumar (38)</span>
              </button>
            )}

            {/* Macro 1: EnregistrerDepartPort */}
            <button
              id="btn-macro-depart-port"
              onClick={onOpenDepartModal}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-xs transition transform hover:-translate-y-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <div className="w-4 h-4 rounded-full bg-blue-700/80 flex items-center justify-center font-bold text-[10px]">
                1
              </div>
              <Truck className="w-3.5 h-3.5" />
              <span>Sortie Port</span>
            </button>

            {/* Macro 2: EnregistrerArriveeCosumar */}
            <button
              id="btn-macro-arrivee-depot"
              onClick={onOpenArriveeModal}
              className="flex-1 sm:flex-none relative flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-medium text-xs rounded-lg shadow-xs transition transform hover:-translate-y-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <div className="w-4 h-4 rounded-full bg-amber-700/80 flex items-center justify-center font-bold text-[10px]">
                2
              </div>
              <Scale className="w-3.5 h-3.5" />
              <span>Pesage Cosumar</span>
              {inTransitCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[10px] bg-white text-amber-900 font-bold rounded-full">
                  {inTransitCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
