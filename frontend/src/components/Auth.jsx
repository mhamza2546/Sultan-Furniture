import React, { useState } from 'react';
import { Mail, Key, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { API } from '../lib/api';

function Auth({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'forgot' | 'reset'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        onLogin();
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection failed. Please check your network.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        setMode('reset');
        setMessage('A 6-digit OTP has been sent to your email.');
      } else {
         // for security we still proceed or show generic message
         setMode('reset');
         setMessage('If the email is registered, an OTP was sent.');
      }
    } catch (err) {
      setError('Connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setMode('login');
        setPassword('');
        setOtp('');
        setNewPassword('');
        setMessage('Password updated successfully. You can now log in.');
      } else {
        setError(data.error || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError('Connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000B1A] flex items-center justify-center p-4 selection:bg-[#C5A059]/30">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#C5A059]/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse delay-700"></div>
      </div>

      <div className="w-full max-w-[1100px] bg-white rounded-[40px] shadow-2xl shadow-blue-900/40 relative z-10 overflow-hidden flex min-h-[680px]">
        
        {/* Left Side: Branding & Image (Decorative) */}
        <div className="hidden lg:flex w-1/2 bg-[#001025] relative flex-col justify-between p-12 overflow-hidden border-r border-white/5">
           <div className="relative z-10">
              <div className="h-32 mb-10 w-full flex items-center justify-start overflow-visible">
                 <img
                   src="/logo.png"
                   alt="Abrar's Furniture"
                   className="h-full object-contain transition-transform duration-500 hover:scale-105 [filter:drop-shadow(0_18px_40px_rgba(0,0,0,0.55))_drop-shadow(0_0_22px_rgba(197,160,89,0.28))] opacity-95"
                   onError={(e) => { e.currentTarget.src = '/logo.svg'; }}
                 />
              </div>
              <h1 className="text-4xl font-bold text-white tracking-tight leading-tight mb-4">
                Abrar's Furniture <br />
                <span className="text-[#C5A059]">System.</span>
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
                Manage your manufacturing, inventory, and sales from one central dashboard.
              </p>
           </div>

           <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5 backdrop-blur">
                 <div className="h-10 w-10 rounded-2xl bg-[#C5A059]/20 flex items-center justify-center text-[#C5A059]">
                    <ShieldCheck className="w-6 h-6" />
                 </div>
                 <p className="text-white text-sm font-bold tracking-tight">Secure Admin Access</p>
              </div>
           </div>

           {/* Decorative Design Elements */}
           <div className="absolute bottom-[-50px] right-[-50px] w-80 h-80 border-2 border-white/5 rounded-full"></div>
           <div className="absolute bottom-[-20px] right-[-20px] w-80 h-80 border border-white/5 rounded-full"></div>
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 flex flex-col justify-center p-8 md:p-16 relative bg-white">
           <div className="max-w-[400px] mx-auto w-full">
              
              {/* Header */}
              <div className="mb-10 lg:hidden text-center">
                 <div className="h-24 mx-auto mb-6 bg-[#000B1A] rounded-3xl p-4 flex items-center justify-center shadow-xl border border-white/5">
                    <img
                      src="/logo.png"
                      alt="Abrar's Furniture"
                      className="h-full object-contain [filter:drop-shadow(0_12px_30px_rgba(0,0,0,0.45))_drop-shadow(0_0_18px_rgba(197,160,89,0.25))] opacity-95"
                      onError={(e) => { e.currentTarget.src = '/logo.svg'; }}
                    />
                 </div>
              </div>

              <div className="mb-8 text-center lg:text-left">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">
                  {mode === 'login' ? 'Admin Login' : mode === 'forgot' ? 'Reset Password' : 'Verify Identity'}
                </h2>
                <p className="text-slate-500 font-medium">
                  {mode === 'login' && 'Please enter your email and password to log in.'}
                  {mode === 'forgot' && 'Enter your admin email to receive a 6-digit OTP.'}
                  {mode === 'reset' && 'Enter the OTP sent to your email to create a new password.'}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              {message && (
                <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center gap-3 text-sm font-bold border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  {message}
                </div>
              )}

              <form onSubmit={mode === 'login' ? handleLogin : mode === 'forgot' ? handleForgot : handleReset} className="space-y-6">
                
                {(mode === 'login' || mode === 'forgot') && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 px-1">Email Address</label>
                    <div className="group relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#C5A059] transition-colors">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input 
                        type="email" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[24px] text-sm font-bold focus:bg-white focus:border-[#C5A059] focus:ring-4 focus:ring-[#C5A059]/10 outline-none transition-all"
                        placeholder="enter your email" 
                      />
                    </div>
                  </div>
                )}

                {mode === 'login' && (
                  <div className="space-y-2">
                    <div className="flex justify-between px-1">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Password</label>
                      <button 
                        type="button" 
                        onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}
                        className="text-[10px] font-bold text-[#C5A059] hover:underline uppercase tracking-wide"
                      >
                        Change Password?
                      </button>
                    </div>
                    <div className="group relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#C5A059] transition-colors">
                        <Key className="w-5 h-5" />
                      </div>
                      <input 
                        type="password" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[24px] text-sm font-bold focus:bg-white focus:border-[#C5A059] focus:ring-4 focus:ring-[#C5A059]/10 outline-none transition-all"
                        placeholder="••••••••" 
                      />
                    </div>
                  </div>
                )}

                {mode === 'reset' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 px-1">6-Digit OTP</label>
                      <div className="group relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#C5A059] transition-colors">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <input 
                          type="text" 
                          required 
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[24px] text-center tracking-[1em] text-lg font-black focus:bg-white focus:border-[#C5A059] focus:ring-4 focus:ring-[#C5A059]/10 outline-none transition-all"
                          placeholder="000000" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 px-1">New Password</label>
                      <div className="group relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#C5A059] transition-colors">
                          <Lock className="w-5 h-5" />
                        </div>
                        <input 
                          type="password" 
                          required 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[24px] text-sm font-bold focus:bg-white focus:border-[#C5A059] focus:ring-4 focus:ring-[#C5A059]/10 outline-none transition-all"
                          placeholder="••••••••" 
                        />
                      </div>
                    </div>
                  </>
                )}

                <button 
                  disabled={isLoading}
                  className="w-full py-4 bg-slate-900 hover:bg-black text-white font-black rounded-[24px] transition-all shadow-xl shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-75"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {mode === 'login' ? 'Log In' : mode === 'forgot' ? 'Send OTP' : 'Update Password'}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              {mode !== 'login' && (
                <div className="mt-8 text-center">
                   <button 
                    onClick={() => { setMode('login'); setError(''); setMessage(''); }}
                    className="text-sm font-bold text-slate-500 hover:text-[#C5A059] transition-colors"
                   >
                     Cancel and return to Login
                   </button>
                </div>
              )}

              <div className="mt-12 text-center">
                 <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">© 2026 Abrar's Furniture</span>
              </div>

           </div>
        </div>

      </div>

      {/* Footer Branding */}
      <p className="fixed bottom-8 text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">
        © 2026 Abrar's Furniture Management System
      </p>
    </div>
  );
}

export default Auth;
