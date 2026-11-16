import React, { useState } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface AdminLoginViewProps {
  onSuccess?: () => void;
  onBackToStudent?: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onSuccess, onBackToStudent }) => {
  const { loginAsAdmin } = useAdminAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await loginAsAdmin(password.trim());
      if (res.success) {
        if (typeof window !== 'undefined') {
          window.history.pushState({}, '', '/admin');
        }
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = '/admin';
        }
      } else {
        setError(res.error || 'Incorrect administrator password.');
      }
    } catch (err: any) {
      setError(err?.message || 'Server error verifying administrator credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (onBackToStudent) {
      onBackToStudent();
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-[#1E231F] text-[#F7F5EF] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans selection:bg-[#C59B52] selection:text-[#1E231F]">
      {/* Subtle executive background accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#245B45]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#C59B52]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#245B45] to-[#16382B] border border-[#2E6B52] shadow-xl shadow-black/40 mb-4">
            <ShieldCheck className="w-8 h-8 text-[#E2C785]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            StudyPilot AI
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#283229] border border-[#3A473C] text-[#E2C785]">
            <Lock className="w-3 h-3 text-[#E2C785]" />
            Super Admin Control Plane
          </div>
          <p className="text-xs text-[#A0A89C] mt-2 max-w-xs mx-auto leading-relaxed">
            Restricted operational system access. Single-password authentication required.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#242A25] border border-[#374138] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#E5E0D5] uppercase tracking-wider mb-2">
                Administrator Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Super Admin Security Key"
                  className="w-full pl-4 pr-11 py-3 text-sm bg-[#1A1F1B] border border-[#3A463B] rounded-xl text-white placeholder-[#687364] focus:outline-none focus:ring-2 focus:ring-[#C59B52] focus:border-[#C59B52] transition-all font-mono"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-[#859180] hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !password.trim()}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-[#245B45] to-[#2D7357] hover:from-[#2B6D53] hover:to-[#358766] text-white border border-[#3E8D6D] shadow-lg shadow-black/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#E2C785]" />
                  <span>Verifying Key...</span>
                </>
              ) : (
                <span>Login as Super Admin</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#343E35] flex items-center justify-center">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#A0A89C] hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Student Portal</span>
            </button>
          </div>
        </div>

        {/* Security badge footer */}
        <p className="text-[11px] text-center text-[#6E786B] mt-6">
          StudyPilot AI • Enterprise Administration Console
        </p>
      </div>
    </div>
  );
};
