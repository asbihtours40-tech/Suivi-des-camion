import React, { useState } from 'react';
import { X, Truck, User, Package, ArrowRight, CheckCircle2, Printer, Anchor, Search, Sparkles } from 'lucide-react';
import { COMMON_PRODUCTS } from '../data/mockTransactions';
import { formatDateFrench } from '../utils/storage';
import { Transaction } from '../types';
import { COSUMAR_FLEET, CosumarTruck, findDriverByPlate } from '../data/cosumarFleet';

interface DepartPortModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    truckID: string;
    driverName: string;
    product: string;
    carrier?: string;
    notes?: string;
    agentPort?: string;
  }) => Transaction;
  nextIdPreview: string;
  onPrintTicket: (transaction: Transaction) => void;
  initialTruck?: CosumarTruck | null;
}

export const DepartPortModal: React.FC<DepartPortModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  nextIdPreview,
  onPrintTicket,
  initialTruck,
}) => {
  const [truckID, setTruckID] = useState(initialTruck?.plate || '');
  const [driverName, setDriverName] = useState(initialTruck?.driver || '');
  const [product, setProduct] = useState(COMMON_PRODUCTS[0]);
  const [carrier, setCarrier] = useState('Cosumar Logistique');
  const [notes, setNotes] = useState('');
  const [agentPort, setAgentPort] = useState('M. Benkirane (AG-PORT-01)');
  const [error, setError] = useState<string | null>(null);

  // Toggle quick fleet drawer
  const [showFleetPicker, setShowFleetPicker] = useState<boolean>(false);
  const [fleetSearch, setFleetSearch] = useState<string>('');

  // Success summary dialog
  const [successData, setSuccessData] = useState<{
    transaction: Transaction;
  } | null>(null);

  // Sync initialTruck if provided
  React.useEffect(() => {
    if (initialTruck) {
      setTruckID(initialTruck.plate);
      setDriverName(initialTruck.driver);
    }
  }, [initialTruck]);

  if (!isOpen) return null;

  const handleSelectCosumarTruck = (item: CosumarTruck) => {
    setTruckID(item.plate);
    setDriverName(item.driver);
    setShowFleetPicker(false);
    setError(null);
  };

  const handleTruckIdChange = (val: string) => {
    const uppercase = val.toUpperCase().trim();
    setTruckID(uppercase);
    // Auto-detect driver from Cosumar list
    const matchedDriver = findDriverByPlate(uppercase);
    if (matchedDriver) {
      setDriverName(matchedDriver);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTruckID = truckID.trim().toUpperCase();
    const cleanDriver = driverName.trim();
    const cleanProduct = product.trim();

    if (!cleanTruckID) {
      setError('Veuillez saisir le N° d\'immatriculation du camion (Étape 1/3).');
      return;
    }
    if (!cleanDriver) {
      setError('Veuillez saisir le nom du conducteur (Étape 2/3).');
      return;
    }
    if (!cleanProduct) {
      setError('Veuillez indiquer le type de marchandise / produit (Étape 3/3).');
      return;
    }

    setError(null);
    const createdTransaction = onSubmit({
      truckID: cleanTruckID,
      driverName: cleanDriver,
      product: cleanProduct,
      carrier: carrier.trim() || undefined,
      notes: notes.trim() || undefined,
      agentPort: agentPort.trim() || undefined,
    });

    setSuccessData({ transaction: createdTransaction });
  };

  const handleResetAndClose = () => {
    setTruckID('');
    setDriverName('');
    setProduct(COMMON_PRODUCTS[0]);
    setCarrier('Cosumar Logistique');
    setNotes('');
    setError(null);
    setSuccessData(null);
    setShowFleetPicker(false);
    onClose();
  };

  const filteredFleet = COSUMAR_FLEET.filter(
    f => f.plate.toLowerCase().includes(fleetSearch.toLowerCase()) ||
         f.driver.toLowerCase().includes(fleetSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-xs">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/10 ring-1 ring-white/20">
              <Anchor className="w-4 h-4 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-200 bg-blue-900/50 px-1.5 py-0.2 rounded">
                  Macro 1 • EnregistrerDepartPort
                </span>
                <span className="font-mono text-[10px] text-blue-200 font-bold bg-blue-600/60 px-1.5 py-0.2 rounded">
                  {nextIdPreview}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5">
                Sortie du Port (Sans Pesée) &rarr; Cosumar
              </h3>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1 rounded text-blue-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5">
          {successData ? (
            /* Success confirmation dialog */
            <div className="space-y-3">
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs text-slate-800">
                  <p className="font-bold text-sm text-blue-950">
                    Sortie Port enregistrée avec succès !
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Validation Port conforme à la macro Excel. Pesage à effectuer à l'arrivée chez <strong>Cosumar</strong>.
                  </p>
                </div>
              </div>

              {/* MsgBox Card content */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between py-0.5 border-b border-slate-200">
                  <span className="text-slate-500">N° Transaction (Col A) :</span>
                  <span className="font-mono font-bold text-slate-900">{successData.transaction.id}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-200">
                  <span className="text-slate-500">Camion (Col C) :</span>
                  <span className="font-mono font-bold text-blue-700 bg-yellow-100 px-1.5 py-0.2 rounded border border-yellow-300">
                    {successData.transaction.truckID}
                  </span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-200">
                  <span className="text-slate-500">Conducteur (Col G) :</span>
                  <span className="font-semibold text-slate-800">{successData.transaction.driverName}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-200">
                  <span className="text-slate-500">Produit (Col I) :</span>
                  <span className="font-semibold text-slate-800">{successData.transaction.product}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-200">
                  <span className="text-slate-500">Heure Sortie Port (Col B) :</span>
                  <span className="font-mono text-slate-800">
                    {formatDateFrench(successData.transaction.exitPortTime)}
                  </span>
                </div>
                <div className="flex justify-between py-0.5 text-[11px] text-amber-800 font-medium">
                  <span>Statut initial (Col J) :</span>
                  <span className="inline-flex items-center gap-1 bg-amber-100 px-2 py-0.2 rounded">
                    En transit
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => onPrintTicket(successData.transaction)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-xs transition cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer Bon de Sortie</span>
                </button>
                <button
                  onClick={handleResetAndClose}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded text-xs transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded font-medium">
                  {error}
                </div>
              )}

              {/* Cosumar Quick Fleet Picker Trigger */}
              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">
                      Flotte Cosumar (38 Camions Chargés)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Matricules & Conducteurs officiels transcrits des photos.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFleetPicker(prev => !prev)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold transition cursor-pointer"
                >
                  {showFleetPicker ? 'Masquer liste' : 'Choisir camion'}
                </button>
              </div>

              {/* Collapsible Fleet Picker Grid */}
              {showFleetPicker && (
                <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg space-y-2 animate-in fade-in duration-100">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                    <input
                      type="text"
                      placeholder="Rechercher par matricule ou nom..."
                      value={fleetSearch}
                      onChange={(e) => setFleetSearch(e.target.value)}
                      className="w-full pl-7 pr-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {filteredFleet.map((item) => (
                      <button
                        key={item.plate}
                        type="button"
                        onClick={() => handleSelectCosumarTruck(item)}
                        className="text-left p-1.5 rounded bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 transition cursor-pointer group"
                      >
                        <span className="font-mono font-bold text-slate-900 group-hover:text-amber-800 block text-[11px]">
                          {item.plate}
                        </span>
                        <span className="text-[9px] text-slate-500 group-hover:text-amber-700 truncate block">
                          {item.driver}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1: Truck ID (Matricule) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  <span className="inline-block px-1 py-0.2 bg-blue-100 text-blue-800 rounded mr-1 text-[9px]">
                    1/3
                  </span>
                  Matricule Camion <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <Truck className="w-4 h-4" />
                  </div>
                  <input
                    id="input-truck-id"
                    type="text"
                    value={truckID}
                    onChange={(e) => handleTruckIdChange(e.target.value)}
                    placeholder="ex: 70605A55, 12325D6, 2804D6..."
                    autoFocus
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 font-mono font-bold text-sm tracking-wide uppercase focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Tapez le matricule : le conducteur est reconnu automatiquement dans la flotte Cosumar.
                </p>
              </div>

              {/* Step 2: Driver Name (Conducteur) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  <span className="inline-block px-1 py-0.2 bg-blue-100 text-blue-800 rounded mr-1 text-[9px]">
                    2/3
                  </span>
                  Nom du conducteur / Chauffeur <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="input-driver-name"
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Nom complet du conducteur"
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Step 3: Product / Cargo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  <span className="inline-block px-1 py-0.2 bg-blue-100 text-blue-800 rounded mr-1 text-[9px]">
                    3/3
                  </span>
                  Marchandise / Produit <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <Package className="w-4 h-4" />
                  </div>
                  <input
                    id="input-product"
                    type="text"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    placeholder="Sélectionnez ci-dessous ou saisissez..."
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Suggestions tags */}
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {COMMON_PRODUCTS.slice(0, 6).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setProduct(p)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer border ${
                        product === p
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional optional fields */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                    Transporteur
                  </label>
                  <input
                    type="text"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder="ex: Cosumar Logistique"
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                    Remarques / N° Scellé
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ex: Bâche intacte, quai 4"
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Operational notice */}
              <div className="p-2 bg-blue-50/60 rounded border border-blue-200 text-[11px] text-blue-900 flex items-center justify-between">
                <div>
                  <strong>Sortie sans pesée :</strong> Le camion quitte le port sans passer par le pont-bascule.
                  Pesage obligatoire à l'arrivée chez <strong>Cosumar</strong>.
                </div>
                <div className="font-mono text-[11px] font-bold text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200 shrink-0 ml-2">
                  ID: {nextIdPreview}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  id="btn-submit-depart-port"
                  type="submit"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs rounded shadow-xs transition cursor-pointer"
                >
                  <span>Valider Sortie Port</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
