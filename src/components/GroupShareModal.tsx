import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Copy, Check, X, Shield, PlusCircle, LogIn, AlertCircle } from 'lucide-react';

interface GroupShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GroupShareModal: React.FC<GroupShareModalProps> = ({ isOpen, onClose }) => {
  const { group, groupMembers, createGroup, joinGroup, user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'view' | 'create' | 'join'>('view');
  const [groupNameInput, setGroupNameInput] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupNameInput.trim()) return;

    setError(null);
    setLoading(true);
    try {
      await createGroup(groupNameInput.trim());
      setMode('view');
      setGroupNameInput('');
    } catch (err: any) {
      setError(err?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;

    setError(null);
    setLoading(true);
    try {
      await joinGroup(inviteCodeInput.trim());
      setMode('view');
      setInviteCodeInput('');
    } catch (err: any) {
      setError(err?.message || 'Failed to join group');
    } finally {
      setLoading(false);
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
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Group Settings
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {group ? group.name : 'Join or create your group'}
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
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {group && mode === 'view' ? (
            <>
              {/* Group Invite Code Box */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Group Invite Code
                </label>
                <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="font-mono text-base font-bold text-gray-900 dark:text-white tracking-widest">
                      {group.inviteCode}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      Share this code with group members to invite them
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Members List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Connected Group Members ({groupMembers.length})
                  </label>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {groupMembers.map((member) => {
                    const isMe = user?.id === member.userId;
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                            {(member.userName || member.userEmail || 'G')[0].toUpperCase()}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                              {member.userName || member.userEmail?.split('@')[0]}
                              {isMe && <span className="text-[10px] text-blue-500 ml-1 font-semibold">(You)</span>}
                            </div>
                            <div className="text-[10px] text-gray-400 truncate">{member.userEmail}</div>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold uppercase">
                          {member.role}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={() => setMode('join')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Join another group
                </button>
                <button
                  type="button"
                  onClick={() => setMode('create')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Create new group
                </button>
              </div>
            </>
          ) : mode === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Create a New Group Vault
              </h3>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Group Name</label>
                <input
                  type="text"
                  value={groupNameInput}
                  onChange={(e) => setGroupNameInput(e.target.value)}
                  placeholder="e.g. My Team / Project Group"
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 justify-end">
                {group && (
                  <button
                    type="button"
                    onClick={() => setMode('view')}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{loading ? 'Creating...' : 'Create Group'}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Join an Existing Group
              </h3>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Invite Code</label>
                <input
                  type="text"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. VAULT-8X92"
                  required
                  className="w-full font-mono uppercase px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 justify-end">
                {group ? (
                  <button
                    type="button"
                    onClick={() => setMode('view')}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMode('create')}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Create instead
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{loading ? 'Joining...' : 'Join Group'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Privacy Rules Reminder */}
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Row Level Security Active:
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300">
              Only members belonging to this group can view notes marked as <strong>Group Shared</strong>. Personal notes are strictly visible to you alone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

