import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  GraduationCap, 
  ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { 
    authModalOpen, 
    closeAuthModal, 
    authModalMode, 
    setAuthModalMode, 
    authNotification,
    clearAuthNotification,
    login, 
    signup 
  } = useAuth();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('Sanjay Ghodawat University');
  const [course, setCourse] = useState('B.Tech');
  const [branch, setBranch] = useState('Artificial Intelligence & Machine Learning');
  const [year, setYear] = useState('2nd Year');
  const [semester, setSemester] = useState('Semester III');

  // UI state
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens or mode changes
  useEffect(() => {
    if (authModalOpen) {
      setFormError(null);
      setIsSubmitting(false);
    }
  }, [authModalOpen, authModalMode]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && authModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authModalOpen, closeAuthModal]);

  if (!authModalOpen) return null;

  const validateForm = (): boolean => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setFormError('Please enter your university email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setFormError('Please enter a valid email address (e.g. student@sgu.ac.in).');
      return false;
    }

    if (!password) {
      setFormError('Please enter your password.');
      return false;
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return false;
    }

    if (authModalMode === 'signup') {
      const cleanName = name.trim();
      if (!cleanName || cleanName.length < 2) {
        setFormError('Please enter your full student name (at least 2 characters).');
        return false;
      }

      if (password !== confirmPassword) {
        setFormError('Passwords do not match. Please verify your confirmation password.');
        return false;
      }
    }

    setFormError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (authModalMode === 'signin') {
        const res = await login({ email: email.trim(), password });
        if (!res.success) {
          setFormError(res.error || 'Failed to sign in. Please verify your credentials.');
        }
      } else {
        const res = await signup({
          email: email.trim(),
          password,
          confirmPassword,
          name: name.trim(),
          university: university.trim(),
          course: course.trim(),
          branch: branch.trim(),
          year: year.trim(),
          semester: semester.trim()
        });
        if (!res.success) {
          setFormError(res.error || 'Failed to create student account.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E5E0D5] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-[#E5E0D5] bg-gradient-to-b from-[#F7F5EF] to-white">
          <button
            onClick={closeAuthModal}
            className="absolute top-5 right-5 p-2 rounded-xl text-charcoal-400 hover:text-charcoal-900 hover:bg-sage-100 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-forest-600 text-white flex items-center justify-center shadow-md shadow-forest-600/20 overflow-hidden">
              <img src="/logo.png" alt="StudyPilot AI" className="w-9 h-9 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-charcoal-900 tracking-tight">
                  StudyPilot AI
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-forest-50 text-forest-700 border border-forest-200">
                  <ShieldCheck className="w-3 h-3 text-forest-600" />
                  Student Portal
                </span>
              </div>
              <p className="text-xs text-charcoal-500 font-medium">
                Sanjay Ghodawat University • Team Codex
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 mt-5 bg-academic-bg rounded-2xl border border-[#E5E0D5]">
            <button
              type="button"
              onClick={() => setAuthModalMode('signin')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                authModalMode === 'signin'
                  ? 'bg-white text-forest-800 shadow-sm border border-[#E5E0D5]'
                  : 'text-charcoal-500 hover:text-charcoal-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthModalMode('signup')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                authModalMode === 'signup'
                  ? 'bg-white text-forest-800 shadow-sm border border-[#E5E0D5]'
                  : 'text-charcoal-500 hover:text-charcoal-900'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Modal Body / Form */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {/* Notification from OAuth redirects */}
          {authNotification && (
            <div className={`mb-4 p-3.5 rounded-2xl border flex items-start gap-2.5 animate-in fade-in ${
              authNotification.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {authNotification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-xs font-medium leading-relaxed flex-1">
                {authNotification.message}
              </div>
              <button 
                type="button" 
                onClick={clearAuthNotification}
                className="text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {formError && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs font-medium leading-relaxed flex-1">
                {formError}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {authModalMode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1.5">
                  Student Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aken Rushikesh Gopal"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-academic-bg border border-[#E5E0D5] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-all font-medium text-charcoal-900"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-charcoal-800 mb-1.5">
                University Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@sgu.ac.in"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-academic-bg border border-[#E5E0D5] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-all font-medium text-charcoal-900"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-charcoal-800">
                  Password <span className="text-rose-500">*</span>
                </label>
                {authModalMode === 'signup' && (
                  <span className="text-[10px] text-charcoal-400 font-medium">
                    At least 8 characters
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-academic-bg border border-[#E5E0D5] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-all font-medium text-charcoal-900"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-charcoal-400 hover:text-charcoal-700 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password field on Signup */}
            {authModalMode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1.5">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-academic-bg border border-[#E5E0D5] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-all font-medium text-charcoal-900"
                    disabled={isSubmitting}
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">
                    Passwords do not match
                  </p>
                )}
              </div>
            )}

            {/* Academic Affiliation for Signup */}
            {authModalMode === 'signup' && (
              <div className="pt-2 border-t border-[#E5E0D5] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-forest-700">
                  <GraduationCap className="w-4 h-4" />
                  <span>Academic Affiliation</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal-600 mb-1">
                      University
                    </label>
                    <input
                      type="text"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-academic-bg border border-[#E5E0D5] rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-forest-500"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal-600 mb-1">
                      Degree / Course
                    </label>
                    <input
                      type="text"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-academic-bg border border-[#E5E0D5] rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-forest-500"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal-600 mb-1">
                      Department / Branch
                    </label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-academic-bg border border-[#E5E0D5] rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-forest-500"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal-600 mb-1">
                      Academic Term
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        placeholder="2nd Year"
                        className="w-full px-2.5 py-2 text-xs bg-academic-bg border border-[#E5E0D5] rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-forest-500"
                        disabled={isSubmitting}
                      />
                      <input
                        type="text"
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        placeholder="Semester III"
                        className="w-full px-2.5 py-2 text-xs bg-academic-bg border border-[#E5E0D5] rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-forest-500"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs bg-forest-600 hover:bg-forest-700 text-white shadow-md shadow-forest-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{authModalMode === 'signin' ? 'Signing In...' : 'Creating Student Account...'}</span>
                </>
              ) : (
                <span>{authModalMode === 'signin' ? 'Sign In to StudyPilot' : 'Complete Registration'}</span>
              )}
            </button>
          </form>

          {/* Switch Mode Footer */}
          <div className="mt-5 pt-4 border-t border-[#E5E0D5] text-center">
            {authModalMode === 'signin' ? (
              <p className="text-xs text-charcoal-500 font-medium">
                New to StudyPilot AI?{' '}
                <button
                  type="button"
                  onClick={() => setAuthModalMode('signup')}
                  className="font-bold text-forest-700 hover:text-forest-800 hover:underline cursor-pointer"
                >
                  Create your student account
                </button>
              </p>
            ) : (
              <p className="text-xs text-charcoal-500 font-medium">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthModalMode('signin')}
                  className="font-bold text-forest-700 hover:text-forest-800 hover:underline cursor-pointer"
                >
                  Sign in to your portal
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
