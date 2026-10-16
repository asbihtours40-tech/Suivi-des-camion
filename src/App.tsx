import React, { useState, useEffect } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  KPICards 
} from './components/KPICards';
import { 
  TransitCorridor 
} from './components/TransitCorridor';
import { 
  DataTable 
} from './components/DataTable';
import { 
  DepartPortModal 
} from './components/DepartPortModal';
import { 
  ArriveeDepotModal 
} from './components/ArriveeDepotModal';
import { 
  TicketModal 
} from './components/TicketModal';
import { 
  PasswordModal 
} from './components/PasswordModal';
import { 
  CosumarFleetModal 
} from './components/CosumarFleetModal';
import { 
  RealTimeDataEntry 
} from './components/RealTimeDataEntry';
import { Transaction, AgentRole, AgentActivityItem } from './types';
import { CosumarTruck, COSUMAR_FLEET } from './data/cosumarFleet';
import { 
  getTransactions, 
  saveTransactions, 
  clearAllTransactions,
  generateNextTransactionId, 
  formatWeight,
  getAgentActivityLogs,
  saveAgentActivityLogs,
  addAgentActivityLog,
  subscribeToRealtimeUpdates,
  broadcastRealtimeUpdate
} from './utils/storage';
import { INITIAL_TRANSACTIONS, COMMON_PRODUCTS } from './data/mockTransactions';
import { Anchor, ArrowRight, Warehouse, CheckCircle2, Info, Code2, Users, Zap } from 'lucide-react';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => getTransactions());
  const [activityLogs, setActivityLogs] = useState<AgentActivityItem[]>(() => getAgentActivityLogs());
  const [currentAgentRole, setCurrentAgentRole] = useState<AgentRole>('ALL');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  // Modal visibility states
  const [isDepartModalOpen, setIsDepartModalOpen] = useState<boolean>(false);
  const [selectedFleetTruckForDepart, setSelectedFleetTruckForDepart] = useState<CosumarTruck | null>(null);
  const [isArriveeModalOpen, setIsArriveeModalOpen] = useState<boolean>(false);
  const [selectedTruckForWeighing, setSelectedTruckForWeighing] = useState<string | null>(null);

  const [isTicketModalOpen, setIsTicketModalOpen] = useState<boolean>(false);
  const [activeTicketTransaction, setActiveTicketTransaction] = useState<Transaction | null>(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [isFleetModalOpen, setIsFleetModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'info' | 'success' | 'agent' } | null>(null);

  // Sync to storage on change
  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveAgentActivityLogs(activityLogs);
  }, [activityLogs]);

  // Cross-tab real-time sync with BroadcastChannel & storage events
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeUpdates((msg) => {
      // Reload state from storage when another tab updates
      setTransactions(getTransactions());
      setActivityLogs(getAgentActivityLogs());
      if (msg.action === 'TRANSACTION_CREATED') {
        const payload = msg.payload as Transaction;
        setToastMessage({
          text: `[Temps Réel] Nouveau départ port enregistré : ${payload.truckID} (${payload.id})`,
          type: 'agent'
        });
      } else if (msg.action === 'TRANSACTION_WEIGHED') {
        const payload = msg.payload as Transaction;
        setToastMessage({
          text: `[Temps Réel] Pesage Cosumar validé pour ${payload.truckID}`,
          type: 'success'
        });
      }
    });

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'logistics_tracking_port_cosumar_v2') {
        setTransactions(getTransactions());
      } else if (e.key === 'cosumar_agent_activity_logs_v1') {
        setActivityLogs(getAgentActivityLogs());
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Toast timeout
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const inTransitCount = transactions.filter(t => t.status === 'En transit').length;
  const nextIdPreview = generateNextTransactionId(transactions);

  // --------------------------------------------------------------------
  // MACRO 1: ENREGISTRER SORTIE DU PORT (SANS PESEE) - PAR AGENT QUAI
  // --------------------------------------------------------------------
  const handleCreateDepartPort = (data: {
    truckID: string;
    driverName: string;
    product: string;
    carrier?: string;
    notes?: string;
    agentPort?: string;
  }): Transaction => {
    const nextID = generateNextTransactionId(transactions);
    const agent = data.agentPort || 'M. Benkirane (AG-PORT-01)';
    const newTransaction: Transaction = {
      id: nextID,
      exitPortTime: new Date().toISOString(),
      truckID: data.truckID.toUpperCase().trim(),
      grossWeight: null,
      tare: null,
      netWeight: null,
      driverName: data.driverName.trim(),
      notes: data.notes || undefined,
      product: data.product.trim(),
      status: 'En transit',
      entryDepotTime: null,
      carrier: data.carrier,
      agentPort: agent,
    };

    setTransactions(prev => [newTransaction, ...prev]);

    // Record multi-agent activity log
    const log = addAgentActivityLog({
      agentRole: 'AGENT_PORT',
      agentName: agent,
      agentCode: 'AG-PORT-01',
      actionType: 'DEPART_PORT',
      transactionId: newTransaction.id,
      truckID: newTransaction.truckID,
      details: `Sortie Quai Port validée (${newTransaction.product})`,
    });
    setActivityLogs(prev => [log, ...prev].slice(0, 50));
    broadcastRealtimeUpdate('TRANSACTION_CREATED', newTransaction);

    setToastMessage({
      text: `Sortie Port validée par ${agent} pour ${newTransaction.truckID} (N° ${newTransaction.id})`,
      type: 'agent'
    });
    return newTransaction;
  };

  // --------------------------------------------------------------------
  // MACRO 2: ENREGISTRER ARRIVÉE + PESAGE OBLIGATOIRE À COSUMAR
  // --------------------------------------------------------------------
  const handleCompleteDepotWeighing = (
    transactionId: string,
    grossWeight: number,
    tare: number,
    notes?: string,
    agentCosumar?: string
  ): Transaction => {
    const entryTime = new Date().toISOString();
    const net = grossWeight - tare;
    const agent = agentCosumar || 'M. Tahiri (AG-COSU-02)';

    let updatedTarget: Transaction | null = null;

    setTransactions(prev => 
      prev.map(t => {
        if (t.id === transactionId) {
          const updated: Transaction = {
            ...t,
            grossWeight,
            tare,
            netWeight: net,
            status: 'Terminé',
            entryDepotTime: entryTime,
            agentCosumar: agent,
            notes: notes ? (t.notes ? `${t.notes} | ${notes}` : notes) : t.notes,
          };
          updatedTarget = updated;
          return updated;
        }
        return t;
      })
    );

    const target = updatedTarget || transactions.find(t => t.id === transactionId)!;

    // Record multi-agent activity log
    const log = addAgentActivityLog({
      agentRole: 'AGENT_COSUMAR',
      agentName: agent,
      agentCode: 'AG-COSU-02',
      actionType: 'PESEE_COSUMAR',
      transactionId,
      truckID: target?.truckID || transactionId,
      details: `Pesage validé : Brut = ${formatWeight(grossWeight)}, Tare = ${formatWeight(tare)}, Net = ${formatWeight(net)}`,
    });
    setActivityLogs(prev => [log, ...prev].slice(0, 50));
    broadcastRealtimeUpdate('TRANSACTION_WEIGHED', target);

    setToastMessage({
      text: `Pesage Cosumar validé par ${agent} pour ${target?.truckID} : Poids Net = ${formatWeight(net)}`,
      type: 'success'
    });
    return target;
  };

  // --------------------------------------------------------------------
  // POINTAGE INTERMÉDIAIRE / CONTRÔLE BARRIÈRE CORRIDOR
  // --------------------------------------------------------------------
  const handleRecordCheckpointControl = (
    transactionId: string,
    notes: string,
    agentControl?: string
  ) => {
    const agent = agentControl || 'M. El Amrani (AG-CTRL-03)';
    const target = transactions.find(t => t.id === transactionId);
    
    setTransactions(prev =>
      prev.map(t => {
        if (t.id === transactionId) {
          return {
            ...t,
            checkpointControl: `Contrôlé par ${agent} à ${new Date().toLocaleTimeString('fr-FR')}`,
            notes: t.notes ? `${t.notes} | [Barrière: ${notes}]` : `[Barrière: ${notes}]`,
          };
        }
        return t;
      })
    );

    const log = addAgentActivityLog({
      agentRole: 'AGENT_CONTROLE',
      agentName: agent,
      agentCode: 'AG-CTRL-03',
      actionType: 'CONTROLE_BARRIERE',
      transactionId,
      truckID: target?.truckID || transactionId,
      details: `Contrôle de passage corridor : ${notes}`,
    });
    setActivityLogs(prev => [log, ...prev].slice(0, 50));
    broadcastRealtimeUpdate('CHECKPOINT_RECORDED', { transactionId, notes });

    setToastMessage({
      text: `Pointage corridor enregistré par ${agent} pour le camion ${target?.truckID || transactionId}`,
      type: 'agent'
    });
  };

  // --------------------------------------------------------------------
  // MULTI-AGENT REAL-TIME SIMULATION
  // --------------------------------------------------------------------
  const handleRunMultiAgentSimulation = () => {
    // Pick an unused or representative fleet truck
    const available = COSUMAR_FLEET[Math.floor(Math.random() * COSUMAR_FLEET.length)];
    const product = COMMON_PRODUCTS[Math.floor(Math.random() * 4)];

    // 1. Agent Quai Port dispatches truck
    const newTrans = handleCreateDepartPort({
      truckID: available.plate,
      driverName: available.driver,
      product: product,
      carrier: 'Cosumar Logistique',
      notes: 'Simulation en temps réel Multi-Agents',
      agentPort: 'M. Benkirane (AG-PORT-01)',
    });

    // 2. If there are other trucks already in transit, simulate Agent Cosumar weighing one of them after a tiny delay
    const waitingForWeigh = transactions.filter(t => t.status === 'En transit' && t.id !== newTrans.id);
    if (waitingForWeigh.length > 0) {
      const toWeigh = waitingForWeigh[0];
      setTimeout(() => {
        const brut = 42000 + Math.floor(Math.random() * 2500);
        const tare = 14000 + Math.floor(Math.random() * 1000);
        handleCompleteDepotWeighing(
          toWeigh.id,
          brut,
          tare,
          'Pesage automatique en direct (Simulation)',
          'M. Tahiri (AG-COSU-02)'
        );
      }, 1000);
    }
  };

  // Delete transaction (Superviseur mode)
  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setToastMessage({ text: `Transaction ${id} supprimée de la feuille Saisie_Donnees.`, type: 'info' });
  };

  // Clear all transactions (registre vierge)
  const handleClearAll = () => {
    clearAllTransactions();
    setTransactions([]);
    setActivityLogs([]);
    setToastMessage({ text: 'Registre vidé : feuille Saisie_Donnees remise à blanc (vierge).', type: 'info' });
  };

  // Launch real-time test convoy with 3 Cosumar fleet trucks
  const handleStartDemoConvoy = () => {
    const nowMs = Date.now();
    const demoBatch = [
      { plate: '70605A55', driver: 'BENNAR EEDOUANE', mins: 52, product: 'Sucre Brut en vrac (Importation)' },
      { plate: '12325D6', driver: 'CHAKIR SAID', mins: 32, product: 'Sucre Blanc Raffiné (Sacs 50 Kg)' },
      { plate: '2804D6', driver: 'MOUHAJER ABDELMAJID', mins: 12, product: 'Mélasse de canne / betterave' },
    ];

    let startNum = 1001;
    for (const t of transactions) {
      const m = t.id.match(/^TR-(\d+)$/i);
      if (m) {
        const val = parseInt(m[1], 10);
        if (val >= startNum) startNum = val + 1;
      }
    }

    const newRows: Transaction[] = demoBatch.map((item, idx) => ({
      id: `TR-${String(startNum + idx).padStart(4, '0')}`,
      exitPortTime: new Date(nowMs - item.mins * 60000).toISOString(),
      truckID: item.plate,
      grossWeight: null,
      tare: null,
      netWeight: null,
      driverName: item.driver,
      product: item.product,
      status: 'En transit',
      entryDepotTime: null,
      carrier: 'Cosumar Logistique',
      agentPort: 'M. Benkirane (AG-PORT-01)',
      notes: 'Convoi en suivi temps réel Port -> Cosumar'
    }));

    setTransactions(prev => [...newRows, ...prev]);
    setToastMessage({ text: 'Convoi de 3 camions Cosumar lancé avec succès en suivi temps réel !', type: 'success' });
  };

  // Full real-time photo fleet loader (6 active in transit + 4 completed at Cosumar)
  const handleLoadPhotoFleetConvoy = () => {
    const nowMs = Date.now();
    
    // In transit trucks (active on highway at various real-time progress steps)
    const activePhotoTrucks = [
      { plate: '70605A55', driver: 'BENNAR EEDOUANE', mins: 55, prod: 'Sucre Brut en vrac (Importation)' },
      { plate: '12325D6', driver: 'CHAKIR SAID', mins: 42, prod: 'Sucre Blanc Raffiné (Sacs 50 Kg)' },
      { plate: '65334A55', driver: 'MAHFOUD ABDERRAHIM', mins: 28, prod: 'Sucre Granulé Vrac (Citerne)' },
      { plate: '3102A74', driver: 'MEHDI CHAHID', mins: 18, prod: 'Sucre Brut de Canne' },
      { plate: '2804D6', driver: 'MOUHAJER ABDELMAJID', mins: 8, prod: 'Mélasse de betterave' },
      { plate: '56063A55', driver: 'AZIZ EZZAHED', mins: 75, prod: 'Pulpe déshydratée en vrac' },
    ];

    // Already weighed at Cosumar pont-bascule
    const completedPhotoTrucks = [
      { plate: '58904A55', driver: 'ABDELILAH MANSOURI', startMins: 140, endMins: 85, brut: 43250, tare: 14650, prod: 'Sucre Brut en vrac (Importation)' },
      { plate: '46182A7', driver: 'MOUTAWAKIL ADIL', startMins: 120, endMins: 65, brut: 41800, tare: 13900, prod: 'Sucre Blanc Raffiné (Sacs 50 Kg)' },
      { plate: '65335A55', driver: 'BENDAM RACHID', startMins: 95, endMins: 40, brut: 44100, tare: 14800, prod: 'Pain de Sucre Cosumar' },
      { plate: '3106A74', driver: 'NADI MAATI', startMins: 80, endMins: 25, brut: 42600, tare: 14200, prod: 'Sucre Brut en vrac (Importation)' },
    ];

    let startNum = 1001;
    const generatedRows: Transaction[] = [];

    // Add active transit trucks
    activePhotoTrucks.forEach((item, idx) => {
      generatedRows.push({
        id: `TR-${String(startNum + idx).padStart(4, '0')}`,
        exitPortTime: new Date(nowMs - item.mins * 60000).toISOString(),
        truckID: item.plate,
        grossWeight: null,
        tare: null,
        netWeight: null,
        driverName: item.driver,
        product: item.prod,
        status: 'En transit',
        entryDepotTime: null,
        carrier: 'Cosumar Logistique',
        agentPort: 'M. Benkirane (AG-PORT-01)',
        notes: 'Saisie en temps réel • Sortie Quai Port'
      });
    });

    startNum += activePhotoTrucks.length;

    // Add completed weighings
    completedPhotoTrucks.forEach((item, idx) => {
      generatedRows.push({
        id: `TR-${String(startNum + idx).padStart(4, '0')}`,
        exitPortTime: new Date(nowMs - item.startMins * 60000).toISOString(),
        truckID: item.plate,
        grossWeight: item.brut,
        tare: item.tare,
        netWeight: item.brut - item.tare,
        driverName: item.driver,
        product: item.prod,
        status: 'Terminé',
        entryDepotTime: new Date(nowMs - item.endMins * 60000).toISOString(),
        carrier: 'Cosumar Logistique',
        agentPort: 'M. Benkirane (AG-PORT-01)',
        agentCosumar: 'M. Tahiri (AG-COSU-02)',
        notes: 'Pesage pont-bascule Cosumar validé'
      });
    });

    setTransactions(generatedRows);
    setToastMessage({ text: 'Données réelles des photos saisies avec succès en temps réel (6 en route + 4 pesés) !', type: 'success' });
  };

  // Reset demo data
  const handleResetSampleData = () => {
    if (confirm('Voulez-vous réinitialiser le registre avec les données d\'exemple initiales ?')) {
      setTransactions(INITIAL_TRANSACTIONS);
      setToastMessage({ text: 'Données réinitialisées.', type: 'info' });
    }
  };

  // Open weighing for a specific truck
  const handleStartWeighingTruck = (truck: Transaction) => {
    setSelectedTruckForWeighing(truck.id);
    setIsArriveeModalOpen(true);
  };

  // View printable ticket
  const handleViewTicket = (t: Transaction) => {
    setActiveTicketTransaction(t);
    setIsTicketModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Header with quick macro triggers & sheet protection */}
      <Header
        isUnlocked={isUnlocked}
        onOpenUnlockModal={() => setIsPasswordModalOpen(true)}
        onLockSheet={() => {
          setIsUnlocked(false);
          setToastMessage({ text: 'Feuille Saisie_Donnees verrouillée (Mode Lecture/Opérateur).', type: 'info' });
        }}
        onOpenDepartModal={() => {
          setSelectedFleetTruckForDepart(null);
          setIsDepartModalOpen(true);
        }}
        onOpenArriveeModal={() => {
          setSelectedTruckForWeighing(null);
          setIsArriveeModalOpen(true);
        }}
        onOpenFleetModal={() => setIsFleetModalOpen(true)}
        inTransitCount={inTransitCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Toast alert */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-top duration-200">
            <CheckCircle2 className={`w-5 h-5 shrink-0 ${
              toastMessage.type === 'agent' ? 'text-cyan-400' :
              toastMessage.type === 'success' ? 'text-emerald-400' : 'text-blue-400'
            }`} />
            <span className="text-xs font-medium text-slate-100">{toastMessage.text}</span>
          </div>
        )}

        {/* Process Guidance Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-amber-950 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 text-[11px] font-bold px-2 py-0.5 rounded border border-blue-500/30 uppercase tracking-wider">
                Flux Opérationnel Multi-Agents
              </span>
              <span className="text-xs text-slate-300 font-medium">
                Logistique Portuaire & Ponts-Bascules Cosumar
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Processus : Sortie du Port (Sans Pesée) &rarr; Pesage Obligatoire à Cosumar
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Pour fluidifier le quai portuaire, les camions partent du Port sans passer par le pont-bascule. Le pesage officiel (Poids Brut et Tare à vide) s'effectue obligatoirement à l'arrivée chez <strong>Cosumar</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <div className="text-right text-xs pr-2.5 border-r border-slate-700 hidden sm:block">
              <span className="text-slate-400 block text-[10px]">Prochaine</span>
              <span className="font-mono font-bold text-cyan-300 text-xs">{nextIdPreview}</span>
            </div>
            <button
              onClick={() => setIsDepartModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition cursor-pointer"
            >
              <span>+ Sortie Port (1)</span>
            </button>
            <button
              onClick={() => {
                setSelectedTruckForWeighing(null);
                setIsArriveeModalOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded transition cursor-pointer"
            >
              <span>+ Pesée Cosumar (2)</span>
            </button>
          </div>
        </div>

        {/* Real-time KPI summary */}
        <KPICards
          transactions={transactions}
          onFilterTransit={() => {
            const el = document.getElementById('corridor-temps-reel');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          onFilterFinished={() => {
            const tableElement = document.getElementById('search-transactions');
            if (tableElement) tableElement.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Real-Time Express Multi-Agent Data Entry Station */}
        <RealTimeDataEntry
          transactions={transactions}
          activityLogs={activityLogs}
          onAddDepartPort={handleCreateDepartPort}
          onCompleteWeighing={handleCompleteDepotWeighing}
          onRecordCheckpointControl={handleRecordCheckpointControl}
          onRunMultiAgentSimulation={handleRunMultiAgentSimulation}
          onLoadPhotoFleetConvoy={handleLoadPhotoFleetConvoy}
          nextIdPreview={nextIdPreview}
          currentAgentRole={currentAgentRole}
          onSelectAgentRole={setCurrentAgentRole}
        />

        {/* Live Corridor of trucks en route */}
        <TransitCorridor
          transactions={transactions}
          onWeighTruck={handleStartWeighingTruck}
          onOpenDepartModal={() => setIsDepartModalOpen(true)}
          onStartDemoConvoy={handleStartDemoConvoy}
        />

        {/* Excel Saisie_Donnees Table representation */}
        <DataTable
          transactions={transactions}
          isUnlocked={isUnlocked}
          onOpenUnlockModal={() => setIsPasswordModalOpen(true)}
          onWeighTruck={handleStartWeighingTruck}
          onViewTicket={handleViewTicket}
          onDeleteTransaction={handleDeleteTransaction}
          onResetSampleData={handleResetSampleData}
          onClearAll={handleClearAll}
          onOpenDepartModal={() => setIsDepartModalOpen(true)}
        />

        {/* VBA Macro Documentation Drawer / Footer */}
        <div className="bg-slate-900 text-slate-300 rounded-xl p-5 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
            <Code2 className="w-4 h-4" />
            <span>Conformité & Intégration Code VBA Excel • Tous Agents</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-400">
            <div>
              <strong className="text-slate-200 block mb-1">1. Poste Agent Port - Sub EnregistrerDepartPort()</strong>
              <p className="leading-relaxed text-[11px]">
                Capture l'immatriculation du camion (majuscules forcées), le chauffeur, le produit et le visa de l'agent de quai. Génère automatiquement le N° de transaction <code>TR-XXXX</code> et affecte le statut <code>"En transit"</code> avec l'heure exacte de sortie quai.
              </p>
            </div>
            <div>
              <strong className="text-slate-200 block mb-1">2. Poste Opérateur Cosumar - Sub EnregistrerArriveeCosumar()</strong>
              <p className="leading-relaxed text-[11px]">
                Recherche le camion au statut <code>"En transit"</code> dans la feuille <code>Saisie_Donnees</code>. Rend obligatoire la saisie du Poids Brut et de la Tare (&gt;0 Kg) au pont-bascule Cosumar, calcule le Poids Net et bascule le statut à <code>"Terminé"</code> avec visa métrologique.
              </p>
            </div>
            <div>
              <strong className="text-slate-200 block mb-1">3. Poste Contrôle Corridor & Superviseur</strong>
              <p className="leading-relaxed text-[11px]">
                Assure la synchronisation en direct des flux et la traçabilité complète des agents avec horodatage certifié, émission des bons et export vers Excel.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Système de Suivi Logistique Multi-Agents • Corridor Port Autonome &rarr; Cosumar</span>
          <span className="font-mono text-[11px] text-slate-400">Feuille Excel : Saisie_Donnees (MDP: 1234)</span>
        </div>
      </footer>

      {/* Modals */}
      <DepartPortModal
        isOpen={isDepartModalOpen}
        onClose={() => {
          setIsDepartModalOpen(false);
          setSelectedFleetTruckForDepart(null);
        }}
        onSubmit={handleCreateDepartPort}
        nextIdPreview={nextIdPreview}
        initialTruck={selectedFleetTruckForDepart}
        onPrintTicket={(t) => {
          setIsDepartModalOpen(false);
          setSelectedFleetTruckForDepart(null);
          setActiveTicketTransaction(t);
          setIsTicketModalOpen(true);
        }}
      />

      <ArriveeDepotModal
        isOpen={isArriveeModalOpen}
        onClose={() => {
          setIsArriveeModalOpen(false);
          setSelectedTruckForWeighing(null);
        }}
        transactions={transactions}
        initialSelectedTruckId={selectedTruckForWeighing}
        onSubmitWeighing={handleCompleteDepotWeighing}
        onPrintTicket={(t) => {
          setIsArriveeModalOpen(false);
          setActiveTicketTransaction(t);
          setIsTicketModalOpen(true);
        }}
      />

      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => {
          setIsTicketModalOpen(false);
          setActiveTicketTransaction(null);
        }}
        transaction={activeTicketTransaction}
      />

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => {
          setIsUnlocked(true);
          setToastMessage({ text: 'Feuille Saisie_Donnees déverrouillée avec succès (Mode Superviseur actif).', type: 'info' });
        }}
      />

      <CosumarFleetModal
        isOpen={isFleetModalOpen}
        onClose={() => setIsFleetModalOpen(false)}
        onSelectTruckForDepart={(truck) => {
          setSelectedFleetTruckForDepart(truck);
          setIsDepartModalOpen(true);
        }}
      />

    </div>
  );
}
