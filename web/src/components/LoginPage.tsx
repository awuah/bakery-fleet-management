import React, { useState } from 'react';
import { Croissant, Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, Key } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: { username: string; role: string }) => void;
}

export const ADMIN_CREDENTIALS = {
  username: 'admin',
  email: 'admin@bakery.com',
  password: 'BakeryAdmin2026!',
};

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const cleanUser = username.trim().toLowerCase();
      const isValidUser = cleanUser === ADMIN_CREDENTIALS.username || cleanUser === ADMIN_CREDENTIALS.email;
      const isValidPassword = password === ADMIN_CREDENTIALS.password;

      if (isValidUser && isValidPassword) {
        const sessionData = {
          username: cleanUser === ADMIN_CREDENTIALS.email ? 'Bakery Admin' : 'Admin',
          role: 'Master Bakery Administrator',
          authenticatedAt: new Date().toISOString(),
        };

        if (rememberMe) {
          localStorage.setItem('crust_fleet_auth', JSON.stringify(sessionData));
        } else {
          sessionStorage.setItem('crust_fleet_auth', JSON.stringify(sessionData));
        }

        onLoginSuccess(sessionData);
      } else {
        setError('Invalid username or password. Please verify your admin credentials.');
        setIsLoading(false);
      }
    }, 350);
  };

  const handleFillDemo = () => {
    setUsername(ADMIN_CREDENTIALS.username);
    setPassword(ADMIN_CREDENTIALS.password);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Background ambient lighting - Warm Amber & Emerald Only (NO PURPLE) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-200/50 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-emerald-100/60 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 shadow-lg shadow-amber-500/25 mb-4">
            <Croissant className="w-9 h-9 text-slate-950 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            CRUST & FLEET
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Master Bakery Production & Fleet Logistics HQ
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Admin Sign In</h2>
              <p className="text-xs text-slate-500 mt-0.5">Enter credentials to unlock management portal</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 font-medium animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or admin@bakery.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500/30 accent-amber-500"
                />
                <span className="text-xs font-medium text-slate-600">Remember this session</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm rounded-xl shadow-md shadow-amber-500/25 transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 text-slate-950" />
                  <span>Sign In to HQ Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                  Authorized Admin Access
                </span>
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline underline-offset-2 cursor-pointer"
                >
                  Auto-Fill
                </button>
              </div>
              <div className="text-xs text-slate-700 space-y-0.5">
                <div><span className="font-semibold text-slate-500">User:</span> <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200 font-bold text-slate-900">{ADMIN_CREDENTIALS.username}</code></div>
                <div><span className="font-semibold text-slate-500">Pass:</span> <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200 font-bold text-slate-900">{ADMIN_CREDENTIALS.password}</code></div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <p className="text-center text-xs text-slate-400 mt-6 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Encrypted Bakery Logistics Portal • Strictly Authorized Fleet Management</span>
        </p>
      </div>
    </div>
  );
};
