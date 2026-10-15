import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Truck, 
  Scale, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  RefreshCw,
  Search,
  Anchor,
  Warehouse,
  ChevronDown
} from 'lucide-react';
import { Transaction } from '../types';
import { COSUMAR_FLEET, CosumarTruck } from '../data/cosumarFleet';
import { COMMON_PRODUCTS } from '../data/mockTransactions';
import { formatWeight, formatDateFrench } from '../utils/storage';

interface RealTimeDataEntryProps {
  transactions: Transaction[];
  onAddDepartPort: (data: {
    truckID: string;
    driverName: string;
    product: string;
    carrier?: string;
    notes?: string;
  }) => Transaction;
  onCompleteWeighing: (
    transactionId: string,
    grossWeight: number,
    tare: number,
    notes?: string
  ) => Transaction;
  onLoadPhotoFleetConvoy: () => void;
  nextIdPreview: string;
}

export const RealTimeDataEntry: React.FC<RealTimeDataEntryProps> = ({
  transactions,
  onAddDepartPort,
  onCompleteWeighing,
  onLoadPhotoFleetConvoy,
  nextIdPreview,
}) => {
  const [activeTab, setActiveTab] = useState<'DEPART' | 'PESEE'>('DEPART');
  const [liveClock, setLiveClock] = useState<Date>(new Date());

  // Form State: Depart Port
  const [selectedFleetTruck, setSelectedFleetTruck] = useState<string>('');
  const [customPlate, setCustomPlate] = useState<string>('');
  const [customDriver, setCustomDriver] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>(COMMON_PRODUCTS[0]);
  const [notes, setNotes] = useState<string>('');

  // Form State: Weighing Cosumar
  const [weighTruckId, setWeighTruckId] = useState<string>('');
  const [grossInput, setGrossInput] = useState<string>('42850');
  const [tareInput, setTareInput] = useState<string>('14320');
  const [weighNotes, setWeighNotes] = useState<string>('');

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Live ticking clock (ticks every second for real-time precision)
  useEffect(() => {
    const timer = setInterval(() => setLiveClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const inTransitTrucks = transactions.filter(t => t.status === 'En transit');

  // Auto-select first in transit truck for weighing tab
  useEffect(() => {
    if (inTransitTrucks.length > 0 && !weighTruckId) {
      setWeighTruckId(inTransitTrucks[0].id);
    }
  }, [inTransitTrucks, weighTruckId]);

  // When picking a fleet truck from the photos list
  const handleSelectFleetTruck = (plate: string) => {
    setSelectedFleetTruck(plate);
    const found = COSUMAR_FLEET.find(f => f.plate === plate);
    if (found) {
      setCustomPlate(found.plate);
      setCustomDriver(found.driver);
    }
  };

  // Submit quick Port departure
  const handleSubmitDepart = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPlate = customPlate.trim().toUpperCase();
    const finalDriver = customDriver.trim();

    if (!finalPlate) {
      setFeedbackMsg('Veuillez spécifier le matricule du camion.');
      return;
    }
    if (!finalDriver) {
      setFeedbackMsg('Veuillez spécifier le nom du conducteur.');
      return;
    }

    const t = onAddDepartPort({
      truckID: finalPlate,
      driverName: finalDriver,
      product: selectedProduct,
      carrier: 'Cosumar Logistique',
      notes: notes.trim() || undefined,
    });

    setFeedbackMsg(`Sortie Port validée en direct pour ${t.truckID} (N° ${t.id})`);
    // Reset inputs
    setCustomPlate('');
    setCustomDriver('');
    setSelectedFleetTruck('');
    setNotes('');
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Submit quick Cosumar weighbridge
  const handleSubmitWeighing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weighTruckId) {
      setFeedbackMsg('Aucun camion sélectionné pour la pesée.');
      return;
    }
    const brut = parseFloat(grossInput);
    const tare = parseFloat(tareInput);

    if (isNaN(brut) || brut <= 0) {
      setFeedbackMsg('Veuillez saisir un Poids Brut valide (> 0).');
      return;
    }
    if (isNaN(tare) || tare < 0) {
      setFeedbackMsg('Veuillez saisir une Tare valide.');
      return;
    }
    if (brut <= tare) {
      setFeedbackMsg('Le Poids Brut doit être supérieur à la Tare.');
      return;
    }

    const updated = onCompleteWeighing(weighTruckId, brut, tare, weighNotes.trim() || undefined);
    setFeedbackMsg(`Pesée Cosumar validée pour ${updated.truckID} : Net = ${formatWeight(brut - tare)}`);
    setWeighNotes('');
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const selectedTransactionForWeigh = inTransitTrucks.find(t => t.id === weighTruckId);
  const brutNum = parseFloat(grossInput) || 0;
  const tareNum = parseFloat(tareInput) || 0;
  const calculatedNet = brutNum > tareNum ? brutNum - tareNum : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
      
      {/* Top Bar: Live Station Title + Real-time Clock */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Poste de Saisie en Temps Réel
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SAISIE DIRECTE
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Enregistrement instantané des rotations Port &rarr; Cosumar avec horodatage automatique.
            </p>
          </div>
        </div>

        {/* Right side: Live Clock + Fast Convoy Loader */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Live Clock Badge */}
          <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-mono shadow-2xs border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold">{liveClock.toLocaleTimeString('fr-FR')}</span>
          </div>

          {/* Quick populate button with all photos data */}
          <button
            onClick={onLoadPhotoFleetConvoy}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
            title="Injecter les camions réels des photos dans le flux en temps réel"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Charger données photos en direct</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Sortie Port vs Pesage Cosumar */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200">
        <div className="flex items-center gap-2 -mb-px">
          <button
            onClick={() => setActiveTab('DEPART')}
            className={`flex items-center gap-1.5 py-2 px-3.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'DEPART'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Anchor className="w-3.5 h-3.5 text-blue-600" />
            <span>1. Saisie Sortie Port (Sans pesée)</span>
            <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">
              {nextIdPreview}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('PESEE')}
            className={`flex items-center gap-1.5 py-2 px-3.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'PESEE'
                ? 'border-amber-600 text-amber-700 bg-amber-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-amber-600" />
            <span>2. Saisie Pesée Cosumar (Pont-Bascule)</span>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full">
              {inTransitTrucks.length} en attente
            </span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{feedbackMsg}</span>
          </div>
          <button 
            onClick={() => setFeedbackMsg(null)}
            className="text-xs text-emerald-700 hover:underline cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Tab 1: Direct Real-Time Port Departure Entry */}
      {activeTab === 'DEPART' && (
        <form onSubmit={handleSubmitDepart} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Quick Fleet Dropdown (Photos) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Choisir parmi la Flotte Cosumar ({COSUMAR_FLEET.length})
              </label>
              <select
                value={selectedFleetTruck}
                onChange={(e) => handleSelectFleetTruck(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Choisir un camion des photos --</option>
                {COSUMAR_FLEET.map((f) => (
                  <option key={f.plate} value={f.plate}>
                    {f.plate} • {f.driver}
                  </option>
                ))}
              </select>
            </div>

            {/* Truck Plate (Matricule) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Matricule Camion <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="ex: 70605A55, 12325D6..."
                  value={customPlate}
                  onChange={(e) => {
                    const up = e.target.value.toUpperCase();
                    setCustomPlate(up);
                    const match = COSUMAR_FLEET.find(f => f.plate === up);
                    if (match) setCustomDriver(match.driver);
                  }}
                  className="w-full px-2.5 py-1.5 bg-yellow-50 border border-yellow-300 rounded-lg text-slate-900 font-mono font-bold text-xs uppercase focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Driver Name (Conducteur) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Conducteur / Chauffeur <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Nom complet"
                value={customDriver}
                onChange={(e) => setCustomDriver(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Product selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Produit / Cargaison
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {COMMON_PRODUCTS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Bottom row: remarks + submit button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">Horodatage Port :</span>
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                {formatDateFrench(liveClock.toISOString())}
              </span>
              <span className="text-slate-400 hidden sm:inline">(Automatique en direct)</span>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Valider Départ en Temps Réel (Sortie Port)</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Direct Real-Time Cosumar Weighbridge Entry */}
      {activeTab === 'PESEE' && (
        <form onSubmit={handleSubmitWeighing} className="space-y-3">
          {inTransitTrucks.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-500 bg-amber-50/50 rounded-lg border border-amber-200">
              <p className="font-semibold text-amber-900">Aucun camion n'est actuellement en transit</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Utilisez l'onglet "Sortie Port" ci-dessus ou chargez les données des photos pour lancer des camions en route.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* Truck selection in transit */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Sélectionner le camion arrivé <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={weighTruckId}
                    onChange={(e) => setWeighTruckId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-amber-50/80 border border-amber-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {inTransitTrucks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.truckID} • {t.driverName} ({t.product})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gross Weight (Brut) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Poids Brut (en Kg) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="10"
                      min="1"
                      value={grossInput}
                      onChange={(e) => setGrossInput(e.target.value)}
                      placeholder="ex: 42850"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <span className="absolute right-2.5 top-1.5 text-[11px] font-bold text-slate-400">Kg</span>
                  </div>
                </div>

                {/* Tare Weight (Tare) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tare du camion vide (en Kg) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="10"
                      min="0"
                      value={tareInput}
                      onChange={(e) => setTareInput(e.target.value)}
                      placeholder="ex: 14320"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <span className="absolute right-2.5 top-1.5 text-[11px] font-bold text-slate-400">Kg</span>
                  </div>
                </div>

                {/* Calculated Net Weight Display */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Poids Net Facturable (Brut - Tare)
                  </label>
                  <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-emerald-800">Net :</span>
                    <span className="font-mono font-black text-sm text-emerald-900">
                      {calculatedNet !== null ? formatWeight(calculatedNet) : '-'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Bottom row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Horodatage Cosumar :</span>
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                    {formatDateFrench(liveClock.toISOString())}
                  </span>
                  {selectedTransactionForWeigh && (
                    <span className="text-amber-800 font-medium">
                      • Départ Port : {formatDateFrench(selectedTransactionForWeigh.exitPortTime)}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={calculatedNet === null || calculatedNet <= 0}
                  className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 text-white font-semibold text-xs rounded-lg shadow-sm transition cursor-pointer ${
                    calculatedNet === null || calculatedNet <= 0
                      ? 'bg-slate-400 cursor-not-allowed opacity-60'
                      : 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Enregistrer Pesée Cosumar en Direct</span>
                </button>
              </div>
            </>
          )}
        </form>
      )}

    </div>
  );
};
