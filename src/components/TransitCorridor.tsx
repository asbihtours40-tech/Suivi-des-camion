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
  RefreshCw,
  Search,
  Radio,
  Navigation,
  MapPin,
  Play,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Transaction } from '../types';
import { formatDateShort } from '../utils/storage';

interface TransitCorridorProps {
  transactions: Transaction[];
  onWeighTruck: (transaction: Transaction) => void;
  onOpenDepartModal: () => void;
  onStartDemoConvoy?: () => void;
}

const STORAGE_KEY_HIDE_TRUCKS = 'logistics_hide_corridor_trucks';
const STORAGE_KEY_HIDDEN_TRUCK_IDS = 'logistics_hidden_corridor_truck_ids';

interface TripProgress {
  percent: number;
  stage: string;
  isDelayed: boolean;
  minutes: number;
  etaString: string;
}

function calculateTruckProgress(exitTimeIso: string, currentTime: Date): TripProgress {
  const start = new Date(exitTimeIso).getTime();
  const elapsedMs = Math.max(0, currentTime.getTime() - start);
  const minutes = Math.floor(elapsedMs / 60000);
  
  // Standard transit route between Port and Cosumar takes approx 50-60 mins
  const standardDuration = 60;
  // Cap at 95% progress while still en route (100% only upon weighbridge arrival)
  const percent = Math.min(95, Math.max(5, Math.round((minutes / standardDuration) * 90)));

  let stage = 'Sortie Port / Douane';
  if (percent > 20 && percent <= 50) stage = 'Autoroute / Voie Rapide';
  else if (percent > 50 && percent <= 75) stage = 'Rocade & Approche';
  else if (percent > 75) stage = 'Zone d\'attente Pont-Bascule';

  const isDelayed = minutes > 90; // Warning if over 1h30

  // ETA calculation
  const etaMinutesRemaining = Math.max(0, standardDuration - minutes);
  const etaDate = new Date(currentTime.getTime() + etaMinutesRemaining * 60000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const etaString = etaMinutesRemaining === 0 
    ? 'Arrivée imminente' 
    : `ETA : ${pad(etaDate.getHours())}:${pad(etaDate.getMinutes())} (~${etaMinutesRemaining}m)`;

  return { percent, stage, isDelayed, minutes, etaString };
}

export const TransitCorridor: React.FC<TransitCorridorProps> = ({
  transactions,
  onWeighTruck,
  onOpenDepartModal,
  onStartDemoConvoy,
}) => {
  // Live ticking clock for real-time tracking (ticks every 5 seconds)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Real-time tracking view mode: 'ALL' (map + cards), 'MAP' (map only), 'CARDS' (cards only)
  const [viewMode, setViewMode] = useState<'ALL' | 'MAP' | 'CARDS'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);

  // Global visibility of trucks (defaults to false so real-time tracking is clearly visible)
  const [isTrucksHidden, setIsTrucksHidden] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_HIDE_TRUCKS);
    return saved !== null ? saved === 'true' : false; // Default visible for real-time tracking
  });

  const [hiddenTruckIds, setHiddenTruckIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HIDDEN_TRUCK_IDS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setLastRefreshed(now);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HIDE_TRUCKS, String(isTrucksHidden));
  }, [isTrucksHidden]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HIDDEN_TRUCK_IDS, JSON.stringify(hiddenTruckIds));
  }, [hiddenTruckIds]);

  const allInTransit = transactions.filter(t => t.status === 'En transit');
  const visibleInTransit = allInTransit.filter(
    t => !hiddenTruckIds.includes(t.id) &&
         (t.truckID.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.product.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

  // If user explicitly minimized the corridor
  if (isTrucksHidden) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs px-4 py-3 flex items-center justify-between transition-all">
        <div className="flex items-center gap-2.5 text-xs">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-slate-800">
              Suivi Camions en Temps Réel (Port &rarr; Cosumar)
            </span>
            <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              {allInTransit.length} en route
            </span>
          </div>
        </div>

        <button
          id="btn-show-corridor-trucks"
          onClick={toggleHideAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-blue-600" />
          <span>Afficher le Suivi en Direct ({allInTransit.length})</span>
        </button>
      </div>
    );
  }

  return (
    <div id="corridor-temps-reel" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 transition-all space-y-4">
      
      {/* 1. Header with Live Ticking Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                Suivi des Camions en Temps Réel
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                EN DIRECT
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300">
                {allInTransit.length} en acheminement
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Trajet Port Autonome (sans pesée) &rarr; Pont-Bascule Usine Cosumar • Cadence de rotation en direct.
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-center">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('ALL')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                viewMode === 'ALL' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vue Complète
            </button>
            <button
              onClick={() => setViewMode('MAP')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                viewMode === 'MAP' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Corridor Schématique
            </button>
            <button
              onClick={() => setViewMode('CARDS')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                viewMode === 'CARDS' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cartes Flotte
            </button>
          </div>

          <button
            onClick={() => setCurrentTime(new Date())}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
            title="Rafraîchir immédiatement les timers"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleHideAll}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
            title="Masquer le corridor"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Masquer</span>
          </button>
        </div>
      </div>

      {/* 2. Visual Interactive Road Track (Corridor Route) */}
      {(viewMode === 'ALL' || viewMode === 'MAP') && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 rounded-xl p-4 sm:p-5 text-white shadow-inner relative overflow-hidden border border-slate-800">
          
          {/* Top Corridor Legend */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Piste en Temps Réel • Corridor Routier Port &rarr; Cosumar
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400" /> Sortie Port
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> En acheminement
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Pont-Bascule
              </span>
            </div>
          </div>

          {/* Road Visual Container */}
          <div className="relative py-6 px-4">
            
            {/* The Road Surface */}
            <div className="h-4 bg-slate-800 rounded-full border border-slate-700 relative flex items-center shadow-inner">
              {/* Dashed highway center lines */}
              <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none opacity-40">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div key={i} className="w-2.5 h-0.5 bg-yellow-300 rounded-full" />
                ))}
              </div>

              {/* Progress highlights */}
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-amber-400 rounded-full opacity-30 transition-all duration-1000"
                style={{ width: `${Math.min(100, Math.max(10, allInTransit.length * 25))}%` }}
              />
            </div>

            {/* Checkpoint Poles along the Road */}
            <div className="flex justify-between items-start text-xs mt-3 relative">
              {/* Point 1: Port Autonome */}
              <div className="flex flex-col items-center text-center -translate-x-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-slate-900 shadow-md">
                  <Anchor className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-slate-200 mt-1 text-[11px]">Port Autonome</span>
                <span className="text-[10px] text-blue-300">Départ sans pesée</span>
              </div>

              {/* Point 2: Sortie Quai / Douane */}
              <div className="hidden sm:flex flex-col items-center text-center">
                <div className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center border border-slate-600">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                </div>
                <span className="font-medium text-slate-400 mt-1 text-[10px]">Contrôle Douane</span>
                <span className="text-[9px] text-slate-500">Km 5</span>
              </div>

              {/* Point 3: Voie Rapide / Autoroute */}
              <div className="hidden md:flex flex-col items-center text-center">
                <div className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center border border-slate-600">
                  <Navigation className="w-3 h-3 text-amber-400" />
                </div>
                <span className="font-medium text-slate-400 mt-1 text-[10px]">Voie Rapide</span>
                <span className="text-[9px] text-slate-500">Km 25</span>
              </div>

              {/* Point 4: Approche Cosumar */}
              <div className="hidden sm:flex flex-col items-center text-center">
                <div className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center border border-slate-600">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                </div>
                <span className="font-medium text-slate-400 mt-1 text-[10px]">Rocade Usine</span>
                <span className="text-[9px] text-slate-500">Km 45</span>
              </div>

              {/* Point 5: Pont-Bascule Cosumar */}
              <div className="flex flex-col items-center text-center translate-x-2">
                <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center border-2 border-slate-900 shadow-md">
                  <Warehouse className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-amber-300 mt-1 text-[11px]">Usine Cosumar</span>
                <span className="text-[10px] text-amber-200">Pont-Bascule</span>
              </div>
            </div>

            {/* Real-time Moving Truck Markers on the Highway Track */}
            {allInTransit.map((t, idx) => {
              const progress = calculateTruckProgress(t.exitPortTime, currentTime);
              const isSelected = selectedTruckId === t.id;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTruckId(isSelected ? null : t.id)}
                  style={{ left: `${progress.percent}%` }}
                  className={`absolute -top-1 -translate-x-1/2 transition-all duration-1000 cursor-pointer group z-20 ${
                    idx % 2 === 0 ? '-top-1' : '-top-2'
                  }`}
                  title={`${t.truckID} (${t.driverName}) - ${progress.minutes} min en route`}
                >
                  {/* Floating Truck Badge Pin */}
                  <div className={`flex flex-col items-center transform transition-transform group-hover:scale-110 ${
                    isSelected ? 'scale-115' : ''
                  }`}>
                    {/* Tooltip Card on Hover */}
                    <div className="bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-xl border border-slate-700 whitespace-nowrap mb-1 flex items-center gap-1.5 opacity-90 group-hover:opacity-100">
                      <span className="font-mono font-black text-amber-300">{t.truckID}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-emerald-300 font-bold">{progress.minutes}m</span>
                    </div>

                    {/* Truck icon vehicle marker */}
                    <div className={`p-1.5 rounded-full shadow-lg border-2 flex items-center justify-center transition ${
                      progress.isDelayed
                        ? 'bg-red-600 border-white text-white animate-bounce'
                        : isSelected
                        ? 'bg-amber-500 border-white text-white ring-4 ring-amber-400/50'
                        : 'bg-blue-600 hover:bg-blue-500 border-slate-900 text-white'
                    }`}>
                      <Truck className="w-3.5 h-3.5" />
                    </div>

                    {/* Pulse animation ring under truck */}
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 opacity-75 animate-ping -mt-1" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Corridor summary ticker */}
          <div className="mt-2 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Système synchronisé avec les horodatages portuaires</span>
            </div>
            <div className="font-mono text-[11px] text-slate-400">
              Dernière actualisation : {lastRefreshed.toLocaleTimeString('fr-FR')}
            </div>
          </div>
        </div>
      )}

      {/* 3. Empty State with One-Click Demo Convoy Trigger */}
      {allInTransit.length === 0 ? (
        <div className="py-8 px-4 text-center rounded-xl bg-slate-50 border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            Aucun camion n'est actuellement en transit
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Tous les camions enregistrés ont été pesés et réceptionnés chez Cosumar, ou le registre est actuellement vierge.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            {onStartDemoConvoy && (
              <button
                onClick={onStartDemoConvoy}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg shadow-sm transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Lancer un convoi de test (3 camions Cosumar en route)</span>
              </button>
            )}

            <button
              onClick={onOpenDepartModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition cursor-pointer"
            >
              <span>+ Enregistrer une nouvelle sortie Port</span>
            </button>
          </div>
        </div>
      ) : (viewMode === 'ALL' || viewMode === 'CARDS') && (
        /* 4. Active Fleet Cards with Real-Time Progress Details */
        <div className="space-y-3">
          
          {/* Search bar & filter within corridor */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Filtrer en temps réel (matricule, chauffeur, produit)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <span className="text-xs text-slate-500 font-medium">
              Affichage de {visibleInTransit.length} sur {allInTransit.length} camion(s)
            </span>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {visibleInTransit.map((t) => {
              const progress = calculateTruckProgress(t.exitPortTime, currentTime);
              const isSelected = selectedTruckId === t.id;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTruckId(isSelected ? null : t.id)}
                  className={`rounded-xl border p-4 transition duration-150 cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-md'
                      : progress.isDelayed
                      ? 'border-amber-300 bg-amber-50/30 hover:shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div>
                    {/* Top Status Row */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {t.id}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          En route
                        </span>
                      </div>

                      {/* Live Timer Counter */}
                      <div className={`flex items-center gap-1 text-xs font-bold ${
                        progress.isDelayed ? 'text-amber-800' : 'text-slate-700'
                      }`}>
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>{progress.minutes} min de route</span>
                      </div>
                    </div>

                    {/* Truck Plate and Driver */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm sm:text-base font-black text-slate-900 tracking-wider font-mono bg-yellow-100 px-2 py-0.5 rounded border border-yellow-300 shadow-2xs">
                          {t.truckID}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[140px]">
                          {t.driverName}
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-slate-800 flex items-center justify-between">
                        <span className="font-medium truncate max-w-[180px]">
                          📦 {t.product}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDateShort(t.exitPortTime)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar & Stage */}
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-semibold text-slate-600">
                          {progress.stage}
                        </span>
                        <span className="font-mono font-bold text-blue-700">
                          {progress.percent}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-amber-500 rounded-full transition-all duration-700"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 flex justify-between">
                        <span>{progress.etaString}</span>
                        <span>Dest. Cosumar</span>
                      </div>
                    </div>

                    {/* Delay warning */}
                    {progress.isDelayed && (
                      <div className="mb-2.5 flex items-center gap-1.5 text-[10px] text-amber-800 bg-amber-100/70 p-1.5 rounded">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span>Délai de route élevé (&gt; 1h30). Vérifier chauffeur.</span>
                      </div>
                    )}
                  </div>

                  {/* Direct Action: Weigh at Cosumar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                    <button
                      id={`btn-corridor-weigh-${t.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onWeighTruck(t);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-medium text-xs rounded-lg transition shadow-xs cursor-pointer"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Peser au pont-bascule Cosumar</span>
                    </button>
                    
                    <button
                      onClick={(e) => handleHideSingleTruck(t.id, e)}
                      className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      title="Masquer ce camion de la vue"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
