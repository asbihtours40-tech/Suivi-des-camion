export type TransactionStatus = 'En transit' | 'Terminé';

export type AgentRole = 'ALL' | 'AGENT_PORT' | 'AGENT_COSUMAR' | 'AGENT_CONTROLE' | 'SUPERVISEUR';

export interface AgentProfile {
  id: AgentRole;
  name: string;
  roleTitle: string;
  station: string;
  code: string;
  avatarColor: string;
}

export const AVAILABLE_AGENTS: AgentProfile[] = [
  {
    id: 'AGENT_PORT',
    name: 'M. Benkirane',
    roleTitle: 'Agent Quai Portuaire • Capitainerie',
    station: 'Quai Vracier / Terminal Sucre (Port)',
    code: 'AG-PORT-01',
    avatarColor: 'from-blue-600 to-cyan-700',
  },
  {
    id: 'AGENT_COSUMAR',
    name: 'M. Tahiri',
    roleTitle: 'Opérateur Pont-Bascule • Réception',
    station: 'Pont-Bascule Entrée Usine (Cosumar)',
    code: 'AG-COSU-02',
    avatarColor: 'from-amber-600 to-orange-700',
  },
  {
    id: 'AGENT_CONTROLE',
    name: 'M. El Amrani',
    roleTitle: 'Agent Contrôle & Barrière Corridor',
    station: 'Poste Péage & Sécurité Autoroute',
    code: 'AG-CTRL-03',
    avatarColor: 'from-purple-600 to-indigo-700',
  },
  {
    id: 'SUPERVISEUR',
    name: 'Direction Coordination',
    roleTitle: 'Superviseur Logistique Central',
    station: 'Centre de Contrôle Général des Flux',
    code: 'SUP-LOG-00',
    avatarColor: 'from-slate-700 to-slate-900',
  },
];

export interface AgentActivityItem {
  id: string;
  timestamp: string;
  agentRole: AgentRole;
  agentName: string;
  agentCode: string;
  actionType: 'DEPART_PORT' | 'PESEE_COSUMAR' | 'CONTROLE_BARRIERE' | 'SIMULATION_MULTI_AGENTS';
  transactionId: string;
  truckID: string;
  details: string;
}

export interface Transaction {
  id: string;              // Col A: N° Transaction (TR-1001...)
  exitPortTime: string;    // Col B: Heure Sortie Port (ISO timestamp)
  truckID: string;         // Col C: N° Camion
  grossWeight: number | null; // Col D: Poids Brut en Kg
  tare: number | null;     // Col E: Tare en Kg
  netWeight: number | null;// Col F: Poids Net en Kg (Brut - Tare)
  driverName: string;      // Col G: Nom du chauffeur
  notes?: string;          // Col H: Observations
  product: string;         // Col I: Type de marchandise / Produit
  status: TransactionStatus;// Col J: Statut ("En transit" | "Terminé")
  entryDepotTime: string | null; // Col K: Heure Entrée Cosumar (ISO timestamp)
  carrier?: string;        // Société de transport
  agentPort?: string;      // Agent responsable de la Sortie Port
  agentCosumar?: string;   // Agent responsable du Pesage Cosumar
  checkpointControl?: string; // Contrôle intermédiaire barrière
}

export interface NewPortDepartureInput {
  truckID: string;
  driverName: string;
  product: string;
  notes?: string;
  carrier?: string;
  agentPort?: string;
}

export interface DepotWeighingInput {
  transactionId: string;
  grossWeight: number;
  tare: number;
  notes?: string;
  agentCosumar?: string;
}

export interface SheetSecurityState {
  isUnlocked: boolean;
  unlockedAt: number | null;
}
