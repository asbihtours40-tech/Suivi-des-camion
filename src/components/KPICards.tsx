import React from 'react';
import { Truck, Scale, PackageCheck, Clock, TrendingUp } from 'lucide-react';
import { Transaction } from '../types';
import { formatWeight, formatTons } from '../utils/storage';

interface KPICardsProps {
  transactions: Transaction[];
  onFilterTransit?: () => void;
  onFilterFinished?: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({ 
  transactions,
  onFilterTransit,
  onFilterFinished
}) => {
  const inTransitList = transactions.filter(t => t.status === 'En transit');
  const finishedList = transactions.filter(t => t.status === 'Terminé');
  
  const totalNetKg = finishedList.reduce((acc, curr) => acc + (curr.netWeight || 0), 0);
  const totalGrossKg = finishedList.reduce((acc, curr) => acc + (curr.grossWeight || 0), 0);
  const totalTareKg = finishedList.reduce((acc, curr) => acc + (curr.tare || 0), 0);

  // Compute average transit time for completed trips
  const transitMinutes: number[] = [];
  finishedList.forEach(t => {
    if (t.exitPortTime && t.entryDepotTime) {
      const start = new Date(t.exitPortTime).getTime();
      const end = new Date(t.entryDepotTime).getTime();
      const diffMin = Math.round((end - start) / 60000);
      if (diffMin > 0 && diffMin < 1440) { // filter anomalies
        transitMinutes.push(diffMin);
      }
    }
  });

  const avgMinutes = transitMinutes.length > 0 
    ? Math.round(transitMinutes.reduce((a, b) => a + b, 0) / transitMinutes.length)
    : 0;
  
  const avgHours = Math.floor(avgMinutes / 60);
  const avgRemainMins = avgMinutes % 60;
  const avgTransitString = avgMinutes > 0 
    ? (avgHours > 0 ? `${avgHours}h ${avgRemainMins}m` : `${avgRemainMins} min`)
    : '-';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. Camions en transit */}
      <div 
        onClick={onFilterTransit}
        className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-blue-400 hover:shadow-sm transition cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            En Transit (Port &rarr; Cosumar)
          </span>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
            <Truck className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{inTransitList.length}</span>
          <span className="text-xs text-slate-500 font-medium">camion(s) sur la route</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-700 font-medium">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span>Pesage requis chez Cosumar</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition origin-left" />
      </div>

      {/* 2. Pesés & Terminés */}
      <div 
        onClick={onFilterFinished}
        className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-emerald-400 hover:shadow-sm transition cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pesages Validés (Cosumar)
          </span>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{finishedList.length}</span>
          <span className="text-xs text-slate-500 font-medium">rotations terminées</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
          <span>{transactions.length > 0 ? Math.round((finishedList.length / transactions.length) * 100) : 0}% réceptionné à l'usine</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition origin-left" />
      </div>

      {/* 3. Tonnage Net Total */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tonnage Net Réceptionné
          </span>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{formatTons(totalNetKg)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>Net : {formatWeight(totalNetKg)}</span>
          <span className="text-slate-400">Tare : {formatTons(totalTareKg)}</span>
        </div>
      </div>

      {/* 4. Durée moyenne de parcours */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Temps Moyen de Transit
          </span>
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{avgTransitString}</span>
          <span className="text-xs text-slate-500 font-medium">trajet Port-Cosumar</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
          <span>Cadence normale de rotation</span>
        </div>
      </div>

    </div>
  );
};
