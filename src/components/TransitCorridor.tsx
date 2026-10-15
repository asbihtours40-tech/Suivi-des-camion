import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Scale, 
  Clock, 
  AlertCircle, 
  Anchor, 
  Warehouse, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  RotateCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Transaction } from '../types';
import { computeTransitDuration, formatDateShort } from '../utils/storage';

interface TransitCorridorProps {
  transactions: Transaction[];
  onWeighTruck: (transaction: Transaction) => void;
  onOpenDepartModal: () => void;
}

const STORAGE_KEY_HIDE_TRUCKS = 'logistics_hide_corridor_trucks';
const STORAGE_KEY_HIDDEN_TRUCK_IDS = 'logistics_hidden_corridor_truck_ids';

export const TransitCorridor: React.FC<TransitCorridorProps> = ({
  transactions,
  onWeighTruck,
  onOpenDepartModal,
}) => {
  // Global visibility of trucks on the corridor (default: true = trucks are masked/hidden)
  const [isTrucksHidden, setIsTrucksHidden] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_HIDE_TRUCKS);
    return saved !== null ? saved === 'true' : true;
  });

  // Specific trucks manually hidden by ID
  const [hiddenTruckIds, setHiddenTruckIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HIDDEN_TRUCK_IDS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist preferences
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HIDE_TRUCKS, String(isTrucksHidden));
  }, [isTrucksHidden]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HIDDEN_TRUCK_IDS, JSON.stringify(hiddenTruckIds));
  }, [hiddenTruckIds]);

  const allInTransit = transactions.filter(t => t.status === 'En transit');
  // Filter out any individually hidden trucks if not globally hidden
  const visibleInTransit = allInTransit.filter(t => !hiddenTruckIds.includes(t.id));
  const individuallyHiddenCount = allInTransit.length - visibleInTransit.length;

  const toggleHideAll = () => {
    setIsTrucksHidden(prev => !prev);
  };

  const handleHideSingleTruck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHiddenTruckIds(prev => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleRestoreHiddenTrucks = () => {
    setHiddenTruckIds([]);
  };

  // IF COMPLETELY MASKED: show a single sleek slim line, ZERO truck cards, ZERO chips
  if (isTrucksHidden) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs px-3.5 py-2.5 flex items-center justify-between transition-all">
        <div className="flex items-center gap-2 text-xs">
          <div className="p-1 rounded bg-blue-50 text-blue-600">
            <Truck className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-800">
            Corridor Logistique
          </span>
          <span className="text-[11px] px-2 py-0.2 rounded-full font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            {allInTransit.length} en transit
          </span>
          <span className="text-slate-400 hidden sm:inline text-[11px]">
            • Camions masqués
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-show-corridor-trucks"
            onClick={toggleHideAll}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>Afficher les camions ({allInTransit.length})</span>
            <ChevronDown className="w-3 h-3 text-blue-500" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 transition-all">
      {/* Corridor Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Corridor Logistique en Temps Réel
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                {allInTransit.length} en transit
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Camions partis du Port (sans pesée), en cours d'acheminement vers le pont-bascule de Cosumar.
            </p>
          </div>
        </div>

        {/* Header Controls: Route indicator + Toggle button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="hidden md:flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 text-xs text-slate-600">
            <span className="flex items-center gap-1 font-semibold text-blue-700">
              <Anchor className="w-3 h-3" /> Port
            </span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <span className="flex items-center gap-1 font-semibold text-amber-700">
              <Warehouse className="w-3 h-3" /> Cosumar
            </span>
          </div>

          <button
            id="btn-hide-corridor-trucks"
            onClick={toggleHideAll}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition cursor-pointer"
            title="Masquer les camions sur le corridor"
          >
            <EyeOff className="w-3 h-3 text-slate-500" />
            <span>Masquer les camions</span>
            <ChevronUp className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      {allInTransit.length === 0 ? (
        /* Empty State */
        <div className="py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
            <Truck className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-700">Aucun camion n'est actuellement en transit</p>
          <p className="text-[11px] text-slate-500 mt-0.5 max-w-md mx-auto">
            Tous les camions enregistrés ont été réceptionnés et pesés chez Cosumar.
          </p>
          <button
            onClick={onOpenDepartModal}
            className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition cursor-pointer"
          >
            + Enregistrer une nouvelle sortie Port
          </button>
        </div>
      ) : (
        /* Full Expanded Cards View */
        <div className="mt-3.5">
          {/* Notification if some trucks were individually hidden */}
          {individuallyHiddenCount > 0 && (
            <div className="mb-2.5 flex items-center justify-between p-2 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  <strong>{individuallyHiddenCount}</strong> camion{individuallyHiddenCount > 1 ? 's' : ''} masqué{individuallyHiddenCount > 1 ? 's' : ''} individuellement.
                </span>
              </div>
              <button
                onClick={handleRestoreHiddenTrucks}
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Tout réafficher
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleInTransit.map((t) => {
              const duration = computeTransitDuration(t.exitPortTime);
              const isDelayed = (() => {
                const diffMs = Date.now() - new Date(t.exitPortTime).getTime();
                return diffMs > 3 * 60 * 60 * 1000;
              })();

              return (
                <div
                  key={t.id}
                  className={`relative rounded-lg border p-3 transition hover:shadow-xs ${
                    isDelayed 
                      ? 'border-amber-300 bg-amber-50/40' 
                      : 'border-slate-200 bg-gradient-to-br from-white to-slate-50/60'
                  }`}
                >
                  {/* Status and ID */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                        {t.id}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-full border border-amber-200">
                        <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                        En transit
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className={`flex items-center gap-1 text-[11px] font-medium ${isDelayed ? 'text-amber-800 font-bold' : 'text-slate-600'}`}>
                        <Clock className="w-3 h-3" />
                        <span>{duration}</span>
                      </div>
                      <button
                        onClick={(e) => handleHideSingleTruck(t.id, e)}
                        className="p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                        title="Masquer ce camion du corridor"
                      >
                        <EyeOff className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Truck Plate & Cargo */}
                  <div className="mb-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-slate-900 tracking-wide font-mono bg-yellow-100 px-2 py-0.2 rounded border border-yellow-300">
                        {t.truckID}
                      </span>
                    </div>
                    <div className="mt-1.5 text-xs font-medium text-slate-800 truncate">
                      📦 <span className="font-semibold">{t.product}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                      <span>Chauffeur : <strong className="text-slate-700">{t.driverName}</strong></span>
                      <span className="text-[10px] text-slate-400">{formatDateShort(t.exitPortTime)}</span>
                    </div>
                  </div>

                  {/* Warning if delayed */}
                  {isDelayed && (
                    <div className="mb-2 flex items-center gap-1 text-[10px] text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">
                      <AlertCircle className="w-3 h-3 shrink-0 text-amber-600" />
                      <span>Délai élevé (&gt; 3h). Contacter chauffeur.</span>
                    </div>
                  )}

                  {/* Direct Action: Weigh truck at Cosumar */}
                  <button
                    id={`btn-weigh-${t.id}`}
                    onClick={() => onWeighTruck(t)}
                    className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-medium text-xs rounded transition cursor-pointer"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Peser à Cosumar</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
