"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Add mouse movement tracking for card glow effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      const cards = document.querySelectorAll('.card');
      for (const card of cards) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRBClick = (e) => {
    e.preventDefault();
    setIsModalOpen(true);
    setPassword('');
  };

  const submitPassword = async () => {
    if (!password) return;
    setLoading(true);

    try {
      const encoder = new TextEncoder();
      const keyData = await crypto.subtle.digest('SHA-256', encoder.encode(password));
      const keyBytes = new Uint8Array(keyData);
      
      const cipher = [137, 234, 179, 70, 244, 68, 125, 213, 59, 69, 136, 155, 134, 177, 139, 106, 129, 56, 140, 144, 185, 246, 184, 223, 109];
      
      let result = "";
      for (let i = 0; i < cipher.length; i++) {
        result += String.fromCharCode(cipher[i] ^ keyBytes[i % keyBytes.length]);
      }
      
      if (result.startsWith("pages/rb_secret_")) {
        setIsModalOpen(false);
        showToast('success', 'Akses Diberikan! Membuka folder rahasia...');
        setTimeout(() => {
          window.location.href = result; // Redirect to secret URL
        }, 1500);
      } else {
        showToast('error', 'Password yang Anda masukkan salah!');
        setLoading(false);
      }
    } catch (err) {
      showToast('error', 'Terjadi kesalahan saat memverifikasi.');
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <header className="header">
        <h1 className="title">Nota Builder Pro</h1>
        <p className="subtitle">Pilih template nota yang ingin Anda buat hari ini.</p>
      </header>

      <div className="grid">
        {/* RB Folder Card */}
        <a href="#" className="card red" onClick={handleRBClick}>
          <div className="card-icon red">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              <rect x="8" y="10" width="8" height="6" rx="1"></rect>
              <path d="M12 13v1"></path>
            </svg>
          </div>
          <h2>RB Folder</h2>
          <p>Kumpulan template khusus rahasia (Butuh Password).</p>
          <div className="card-action">Buka Folder &rarr;</div>
        </a>

        {/* PNG to PDF Card */}
        <Link href="/tools/png-to-pdf" className="card purple">
          <div className="card-icon purple">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <path d="M14 2v6h6"></path>
              <path d="M12 18v-6"></path>
              <path d="M9 15l3 3 3-3"></path>
            </svg>
          </div>
          <h2>PNG to PDF</h2>
          <p>Konversi banyak gambar PNG menjadi satu file PDF dengan mudah.</p>
          <div className="card-action">Buka Alat &rarr;</div>
        </Link>

        {/* Speech to Text Card */}
        <Link href="/speech-to-text" className="card indigo">
          <div className="card-icon indigo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </div>
          <h2>Speech to Text</h2>
          <p>Konversi MP4, MP3, atau rekaman suara menjadi teks dengan akurasi tinggi.</p>
          <div className="card-action">Buka Alat &rarr;</div>
        </Link>
      </div>

      {/* Password Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target.className === 'modal-overlay') setIsModalOpen(false);
        }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Akses Terkunci
              </h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p>Silakan masukkan password untuk mengakses folder rahasia ini.</p>
              <div className="input-group">
                <input 
                  type="password" 
                  className="input-field"
                  placeholder="Masukkan password..." 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitPassword(); }}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-cancel" onClick={() => setIsModalOpen(false)}>Batal</button>
              <button className="btn btn-submit" onClick={submitPassword} disabled={loading}>
                {loading ? 'Memeriksa...' : 'Masuk'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`toast show ${toast.type}`}>
          <div className="toast-icon">
            {toast.type === 'success' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            )}
          </div>
          <span>{toast.message}</span>
        </div>
      )}
    </main>
  );
}
