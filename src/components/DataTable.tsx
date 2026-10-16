import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Download, 
  Scale, 
  Printer, 
  Trash2, 
  Lock, 
  Clock, 
  AlertCircle,
  Eye,
  Edit2,
  RefreshCw,
  Plus,
  Users,
  Anchor,
  UserCheck
} from 'lucide-react';
import { Transaction, TransactionStatus, AVAILABLE_AGENTS } from '../types';
import { formatDateFrench, formatWeight, formatTons, exportToCSV, computeTransitDuration } from '../utils/storage';

interface DataTableProps {
  transactions: Transaction[];
  isUnlocked: boolean;
  onOpenUnlockModal: () => void;
  onWeighTruck: (transaction: Transaction) => void;
  onViewTicket: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction?: (transaction: Transaction) => void;
  onResetSampleData?: () => void;
  onClearAll?: () => void;
  onOpenDepartModal: () => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  transactions,
  isUnlocked,
  onOpenUnlockModal,
  onWeighTruck,
  onViewTicket,
  onDeleteTransaction,
  onEditTransaction,
  onResetSampleData,
  onClearAll,
  onOpenDepartModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TransactionStatus>('ALL');
  const [agentFilter, setAgentFilter] = useState<string>('ALL');

  // Filter logic
  const filtered = transactions.filter((t) => {
    // Status filter
    if (statusFilter !== 'ALL' && t.status !== statusFilter) {
      return false;
    }

    // Agent filter
    if (agentFilter !== 'ALL') {
      const portMatch = (t.agentPort || 'M. Benkirane (AG-PORT-01)').includes(agentFilter);
      const cosumarMatch = (t.agentCosumar || 'M. Tahiri (AG-COSU-02)').includes(agentFilter);
      if (!portMatch && !cosumarMatch) return false;
    }

    // Search query
    if (!searchTerm) return true;
    const query = searchTerm.toLowerCase();
    return (
      t.id.toLowerCase().includes(query) ||
      t.truckID.toLowerCase().includes(query) ||
      t.driverName.toLowerCase().includes(query) ||
      t.product.toLowerCase().includes(query) ||
      (t.carrier && t.carrier.toLowerCase().includes(query)) ||
      (t.notes && t.notes.toLowerCase().includes(query)) ||
      (t.agentPort && t.agentPort.toLowerCase().includes(query)) ||
      (t.agentCosumar && t.agentCosumar.toLowerCase().includes(query))
    );
  });

