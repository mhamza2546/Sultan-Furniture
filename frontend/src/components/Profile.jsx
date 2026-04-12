import React from 'react';
import { User, Mail, ShieldCheck, LogOut, Lock, Edit3, KeyRound } from 'lucide-react';

function Profile({ onLogout }) {
  return (
    <div className="animate-in fade-in duration-500" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Profile</h2>
        <p className="text-sm text-slate-500 mt-1">Your account information and security settings</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-4 shadow-sm border border-slate-100 p-4 p-md-5 mb-4 position-relative overflow-hidden">
        <div className="position-absolute top-0 start-0 end-0" style={{ height: '4px', background: 'linear-gradient(to right, #C5A059, #8E6F3E)' }}></div>

        <div className="row g-4 align-items-center">
          {/* Avatar */}
          <div className="col-auto">
            <div style={{
              width: '100px', height: '100px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #C5A059, #8E6F3E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '40px', fontWeight: 900, color: 'white',
              boxShadow: '0 8px 30px rgba(197,160,89,0.3)'
            }}>
              A
            </div>
          </div>

          {/* Info */}
          <div className="col">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Administrator</h3>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#C5A059' }}>Shadra Main Branch</p>

            <div className="d-flex flex-column gap-2 pt-3 border-top border-slate-100">
              <div className="d-flex align-items-center gap-2 text-slate-600 small fw-semibold">
                <User className="w-4 h-4 text-slate-400" />
                Rao Abrar
              </div>
              <div className="d-flex align-items-center gap-2 text-slate-600 small fw-semibold">
                <Mail className="w-4 h-4 text-slate-400" />
                raoabrar412@gmail.com
              </div>
              <div className="d-flex align-items-center gap-2 small fw-semibold text-success">
                <ShieldCheck className="w-4 h-4" />
                Full Enterprise Access — Verified
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Grid */}
      <div className="row g-4">
        {/* Change Password Card */}
        <div className="col-md-6">
          <div className="bg-white rounded-4 border border-slate-100 shadow-sm p-4 h-100 d-flex flex-column">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary" style={{ width: 44, height: 44 }}>
                <KeyRound className="w-5 h-5" />
              </div>
              <h5 className="fw-bold text-slate-900 mb-0">Change Password</h5>
            </div>
            <p className="text-slate-500 small flex-grow-1" style={{ lineHeight: '1.6' }}>
              To change your password securely, sign out and use the <strong>"Change Password?"</strong> option on the login screen. A 6-digit OTP will be sent to your registered email for verification.
            </p>
            <button
              onClick={onLogout}
              className="btn btn-outline-secondary w-100 fw-bold rounded-3 mt-3"
            >
              Go to Login Screen
            </button>
          </div>
        </div>

        {/* Sign Out Card */}
        <div className="col-md-6">
          <div className="rounded-4 p-4 h-100 d-flex flex-column text-white position-relative overflow-hidden"
            style={{ background: '#000B1A' }}>
            <div className="position-absolute top-0 end-0 rounded-circle opacity-25"
              style={{ width: 120, height: 120, background: 'radial-gradient(circle, #ef4444, transparent)', transform: 'translate(30%, -30%)' }}>
            </div>
            <div className="d-flex align-items-center gap-3 mb-3 position-relative">
              <div className="d-flex align-items-center justify-content-center rounded-3 bg-danger bg-opacity-25 text-danger" style={{ width: 44, height: 44 }}>
                <LogOut className="w-5 h-5" />
              </div>
              <h5 className="fw-bold text-white mb-0">Sign Out</h5>
            </div>
            <p className="text-slate-400 small flex-grow-1 position-relative" style={{ lineHeight: '1.6' }}>
              End your current secure session. You will need to re-enter your email and password to access the system again.
            </p>
            <button
              onClick={onLogout}
              className="btn btn-danger w-100 fw-bold rounded-3 mt-3 shadow position-relative"
              style={{ boxShadow: '0 4px 20px rgba(239,68,68,0.3)' }}
            >
              <LogOut className="w-4 h-4 me-2" style={{ display: 'inline' }} />
              Sign Out Now
            </button>
          </div>
        </div>
      </div>

      {/* Version badge */}
      <div className="text-center mt-4">
        <span className="badge rounded-pill bg-slate-100 text-slate-400 fw-semibold px-4 py-2"
          style={{ fontSize: '11px', letterSpacing: '0.05em', background: '#F1F5F9', color: '#94A3B8' }}>
          Abrar's Furniture ERP — v2.0 · Shadra Main Branch
        </span>
      </div>
    </div>
  );
}

export default Profile;
