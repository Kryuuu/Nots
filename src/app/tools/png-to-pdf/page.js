"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { jsPDF } from 'jspdf';
import Swal from 'sweetalert2';

export default function PngToPdf() {
  const [files, setFiles] = useState([]);
  const [pdfName, setPdfName] = useState('converted');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getBaseName = (filename) => {
    return filename.replace(/\.[^/.]+$/, "");
  };

  const handleFiles = (newFiles) => {
    const validFiles = Array.from(newFiles).filter(file => file.type.startsWith('image/'));
    if (validFiles.length > 0) {
      if (files.length === 0) {
        setPdfName(getBaseName(validFiles[0].name));
      }
      
      const newFilesWithPreview = validFiles.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file)
      }));
      
      setFiles(prev => [...prev, ...newFilesWithPreview]);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      if (newFiles.length > 0) {
        setPdfName(getBaseName(newFiles[0].name));
      } else {
        setPdfName("converted");
      }
      return newFiles;
    });
  };

  const clearAll = () => {
    files.forEach(f => URL.revokeObjectURL(f.preview));
    setFiles([]);
    setPdfName("converted");
  };

  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const generatePdf = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    try {
      let pdf;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imgData = await readFileAsDataURL(file);
        const img = await loadImage(imgData);

        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        const format = file.type === 'image/png' ? 'PNG' : 'JPEG';
        const orientation = imgWidth > imgHeight ? 'l' : 'p';

        if (i === 0) {
          pdf = new jsPDF({ orientation: orientation, unit: 'mm', format: 'a4' });
        } else {
          pdf.addPage('a4', orientation);
        }

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
        const scaledWidth = imgWidth * ratio;
        const scaledHeight = imgHeight * ratio;

        const x = (pageWidth - scaledWidth) / 2;
        const y = (pageHeight - scaledHeight) / 2;

        pdf.addImage(imgData, format, x, y, scaledWidth, scaledHeight);
      }

      let filename = pdfName.trim();
      if (!filename) filename = "converted";
      filename = filename.replace(/\.pdf$/i, "");

      pdf.save(filename + ".pdf");
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'File PDF berhasil dibuat dan diunduh.',
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#10b981'
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Terjadi kesalahan saat membuat PDF: ' + error.message,
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Cleanup previews when component unmounts
  useEffect(() => {
    return () => {
      files.forEach(f => URL.revokeObjectURL(f.preview));
    };
  }, [files]);

  return (
    <main className="container" style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{ 
          display: 'inline-flex', alignItems: 'center', gap: '8px', 
          color: 'var(--text-secondary)', textDecoration: 'none',
          padding: '8px 14px', background: 'var(--card-border)',
          borderRadius: '8px', fontSize: '0.9rem', transition: 'all 0.2s'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Kembali ke Dashboard
        </Link>
      </div>
      
      <header className="header" style={{ marginBottom: '2rem' }}>
        <h1 className="title" style={{ fontSize: '2.5rem' }}>PNG to PDF</h1>
        <p className="subtitle">Pilih file PNG atau gambar lain untuk digabungkan menjadi satu dokumen PDF.</p>
      </header>

      <div style={{ 
        background: 'var(--card-bg)', border: '1px solid var(--card-border)', 
        borderRadius: '1.5rem', padding: '2rem', backdropFilter: 'blur(12px)'
      }}>
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={onDrop}
          style={{
            border: `2px dashed ${isDragOver ? 'var(--purple)' : 'var(--card-border)'}`,
            background: isDragOver ? 'var(--purple-glow)' : 'rgba(15, 23, 42, 0.4)',
            borderRadius: '1rem', padding: '3rem 2rem', textAlign: 'center',
            cursor: 'pointer', transition: 'all 0.3s ease', marginBottom: '2rem'
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.25rem', fontFamily: 'var(--font-outfit)' }}>Klik atau Drag & Drop Gambar di Sini</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Mendukung PNG, JPG, JPEG</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            multiple 
            accept="image/png, image/jpeg, image/jpg" 
            style={{ display: 'none' }} 
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {files.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {files.map((file, idx) => (
                <div key={idx} style={{ 
                  background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--card-border)', 
                  borderRadius: '0.75rem', overflow: 'hidden', position: 'relative'
                }}>
                  <img src={file.preview} alt="preview" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                  <div style={{ padding: '0.75rem' }}>
                    <p style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.25rem' }}>{file.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{formatBytes(file.size)}</p>
                  </div>
                  <button 
                    onClick={() => removeFile(idx)}
                    style={{ 
                      position: 'absolute', top: '0.5rem', right: '0.5rem', 
                      background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', 
                      width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--card-border)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', fontWeight: '600' }}>
                Nama File PDF Output
              </label>
              <input 
                type="text" 
                value={pdfName} 
                onChange={e => setPdfName(e.target.value)}
                style={{ 
                  width: '100%', padding: '0.875rem 1rem', background: 'rgba(255, 255, 255, 0.05)', 
                  border: '1px solid var(--card-border)', borderRadius: '0.5rem', 
                  color: '#fff', fontFamily: 'inherit', fontSize: '1rem', outline: 'none'
                }}
                placeholder="Masukkan nama file..."
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={clearAll} style={{ 
                flex: 1, padding: '1rem', background: 'transparent', border: '1px solid var(--danger)', 
                color: 'var(--danger)', borderRadius: '0.75rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s'
              }}>
                Hapus Semua
              </button>
              <button 
                onClick={generatePdf} 
                disabled={isProcessing}
                style={{ 
                  flex: 2, padding: '1rem', background: 'var(--purple)', color: '#fff', 
                  border: 'none', borderRadius: '0.75rem', fontWeight: '600', cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 14px 0 rgba(168, 85, 247, 0.39)'
                }}
              >
                {isProcessing ? 'Memproses...' : 'Buat PDF Sekarang'}
              </button>
            </div>
            
          </div>
        )}

      </div>
    </main>
  );
}