  const inTransitCount = transactions.filter(t => t.status === 'En transit').length;
  const finishedCount = transactions.filter(t => t.status === 'Terminé').length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Title & Sheet Badge */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Registre Logistique : Feuille <span className="font-mono text-emerald-800">Saisie_Donnees</span>
                </h2>
                <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-700 font-semibold rounded">
                  {transactions.length} enregistrements
                </span>
                {transactions.length === 0 && (
                  <span className="text-[11px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">
                    Registre Vierge
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Suivi chronologique des colonnes A à K du classeur logistique (Sorties Port & Entrées Cosumar avec visas des agents).
              </p>
            </div>
          </div>

          {/* Actions & Export */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-export-csv"
              onClick={() => exportToCSV(transactions)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded text-xs font-medium shadow-2xs transition cursor-pointer"
              title="Télécharger le classeur au format CSV / Excel avec colonnes agents"
            >
              <Download className="w-3 h-3 text-slate-500" />
              <span>Exporter CSV Multi-Agents</span>
            </button>

            {onClearAll && (
              <button
                onClick={() => {
                  if (confirm('Voulez-vous vider complètement le registre pour repartir sur une feuille vierge ?')) {
                    onClearAll();
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded text-xs font-medium transition cursor-pointer"
                title="Supprimer tous les camions enregistrés (Remettre à blanc / vierge)"
              >
                <Trash2 className="w-3 h-3 text-red-500" />
                <span>Vider le registre (Vierge)</span>
              </button>
            )}
          </div>

        </div>

        {/* Filter bar & Search */}
        <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Tab buttons */}
            <div className="flex items-center bg-slate-200/80 p-1 rounded-lg text-xs font-medium self-start">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tous ({transactions.length})
              </button>
              <button
                onClick={() => setStatusFilter('En transit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
                  statusFilter === 'En transit'
                    ? 'bg-amber-500 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>En transit ({inTransitCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('Terminé')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
                  statusFilter === 'Terminé'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
                <span>Terminé ({finishedCount})</span>
              </button>
            </div>

            {/* Filter by Agent */}
            <div className="flex items-center gap-1 bg-white border border-slate-300 px-2.5 py-1 rounded-lg text-xs">
              <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-slate-500 text-[11px] font-medium hidden sm:inline">Agent :</span>
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tous les agents</option>
                <option value="Benkirane">M. Benkirane (Agent Port)</option>
                <option value="Tahiri">M. Tahiri (Opérateur Cosumar)</option>
                <option value="El Amrani">M. El Amrani (Contrôle Barrière)</option>
              </select>
            </div>
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="search-transactions"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher camion, chauffeur, agent..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-3 whitespace-nowrap">
                Col A <br />
                <span className="text-slate-900">N° Trans.</span>
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap">
                Col B <br />
                <span className="text-slate-900">Sortie Port</span>
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap">
                Col C <br />
                <span className="text-slate-900">N° Camion</span>
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap">
                Col G <br />
                <span className="text-slate-900">Chauffeur</span>
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap">
                Col I <br />
                <span className="text-slate-900">Produit</span>
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap text-right">
                Col D <br />
                <span className="text-slate-900">Poids Brut</span>
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap text-right">
                Col E <br />
                <span className="text-slate-900">Tare</span>
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap text-right">
                Col F <br />
                <span className="text-slate-900">Poids Net</span>
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap text-center">
                Col J <br />
                <span className="text-slate-900">Statut</span>
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap">
                Col K <br />
                <span className="text-slate-900">Entrée Cosumar</span>
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap">
                Visas Agents <br />
                <span className="text-slate-900">Port & Cosumar</span>
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-8 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">Aucune donnée correspondante</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm ? 'Essayez de modifier votre recherche.' : 'Aucun enregistrement dans cette catégorie.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((t, idx) => {
                const isTransit = t.status === 'En transit';
                const duration = computeTransitDuration(t.exitPortTime, t.entryDepotTime);

                return (
                  <tr 
                    key={t.id}
                    className={`hover:bg-blue-50/40 transition ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                    }`}
                  >
                    {/* Col A: ID */}
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {t.id}
                    </td>

                    {/* Col B: Heure Sortie Port */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 font-mono">
                      {formatDateFrench(t.exitPortTime)}
                    </td>

                    {/* Col C: N° Camion */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold">
                      <span className="bg-yellow-100 text-slate-900 px-2 py-0.5 rounded border border-yellow-300">
                        {t.truckID}
                      </span>
                    </td>

                    {/* Col G: Chauffeur */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-800 font-medium">
                      {t.driverName}
                    </td>

                    {/* Col I: Produit */}
                    <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate" title={t.product}>
                      {t.product}
                    </td>

                    {/* Col D: Brut */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-right font-mono text-slate-800">
                      {t.grossWeight !== null ? formatWeight(t.grossWeight) : (
                        <span className="text-slate-400 italic">Non pesé</span>
                      )}
                    </td>

                    {/* Col E: Tare */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-right font-mono text-slate-800">
                      {t.tare !== null ? formatWeight(t.tare) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>

                    {/* Col F: Net */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-right font-mono font-bold text-emerald-700">
                      {t.netWeight !== null ? (
                        <span>{formatWeight(t.netWeight)}</span>
                      ) : (
                        <span className="text-slate-400 font-normal italic">En attente</span>
                      )}
                    </td>

                    {/* Col J: Statut */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-center">
                      {isTransit ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-[11px] border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          En transit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px] border border-emerald-200">
                          Terminé
                        </span>
                      )}
                    </td>

                    {/* Col K: Heure Entrée Dépôt */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 font-mono">
                      {t.entryDepotTime ? (
                        <div>
                          <span>{formatDateFrench(t.entryDepotTime)}</span>
                          <span className="block text-[10px] text-slate-400">
                            Trajet : {duration}
                          </span>
                        </div>
                      ) : (
                        <span className="text-amber-600 italic font-sans flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Route ({duration})
                        </span>
                      )}
                    </td>

                    {/* Visas Agents */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-[11px]">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-blue-800">
                          <span className="text-[10px] font-bold text-blue-500">Port :</span>
                          <span className="font-medium truncate max-w-[140px]" title={t.agentPort || 'M. Benkirane'}>
                            {t.agentPort || 'M. Benkirane (AG-PORT-01)'}
                          </span>
                        </div>
                        {t.status === 'Terminé' && (
                          <div className="flex items-center gap-1 text-amber-800">
                            <span className="text-[10px] font-bold text-amber-600">Cosumar :</span>
                            <span className="font-medium truncate max-w-[140px]" title={t.agentCosumar || 'M. Tahiri'}>
                              {t.agentCosumar || 'M. Tahiri (AG-COSU-02)'}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {isTransit ? (
                          <div className="flex items-center gap-1">
                            <button
                              id={`btn-table-weigh-${t.id}`}
                              onClick={() => onWeighTruck(t)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded text-[11px] transition shadow-2xs cursor-pointer"
                              title="Effectuer le pesage à Cosumar (Macro 2)"
                            >
                              <Scale className="w-3 h-3" />
                              <span>Peser</span>
                            </button>
                            <button
                              onClick={() => onViewTicket(t)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="Voir / Imprimer le Bon de Sortie Port"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onViewTicket(t)}
                            className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded text-[11px] transition cursor-pointer"
                            title="Voir le bon / ticket de pesage officiel"
                          >
                            <Printer className="w-3 h-3 text-slate-500" />
                            <span>Bon / Ticket</span>
                          </button>
                        )}

                        {/* Superviseur / Unlocked actions */}
                        {isUnlocked ? (
                          <button
                            onClick={() => {
                              if (confirm(`Supprimer la transaction ${t.id} de la feuille Excel ?`)) {
                                onDeleteTransaction(t.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                            title="Supprimer la ligne (Mode Superviseur)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={onOpenUnlockModal}
                            className="p-1 text-slate-300 hover:text-slate-500 rounded transition cursor-pointer"
                            title="Feuille protégée. Code 1234 requis pour modifier/supprimer."
                          >
                            <Lock className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Spreadsheet Status Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span>
            Affichage : <strong>{filtered.length}</strong> sur <strong>{transactions.length}</strong> enregistrements
          </span>
          {agentFilter !== 'ALL' && (
            <span className="text-blue-700 font-medium">
              • Filtré sur agent : {agentFilter}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
          <span>Feuille : Saisie_Donnees</span>
          <span>Plage active : A2:K{Math.max(2, transactions.length + 1)}</span>
        </div>
      </div>

    </div>
  );
};
