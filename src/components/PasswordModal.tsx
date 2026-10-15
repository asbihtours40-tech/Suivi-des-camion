import React, { useState } from 'react';
import { X, Lock, KeyRound, AlertCircle, ShieldCheck } from 'lucide-react';
import { SHEET_PASSWORD } from '../utils/storage';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SHEET_PASSWORD) {
      setError(null);
      setPassword('');
      onSuccess();
      onClose();
    } else {
      setError('Mot de passe incorrect. Indication : le mot de passe défini dans la macro VBA est "1234".');
    }
  };

  const handleClose = () => {
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-white">
              Déverrouiller la Feuille Saisie_Donnees
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="text-xs text-slate-600 space-y-1">
            <p>
              Cette feuille Excel est protégée en écriture (VBA constant <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">MDP_FEUILLE</code>).
            </p>
            <p className="text-[11px] text-slate-500">
              Le déverrouillage active les droits Superviseur pour modifier les pesées ou supprimer des lignes erronées.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mot de passe de protection
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez le mot de passe (1234)"
                autoFocus
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>Code prédéfini : <strong className="font-mono text-slate-600">1234</strong></span>
              <button
                type="button"
                onClick={() => setPassword('1234')}
                className="text-amber-600 hover:underline cursor-pointer"
              >
                Remplir 1234
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-lg shadow-sm transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Déverrouiller</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
