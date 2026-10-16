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
  Users,
  Shield,
  Activity,
  UserCheck,
  Radio,
  FileText,
  BadgeCheck,
  Send,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { Transaction, AgentRole, AVAILABLE_AGENTS, AgentActivityItem } from '../types';
import { COSUMAR_FLEET } from '../data/cosumarFleet';
import { COMMON_PRODUCTS } from '../data/mockTransactions';
import { formatWeight, formatDateFrench, formatDateShort } from '../utils/storage';

interface RealTimeDataEntryProps {
  transactions: Transaction[];
  activityLogs: AgentActivityItem[];
  onAddDepartPort: (data: {
    truckID: string;
    driverName: string;
    product: string;
    carrier?: string;
    notes?: string;
    agentPort?: string;
  }) => Transaction;
  onCompleteWeighing: (
    transactionId: string,
    grossWeight: number,
    tare: number,
    notes?: string,
    agentCosumar?: string
  ) => Transaction;
  onRecordCheckpointControl?: (
    transactionId: string,
    notes: string,
    agentControl?: string
  ) => void;
  onRunMultiAgentSimulation: () => void;
  onLoadPhotoFleetConvoy: () => void;
  nextIdPreview: string;
  currentAgentRole: AgentRole;
  onSelectAgentRole: (role: AgentRole) => void;
}

