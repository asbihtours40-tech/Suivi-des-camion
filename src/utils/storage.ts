import { Transaction, AgentActivityItem } from '../types';
import { INITIAL_TRANSACTIONS } from '../data/mockTransactions';

const STORAGE_KEY = 'logistics_tracking_port_cosumar_v2';
const ACTIVITY_STORAGE_KEY = 'cosumar_agent_activity_logs_v1';
export const SHEET_PASSWORD = '1234'; // From VBA Const MDP_FEUILLE As String = "1234"

// BroadcastChannel for cross-tab multi-agent real-time communication
const BROADCAST_CHANNEL_NAME = 'cosumar_realtime_logistics_channel';
let realtimeChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    realtimeChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch {
  realtimeChannel = null;
}

export function broadcastRealtimeUpdate(action: string, payload?: unknown): void {
  try {
    if (realtimeChannel) {
      realtimeChannel.postMessage({ action, payload, timestamp: Date.now() });
    }
  } catch (err) {
    console.warn('BroadcastChannel error', err);
  }
}

export function subscribeToRealtimeUpdates(
  callback: (msg: { action: string; payload?: unknown; timestamp: number }) => void
): () => void {
  if (!realtimeChannel) return () => {};
  const handler = (event: MessageEvent) => {
    if (event.data) {
      callback(event.data);
    }
  };
  realtimeChannel.addEventListener('message', handler);
  return () => {
    realtimeChannel?.removeEventListener('message', handler);
  };
}

export function getTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveTransactions(INITIAL_TRANSACTIONS);
      return INITIAL_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load transactions from localStorage', err);
    return INITIAL_TRANSACTIONS;
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save transactions to localStorage', err);
  }
}

export function clearAllTransactions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('logistics_tracking_port_depot_v1');
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    clearAgentActivityLogs();
    broadcastRealtimeUpdate('CLEAR_ALL');
  } catch (err) {
    console.error('Failed to clear transactions', err);
  }
}

// --------------------------------------------------------------------
// MULTI-AGENT ACTIVITY LOGS
// --------------------------------------------------------------------
export function getAgentActivityLogs(): AgentActivityItem[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAgentActivityLogs(logs: AgentActivityItem[]): void {
  try {
    localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(logs.slice(0, 50))); // Keep last 50 events
  } catch (err) {
    console.error('Failed to save activity logs', err);
  }
}

export function addAgentActivityLog(item: Omit<AgentActivityItem, 'id' | 'timestamp'>): AgentActivityItem {
  const current = getAgentActivityLogs();
  const newItem: AgentActivityItem = {
    ...item,
    id: `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
  };
  const updated = [newItem, ...current].slice(0, 50);
  saveAgentActivityLogs(updated);
  broadcastRealtimeUpdate('NEW_ACTIVITY_LOG', newItem);
  return newItem;
}

export function clearAgentActivityLogs(): void {
  try {
    localStorage.removeItem(ACTIVITY_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Generates the next Transaction ID matching Excel formula:
 * nextID = "TR-" & Format(lastRow + 999, "0000")
 */
export function generateNextTransactionId(transactions: Transaction[]): string {
  let maxNum = 1000;
  for (const t of transactions) {
    const match = t.id.match(/^TR-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  const nextNum = maxNum + 1;
  return `TR-${String(nextNum).padStart(4, '0')}`;
}

export function formatDateFrench(dateString?: string | null): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

export function formatDateShort(dateString?: string | null): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${day}/${month} à ${hours}:${minutes}`;
}

export function formatWeight(weight?: number | null): string {
  if (weight === null || weight === undefined) return '-';
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0
  }).format(weight) + ' Kg';
}

export function formatTons(weightInKg?: number | null): string {
  if (weightInKg === null || weightInKg === undefined) return '-';
  const tons = weightInKg / 1000;
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(tons) + ' T';
}

export function computeTransitDuration(startIso: string, endIso?: string | null): string {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);
  const totalMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  if (hours === 0) return `${mins} min`;
  return `${hours}h ${mins.toString().padStart(2, '0')}m`;
}

export function exportToCSV(transactions: Transaction[]): void {
  const headers = [
    'N° Transaction (Col A)',
    'Heure Sortie Port (Col B)',
    'N° Camion (Col C)',
    'Poids Brut Kg (Col D)',
    'Tare Kg (Col E)',
    'Poids Net Kg (Col F)',
    'Nom Chauffeur (Col G)',
    'Observations (Col H)',
    'Produit (Col I)',
    'Statut (Col J)',
    'Heure Entree Cosumar (Col K)',
    'Agent Quai Port (Sortie)',
    'Agent Pont-Bascule (Pesée)'
  ];

  const rows = transactions.map(t => [
    t.id,
    t.exitPortTime ? formatDateFrench(t.exitPortTime) : '',
    t.truckID,
    t.grossWeight !== null ? t.grossWeight : '',
    t.tare !== null ? t.tare : '',
    t.netWeight !== null ? t.netWeight : '',
    `"${(t.driverName || '').replace(/"/g, '""')}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
    `"${(t.product || '').replace(/"/g, '""')}"`,
    t.status,
    t.entryDepotTime ? formatDateFrench(t.entryDepotTime) : '',
    `"${(t.agentPort || 'M. Benkirane (AG-PORT-01)').replace(/"/g, '""')}"`,
    `"${(t.agentCosumar || (t.status === 'Terminé' ? 'M. Tahiri (AG-COSU-02)' : '')).replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [
    headers.join(';'),
    ...rows.map(r => r.join(';'))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Saisie_Donnees_Port_Cosumar_MultiAgents_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
