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
import { Transaction } from './types';
import { CosumarTruck } from './data/cosumarFleet';
import { 
  getTransactions, 
  saveTransactions, 
  clearAllTransactions,
  generateNextTransactionId, 
  formatWeight 
} from './utils/storage';
import { INITIAL_TRANSACTIONS } from './data/mockTransactions';
import { Anchor, ArrowRight, Warehouse, CheckCircle2, Info, Code2 } from 'lucide-react';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => getTransactions());
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to storage on change
  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

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
  // MACRO 1: ENREGISTRER SORTIE DU PORT (SANS PESEE)
  // --------------------------------------------------------------------
  const handleCreateDepartPort = (data: {
    truckID: string;
    driverName: string;
    product: string;
    carrier?: string;
    notes?: string;
  }): Transaction => {
    const nextID = generateNextTransactionId(transactions);
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
    };

    setTransactions(prev => [newTransaction, ...prev]);
    setToastMessage(`Sortie Port validée pour le camion ${newTransaction.truckID} (N° ${newTransaction.id})`);
    return newTransaction;
  };

  // --------------------------------------------------------------------
  // MACRO 2: ENREGISTRER ARRIVÉE + PESAGE OBLIGATOIRE À COSUMAR
  // --------------------------------------------------------------------
  const handleCompleteDepotWeighing = (
    transactionId: string,
    grossWeight: number,
    tare: number,
    notes?: string
  ): Transaction => {
    const entryTime = new Date().toISOString();
    const net = grossWeight - tare;

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
            notes: notes ? (t.notes ? `${t.notes} | ${notes}` : notes) : t.notes,
          };
          updatedTarget = updated;
          return updated;
        }
        return t;
      })
    );

    setToastMessage(`Pesage Cosumar validé pour le camion : Poids Net = ${formatWeight(net)}`);
    return updatedTarget || transactions.find(t => t.id === transactionId)!;
  };

  // Delete transaction (Superviseur mode)
  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setToastMessage(`Transaction ${id} supprimée de la feuille Saisie_Donnees.`);
  };

  // Clear all transactions (registre vierge)
  const handleClearAll = () => {
    clearAllTransactions();
    setTransactions([]);
    setToastMessage('Registre vidé : feuille Saisie_Donnees remise à blanc (vierge).');
  };

  // Reset demo data
  const handleResetSampleData = () => {
    if (confirm('Voulez-vous réinitialiser le registre avec les données d\'exemple initiales ?')) {
      setTransactions(INITIAL_TRANSACTIONS);
      setToastMessage('Données réinitialisées.');
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
          setToastMessage('Feuille Saisie_Donnees verrouillée (Mode Lecture/Opérateur).');
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
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-medium text-slate-100">{toastMessage}</span>
          </div>
        )}

        {/* Process Guidance Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-amber-950 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 text-[11px] font-bold px-2 py-0.5 rounded border border-blue-500/30 uppercase tracking-wider">
                Flux Opérationnel
              </span>
              <span className="text-xs text-slate-300 font-medium">
                Logistique Portuaire & Ponts-Bascules
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
            const tableElement = document.getElementById('search-transactions');
            if (tableElement) tableElement.scrollIntoView({ behavior: 'smooth' });
          }}
          onFilterFinished={() => {
            const tableElement = document.getElementById('search-transactions');
            if (tableElement) tableElement.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Live Corridor of trucks en route */}
        <TransitCorridor
          transactions={transactions}
          onWeighTruck={handleStartWeighingTruck}
          onOpenDepartModal={() => setIsDepartModalOpen(true)}
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
            <span>Conformité & Intégration Code VBA Excel</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-400">
            <div>
              <strong className="text-slate-200 block mb-1">1. Sub EnregistrerDepartPort()</strong>
              <p className="leading-relaxed text-[11px]">
                Capture l'immatriculation du camion (majuscules forcées), le chauffeur et le produit. Génère automatiquement le N° de transaction <code>TR-XXXX</code> et affecte le statut <code>"En transit"</code> avec l'heure exacte de sortie quai.
              </p>
            </div>
            <div>
              <strong className="text-slate-200 block mb-1">2. Sub EnregistrerArriveeCosumar()</strong>
              <p className="leading-relaxed text-[11px]">
                Recherche le camion au statut <code>"En transit"</code> dans la feuille <code>Saisie_Donnees</code>. Rend obligatoire la saisie du Poids Brut et de la Tare (&gt;0 Kg) au pont-bascule Cosumar, calcule le Poids Net et bascule le statut à <code>"Terminé"</code>.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Système de Suivi Logistique • Corridor Port Autonome &rarr; Cosumar</span>
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
          setToastMessage('Feuille Saisie_Donnees déverrouillée avec succès (Mode Superviseur actif).');
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
