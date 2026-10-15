export type TransactionStatus = 'En transit' | 'Terminé';

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
  entryDepotTime: string | null; // Col K: Heure Entrée Dépôt (ISO timestamp)
  carrier?: string;        // Société de transport
}

export interface NewPortDepartureInput {
  truckID: string;
  driverName: string;
  product: string;
  notes?: string;
  carrier?: string;
}

export interface DepotWeighingInput {
  transactionId: string;
  grossWeight: number;
  tare: number;
  notes?: string;
}

export interface SheetSecurityState {
  isUnlocked: boolean;
  unlockedAt: number | null;
}
