import React, { useState } from 'react';
import { useVault } from '../context/VaultContext';
import { Shield, ShieldCheck, Key, Lock, Unlock, Eye, EyeOff, X, AlertCircle } from 'lucide-react';

interface VaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VaultModal: React.FC<VaultModalProps> = ({ isOpen, onClose }) => {
  const { isUnlocked, unlockVault, lockVault, setupVault } = useVault();
  const [passphrase, setPassphrase] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  if (!isOpen) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!passphrase.trim()) {
      setError('Please enter your Group Vault Passphrase');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await unlockVault(passphrase);
      if (res.success) {
        setPassphrase('');
        onClose();
      } else {
        setError(res.error || 'Incorrect passphrase');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to unlock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetupOrChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPass.length < 6) {
      setError('Passphrase should be at least 6 characters long.');
      return;
    }
    if (newPass !== confirmPass) {
      setError('Passphrases do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await setupVault(newPass);
      setIsChangingPass(false);
      setNewPass('');
      setConfirmPass('');
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Setup failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#202124] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              isUnlocked 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' 
                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
            }`}>
              {isUnlocked ? <ShieldCheck className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Group Vault
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Zero-Knowledge AES-256-GCM Encryption
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl flex items-start gap-2.5 text-red-700 dark:text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isUnlocked && !isChangingPass ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-center">
                <Unlock className="w-8 h-8 mx-auto text-emerald-600 dark:text-emerald-400 mb-2" />
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                  Vault is currently Unlocked
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                  Sensitive passwords and confidential notes are decrypted in browser memory.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    lockVault();
                    onClose();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Lock Vault Now
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangingPass(true)}
                  className="py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm transition-colors"
                >
                  Change Passphrase
                </button>
              </div>
            </div>
          ) : isChangingPass ? (
            <form onSubmit={handleSetupOrChange} className="space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Enter a new master passphrase for your group. All group members must use this same passphrase to unlock shared encrypted notes.
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Group Passphrase
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Passphrase
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Repeat passphrase"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangingPass(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  Save Passphrase
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Enter Group Vault Passphrase
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter passphrase to unlock"
                    autoFocus
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Demo Hint */}
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <Key className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Demo Vault Passphrase: </span>
                  <code className="bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded font-mono font-bold select-all cursor-pointer" onClick={() => setPassphrase('groupvault123')}>
                    groupvault123
                  </code> (click to auto-fill)
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangingPass(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Reset / Set New Passphrase
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Unlock className="w-4 h-4" />
                    Unlock
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Security note */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
            🔒 <strong>Zero-Knowledge:</strong> Encryption keys are computed locally using PBKDF2 (100,000 rounds) and AES-256-GCM. Neither Supabase nor any server ever has access to your plaintext or passphrase.
          </div>
        </div>
      </div>
    </div>
  );
};