export const RealTimeDataEntry: React.FC<RealTimeDataEntryProps> = ({
  transactions,
  activityLogs,
  onAddDepartPort,
  onCompleteWeighing,
  onRecordCheckpointControl,
  onRunMultiAgentSimulation,
  onLoadPhotoFleetConvoy,
  nextIdPreview,
  currentAgentRole,
  onSelectAgentRole,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'PORT' | 'COSUMAR' | 'CONTROLE' | 'LOGS'>('ALL');
  const [liveClock, setLiveClock] = useState<Date>(new Date());

  // Form State: Agent Port
  const [selectedFleetTruck, setSelectedFleetTruck] = useState<string>('');
  const [customPlate, setCustomPlate] = useState<string>('');
  const [customDriver, setCustomDriver] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>(COMMON_PRODUCTS[0]);
  const [notesPort, setNotesPort] = useState<string>('');
  const [portAgentName, setPortAgentName] = useState<string>('M. Benkirane (AG-PORT-01)');

  // Form State: Agent Cosumar (Pont-Bascule)
  const [weighTruckId, setWeighTruckId] = useState<string>('');
  const [grossInput, setGrossInput] = useState<string>('43100');
  const [tareInput, setTareInput] = useState<string>('14500');
  const [weighNotes, setWeighNotes] = useState<string>('');
  const [cosumarAgentName, setCosumarAgentName] = useState<string>('M. Tahiri (AG-COSU-02)');

  // Form State: Agent Contrôle Barrière Corridor
  const [controlTruckId, setControlTruckId] = useState<string>('');
  const [controlStatusNote, setControlStatusNote] = useState<string>('Contrôle plombs & pesée intermédiaire conforme');
  const [controlAgentName, setControlAgentName] = useState<string>('M. El Amrani (AG-CTRL-03)');

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; agent: string } | null>(null);

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => setLiveClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const inTransitTrucks = transactions.filter(t => t.status === 'En transit');
  const completedTrucks = transactions.filter(t => t.status === 'Terminé');

  // Auto-select first in transit truck for weighing and control tabs
  useEffect(() => {
    if (inTransitTrucks.length > 0) {
      if (!weighTruckId || !inTransitTrucks.some(t => t.id === weighTruckId)) {
        setWeighTruckId(inTransitTrucks[0].id);
      }
      if (!controlTruckId || !inTransitTrucks.some(t => t.id === controlTruckId)) {
        setControlTruckId(inTransitTrucks[0].id);
      }
    }
  }, [inTransitTrucks, weighTruckId, controlTruckId]);

  // Sync tab with agent role if specific agent is selected
  useEffect(() => {
    if (currentAgentRole === 'AGENT_PORT') setActiveTab('PORT');
    else if (currentAgentRole === 'AGENT_COSUMAR') setActiveTab('COSUMAR');
    else if (currentAgentRole === 'AGENT_CONTROLE') setActiveTab('CONTROLE');
    else if (currentAgentRole === 'ALL') setActiveTab('ALL');
  }, [currentAgentRole]);

  // When picking a fleet truck from the photos list
  const handleSelectFleetTruck = (plate: string) => {
    setSelectedFleetTruck(plate);
    const found = COSUMAR_FLEET.find(f => f.plate === plate);
    if (found) {
      setCustomPlate(found.plate);
      setCustomDriver(found.driver);
    }
  };

  // Submit Port departure
  const handleSubmitDepart = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPlate = customPlate.trim().toUpperCase();
    const finalDriver = customDriver.trim();

    if (!finalPlate) {
      setFeedbackMsg({ text: 'Veuillez saisir le matricule du camion.', agent: 'Port' });
      return;
    }
    if (!finalDriver) {
      setFeedbackMsg({ text: 'Veuillez saisir le nom du chauffeur.', agent: 'Port' });
      return;
    }

    const t = onAddDepartPort({
      truckID: finalPlate,
      driverName: finalDriver,
      product: selectedProduct,
      carrier: 'Cosumar Logistique',
      notes: notesPort.trim() || undefined,
      agentPort: portAgentName,
    });

    setFeedbackMsg({
      text: `Sortie Port validée par ${portAgentName} pour le camion ${t.truckID} (N° ${t.id})`,
      agent: 'Port',
    });

    // Reset inputs
    setCustomPlate('');
    setCustomDriver('');
    setSelectedFleetTruck('');
    setNotesPort('');
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // Submit Cosumar weighbridge
  const handleSubmitWeighing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weighTruckId) {
      setFeedbackMsg({ text: 'Aucun camion sélectionné pour la pesée.', agent: 'Cosumar' });
      return;
    }
    const brut = parseFloat(grossInput);
    const tare = parseFloat(tareInput);

    if (isNaN(brut) || brut <= 0) {
      setFeedbackMsg({ text: 'Veuillez saisir un Poids Brut valide (> 0).', agent: 'Cosumar' });
      return;
    }
    if (isNaN(tare) || tare < 0) {
      setFeedbackMsg({ text: 'Veuillez saisir une Tare valide.', agent: 'Cosumar' });
      return;
    }
    if (brut <= tare) {
      setFeedbackMsg({ text: 'Le Poids Brut doit être supérieur à la Tare.', agent: 'Cosumar' });
      return;
    }

    const updated = onCompleteWeighing(
      weighTruckId,
      brut,
      tare,
      weighNotes.trim() || undefined,
      cosumarAgentName
    );

    setFeedbackMsg({
      text: `Pesage Cosumar validé par ${cosumarAgentName} pour le camion ${updated.truckID} : Net = ${formatWeight(brut - tare)}`,
      agent: 'Cosumar',
    });
    setWeighNotes('');
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // Submit corridor checkpoint control
  const handleSubmitControl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!controlTruckId) {
      setFeedbackMsg({ text: 'Aucun camion en transit sélectionné.', agent: 'Contrôle' });
      return;
    }
    if (onRecordCheckpointControl) {
      onRecordCheckpointControl(controlTruckId, controlStatusNote, controlAgentName);
      const target = inTransitTrucks.find(t => t.id === controlTruckId);
      setFeedbackMsg({
        text: `Pointage barrière enregistré par ${controlAgentName} pour le camion ${target?.truckID || controlTruckId}`,
        agent: 'Contrôle',
      });
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const selectedTransactionForWeigh = inTransitTrucks.find(t => t.id === weighTruckId);
  const brutNum = parseFloat(grossInput) || 0;
  const tareNum = parseFloat(tareInput) || 0;
  const calculatedNet = brutNum > tareNum ? brutNum - tareNum : null;

  const currentAgentInfo = AVAILABLE_AGENTS.find(a => a.id === currentAgentRole) || AVAILABLE_AGENTS[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
      
      {/* Top Header: System Multi-Agents Banner + Live Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        
        {/* Left: Title & Concept */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-emerald-600 to-amber-600 text-white flex items-center justify-center shadow-md shadow-blue-900/10 shrink-0">
            <Users className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Saisie des Données en Temps Réel pour Tous les Agents
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                MULTI-POSTES EN DIRECT
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Plateforme collaborative synchronisée : Quai Portuaire (Sorties), Pont-Bascule Cosumar (Pesées) et Contrôle Corridor.
            </p>
          </div>
        </div>

        {/* Right side: Live Clock + Fast Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Clock Badge */}
          <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-mono shadow-2xs border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold">{liveClock.toLocaleTimeString('fr-FR')}</span>
          </div>

          {/* Real-time Multi-agent Simulation Trigger */}
          <button
            onClick={onRunMultiAgentSimulation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer shadow-2xs active:scale-95"
            title="Déclencher une saisie automatique coordonnée entre Agent Port et Agent Cosumar"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-600 fill-current" />
            <span>Simuler Saisie Multi-Agents</span>
          </button>

          {/* Quick populate button with all photos data */}
          <button
            onClick={onLoadPhotoFleetConvoy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer shadow-2xs active:scale-95"
            title="Injecter la flotte réelle complète des photos (6 en transit + 4 terminés)"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Flotte Photos</span>
          </button>
        </div>

      </div>

      {/* Active Agent Selector Bar */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>Sélectionner le Poste / Agent Actif :</span>
          </div>

          {/* Agent Pill Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Tous les Agents Button */}
            <button
              onClick={() => onSelectAgentRole('ALL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentAgentRole === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tous les Agents (Vue Collective)</span>
            </button>

            {/* Individual Agents */}
            {AVAILABLE_AGENTS.map((agent) => {
              const isSelected = currentAgentRole === agent.id;
              let icon = <Anchor className="w-3.5 h-3.5" />;
              if (agent.id === 'AGENT_COSUMAR') icon = <Scale className="w-3.5 h-3.5 text-amber-500" />;
              if (agent.id === 'AGENT_CONTROLE') icon = <Shield className="w-3.5 h-3.5 text-purple-500" />;
              if (agent.id === 'SUPERVISEUR') icon = <Users className="w-3.5 h-3.5 text-slate-400" />;

              return (
                <button
                  key={agent.id}
                  onClick={() => onSelectAgentRole(agent.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-500'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {icon}
                  <span>{agent.name}</span>
                  <span className={`text-[10px] font-mono px-1 rounded ${isSelected ? 'bg-blue-800 text-blue-200' : 'bg-slate-100 text-slate-500'}`}>
                    {agent.code}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Current Active Agent Banner Details */}
        {currentAgentRole !== 'ALL' && (
          <div className="mt-2.5 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">Poste actif :</span>
              <span className="font-medium text-blue-700">{currentAgentInfo.roleTitle}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">Emplacement : {currentAgentInfo.station}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-blue-100 text-blue-800 font-mono px-2 py-0.5 rounded font-bold">
                Visa actif : {currentAgentInfo.name} ({currentAgentInfo.code})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Switcher: All Agents / Port / Cosumar / Controle / Activity Feed */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <div className="flex items-center gap-2">
          
          <button
            onClick={() => setActiveTab('ALL')}
            className={`flex items-center gap-1.5 py-2 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'ALL'
                ? 'border-slate-900 text-slate-900 bg-slate-50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-slate-700" />
            <span>Tableau de Bord Simultané (Tous Agents)</span>
          </button>

          <button
            onClick={() => setActiveTab('PORT')}
            className={`flex items-center gap-1.5 py-2 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'PORT'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Anchor className="w-3.5 h-3.5 text-blue-600" />
            <span>1. Poste Sortie Quai Port</span>
            <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">
              {nextIdPreview}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('COSUMAR')}
            className={`flex items-center gap-1.5 py-2 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'COSUMAR'
                ? 'border-amber-600 text-amber-700 bg-amber-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-amber-600" />
            <span>2. Poste Pesée Pont-Bascule Cosumar</span>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full">
              {inTransitTrucks.length} en attente
            </span>
          </button>

          <button
            onClick={() => setActiveTab('CONTROLE')}
            className={`flex items-center gap-1.5 py-2 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'CONTROLE'
                ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            <span>3. Poste Contrôle Corridor</span>
          </button>

          <button
            onClick={() => setActiveTab('LOGS')}
            className={`flex items-center gap-1.5 py-2 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'LOGS'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Fil d'Activité en Direct</span>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
              {activityLogs.length}
            </span>
          </button>

        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-in fade-in duration-150 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{feedbackMsg.text}</span>
          </div>
          <button 
            onClick={() => setFeedbackMsg(null)}
            className="text-xs text-emerald-700 hover:underline cursor-pointer font-bold ml-2"
          >
            OK
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODE 1: ALL AGENTS SIMULTANEOUS SPLIT VIEW                    */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'ALL' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* PANEL 1: Agent Quai Port */}
            <div className="bg-gradient-to-br from-blue-50/60 to-white p-4 rounded-xl border border-blue-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-blue-900">
                      Poste Agent Quai Port • Sortie Sans Pesée
                    </h3>
                    <p className="text-[10px] text-blue-700">
                      Agent : {portAgentName}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                  Prochain : {nextIdPreview}
                </span>
              </div>

              {/* Quick Compact Form Port */}
              <form onSubmit={handleSubmitDepart} className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Flotte Photos ({COSUMAR_FLEET.length})
                    </label>
                    <select
                      value={selectedFleetTruck}
                      onChange={(e) => handleSelectFleetTruck(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-blue-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">-- Choisir camion --</option>
                      {COSUMAR_FLEET.map(f => (
                        <option key={f.plate} value={f.plate}>{f.plate} • {f.driver}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Matricule Camion <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="ex: 70605A55"
                      value={customPlate}
                      onChange={(e) => setCustomPlate(e.target.value.toUpperCase())}
                      className="w-full px-2 py-1.5 bg-yellow-50 border border-yellow-300 rounded font-mono font-bold text-xs uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Nom du Conducteur <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Nom complet"
                      value={customDriver}
                      onChange={(e) => setCustomDriver(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Produit Cargaison
                    </label>
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {COMMON_PRODUCTS.slice(0, 7).map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Horodatage en direct : {liveClock.toLocaleTimeString('fr-FR')}
                  </span>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded shadow-xs transition cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Valider Sortie Quai Port</span>
                  </button>
                </div>
              </form>
            </div>

            {/* PANEL 2: Agent Pont-Bascule Cosumar */}
            <div className="bg-gradient-to-br from-amber-50/60 to-white p-4 rounded-xl border border-amber-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-amber-900">
                      Poste Agent Pont-Bascule Cosumar • Pesage Obligatoire
                    </h3>
                    <p className="text-[10px] text-amber-700">
                      Opérateur : {cosumarAgentName}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-xs text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                  {inTransitTrucks.length} en route
                </span>
              </div>

              {inTransitTrucks.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 bg-white/70 rounded-lg border border-dashed border-amber-300">
                  <p className="font-bold text-amber-900">Aucun camion en attente de pesée</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Utilisez le formulaire Port à gauche ou le bouton "Flotte Photos" pour lancer des rotations.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitWeighing} className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Camion Arrivé au Pont-Bascule Cosumar <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={weighTruckId}
                      onChange={(e) => setWeighTruckId(e.target.value)}
                      className="w-full px-2 py-1.5 bg-amber-50 border border-amber-300 rounded font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      {inTransitTrucks.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.truckID} • {t.driverName} ({t.product})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                        Brut (Kg) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="10"
                        min="1"
                        value={grossInput}
                        onChange={(e) => setGrossInput(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                        Tare (Kg) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="10"
                        min="0"
                        value={tareInput}
                        onChange={(e) => setTareInput(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                        Poids Net
                      </label>
                      <div className="px-2 py-1.5 rounded bg-emerald-100 border border-emerald-300 text-center font-mono font-black text-xs text-emerald-900">
                        {calculatedNet !== null ? formatWeight(calculatedNet) : '-'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Net calculé automatiquement
                    </span>
                    <button
                      type="submit"
                      disabled={calculatedNet === null || calculatedNet <= 0}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-white font-semibold text-xs rounded shadow-xs transition cursor-pointer ${
                        calculatedNet === null || calculatedNet <= 0
                          ? 'bg-slate-400 cursor-not-allowed opacity-60'
                          : 'bg-amber-600 hover:bg-amber-500'
                      }`}
                    >
                      <Scale className="w-3 h-3" />
                      <span>Valider Pesage Pont-Bascule</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>

          {/* Quick Real-Time Activity Ticker across all agents */}
          <div className="bg-slate-900 text-slate-200 rounded-xl p-3 border border-slate-800">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2 font-bold text-white">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Flux d'Activité en Direct de Tous les Agents</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {activityLogs.length} événements enregistrés
              </span>
            </div>

            {activityLogs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">
                Aucune action enregistrée pour le moment. Utilisez les postes de saisie ci-dessus ou cliquez sur "Simuler Saisie Multi-Agents".
              </p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {activityLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-800/60 border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        log.agentRole === 'AGENT_PORT' ? 'bg-blue-900/80 text-blue-300' :
                        log.agentRole === 'AGENT_COSUMAR' ? 'bg-amber-900/80 text-amber-300' :
                        'bg-purple-900/80 text-purple-300'
                      }`}>
                        {log.agentName}
                      </span>
                      <span className="text-slate-300 font-medium">{log.details}</span>
                    </div>
                    <span className="font-mono text-[10px] text-cyan-300">{log.transactionId}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODE 2: DEDICATED TAB - AGENT QUAI PORT                        */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'PORT' && (
        <form onSubmit={handleSubmitDepart} className="space-y-3 bg-blue-50/30 p-4 rounded-xl border border-blue-200/60">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-blue-100">
            <div>
              <h3 className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                <Anchor className="w-4 h-4 text-blue-600" />
                Poste Dédié : Agent Quai Portuaire (Capitainerie / Terminal Sucre)
              </h3>
              <p className="text-xs text-slate-500">
                Enregistrement direct du départ des camions dès la fin du chargement quai (Processus sans pesée au port).
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700">Agent Signataire :</label>
              <input
                type="text"
                value={portAgentName}
                onChange={(e) => setPortAgentName(e.target.value)}
                className="px-2 py-1 bg-white border border-blue-300 rounded text-xs font-bold text-blue-900 w-52"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sélection Rapide Flotte Cosumar ({COSUMAR_FLEET.length})
              </label>
              <select
                value={selectedFleetTruck}
                onChange={(e) => handleSelectFleetTruck(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Choisir un camion des photos --</option>
                {COSUMAR_FLEET.map(f => (
                  <option key={f.plate} value={f.plate}>{f.plate} • {f.driver}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Matricule Camion <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="ex: 70605A55"
                value={customPlate}
                onChange={(e) => setCustomPlate(e.target.value.toUpperCase())}
                className="w-full px-2.5 py-1.5 bg-yellow-50 border border-yellow-300 rounded-lg text-slate-900 font-mono font-bold text-xs uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chauffeur / Conducteur <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Nom complet du chauffeur"
                value={customDriver}
                onChange={(e) => setCustomDriver(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Type de Marchandise / Produit
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {COMMON_PRODUCTS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Horodatage Port automatique :</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                {formatDateFrench(liveClock.toISOString())}
              </span>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-sm transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enregistrer Sortie Port & Générer Bon</span>
            </button>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODE 3: DEDICATED TAB - AGENT PONT-BASCULE COSUMAR            */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'COSUMAR' && (
        <form onSubmit={handleSubmitWeighing} className="space-y-3 bg-amber-50/30 p-4 rounded-xl border border-amber-200/60">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-100">
            <div>
              <h3 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-amber-600" />
                Poste Dédié : Opérateur Pont-Bascule Cosumar (Pesage Réception Usine)
              </h3>
              <p className="text-xs text-slate-500">
                Pesage obligatoire du Poids Brut à l'arrivée et de la Tare à vide après déchargement.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700">Opérateur Bascule :</label>
              <input
                type="text"
                value={cosumarAgentName}
                onChange={(e) => setCosumarAgentName(e.target.value)}
                className="px-2 py-1 bg-white border border-amber-300 rounded text-xs font-bold text-amber-900 w-52"
              />
            </div>
          </div>

          {inTransitTrucks.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 bg-white rounded-lg border border-dashed border-amber-300">
              <p className="font-bold text-amber-900 text-sm">Aucun camion en transit actuellement</p>
              <p className="text-xs text-slate-500 mt-1">
                Les camions enregistrés au quai portuaire s'afficheront ici automatiquement en temps réel pour le pesage.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sélectionner Camion Arrivé ({inTransitTrucks.length}) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={weighTruckId}
                    onChange={(e) => setWeighTruckId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-amber-50 border border-amber-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {inTransitTrucks.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.truckID} • {t.driverName} ({t.product})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Poids Brut (en Kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="10"
                    min="1"
                    value={grossInput}
                    onChange={(e) => setGrossInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tare Camion à Vide (en Kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    value={tareInput}
                    onChange={(e) => setTareInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Poids Net Facturable
                  </label>
                  <div className="px-2.5 py-1.5 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-emerald-800">Net :</span>
                    <span className="font-mono font-black text-sm text-emerald-900">
                      {calculatedNet !== null ? formatWeight(calculatedNet) : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Horodatage Cosumar :</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                    {formatDateFrench(liveClock.toISOString())}
                  </span>
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
                  <span>Valider Pesée Cosumar & Clôturer Transaction</span>
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODE 4: DEDICATED TAB - AGENT CONTROLE CORRIDOR               */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'CONTROLE' && (
        <form onSubmit={handleSubmitControl} className="space-y-3 bg-purple-50/30 p-4 rounded-xl border border-purple-200/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-purple-100">
            <div>
              <h3 className="text-sm font-bold text-purple-900 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-purple-600" />
                Poste Dédié : Agent Contrôle & Sécurité Barrière Corridor (Autoroute)
              </h3>
              <p className="text-xs text-slate-500">
                Pointage des camions en transit, vérification des plombs de sécurité et des temps de route.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700">Agent Contrôleur :</label>
              <input
                type="text"
                value={controlAgentName}
                onChange={(e) => setControlAgentName(e.target.value)}
                className="px-2 py-1 bg-white border border-purple-300 rounded text-xs font-bold text-purple-900 w-52"
              />
            </div>
          </div>

          {inTransitTrucks.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 bg-white rounded-lg border border-dashed border-purple-300">
              <p className="font-bold text-purple-900">Aucun convoi en circulation sur le corridor</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Camion Contrôlé <span className="text-red-500">*</span>
                </label>
                <select
                  value={controlTruckId}
                  onChange={(e) => setControlTruckId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {inTransitTrucks.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.truckID} • {t.driverName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rapport / Observation de Contrôle
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={controlStatusNote}
                    onChange={(e) => setControlStatusNote(e.target.value)}
                    placeholder="ex: Plombs intacts, contrôle pesée barrière OK"
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-lg shadow-xs transition cursor-pointer"
                  >
                    Valider Contrôle
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODE 5: FULL ACTIVITY AUDIT LOG                               */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'LOGS' && (
        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900">
                Journal Chronologique d'Activité Multi-Agents en Temps Réel
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Synchronisé en direct
            </span>
          </div>

          {activityLogs.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              Aucun événement pour le moment. Réalisez des saisies dans les onglets ou lancez une simulation.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {activityLogs.map((log) => (
                <div key={log.id} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                    </span>
                    <span className="font-semibold text-slate-800">
                      [{log.agentName}]
                    </span>
                    <span className="text-slate-600">{log.details}</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {log.truckID}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
