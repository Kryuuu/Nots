"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';

export default function SpeechToText() {
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [language, setLanguage] = useState('id');
  const [micLanguage, setMicLanguage] = useState('id-ID');
  const [contextPrompt, setContextPrompt] = useState('');
  
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  
  const [isRecording, setIsRecording] = useState(false);
  const [fullTranscript, setFullTranscript] = useState('');
  const [stats, setStats] = useState({ words: 0, chars: 0, duration: 0 });
  const [paragraphs, setParagraphs] = useState([]);
  
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const resultAreaRef = useRef(null);

  const CHUNK_DURATION_SEC = 240;
  const MAX_CHUNK_BYTES = 24 * 1024 * 1024;

  useEffect(() => {
    const savedKey = localStorage.getItem('groq_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleKeyChange = (e) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem('groq_api_key', val);
  };

  const handleFile = (file) => {
    setSelectedFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const formatStats = (text, dur) => {
    if (!text) {
      setStats({ words: 0, chars: 0, duration: 0 });
      return;
    }
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    setStats({ words, chars: text.length, duration: Math.round(dur || 0) });
  };

  const formatResult = (text) => {
    if (!text) { setParagraphs([]); return; }
    const sentences = text.match(/[^.!?]*[.!?]+[\s]*/g) || [text];
    const parasSize = Math.max(3, Math.min(5, Math.ceil(sentences.length / 4)));
    const newParas = [];
    for (let i = 0; i < sentences.length; i += parasSize) {
      newParas.push(sentences.slice(i, i + parasSize));
    }
    setParagraphs(newParas);
    setTimeout(() => {
      if (resultAreaRef.current) {
        resultAreaRef.current.scrollTop = resultAreaRef.current.scrollHeight;
      }
    }, 100);
  };

  // Audio helpers
  const decodeAudioFile = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    audioCtx.close();
    return audioBuffer;
  };

  const writeString = (view, offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  const audioBufferToWav = (audioBuffer, startSample, endSample) => {
    const sampleRate = audioBuffer.sampleRate;
    const length = endSample - startSample;
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);
    const channelData = audioBuffer.getChannelData(0);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, length * 2, true);

    let offset = 44;
    for (let i = startSample; i < endSample; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  };

  const splitAudioToChunks = (audioBuffer) => {
    const sampleRate = audioBuffer.sampleRate;
    const totalSamples = audioBuffer.length;
    const chunkSamples = CHUNK_DURATION_SEC * sampleRate;
    const chunks = [];
    const totalWavSize = 44 + totalSamples * 2;
    
    if (totalWavSize <= MAX_CHUNK_BYTES) {
      chunks.push(audioBufferToWav(audioBuffer, 0, totalSamples));
      return chunks;
    }

    for (let start = 0; start < totalSamples; start += chunkSamples) {
      const end = Math.min(start + chunkSamples, totalSamples);
      chunks.push(audioBufferToWav(audioBuffer, start, end));
    }
    return chunks;
  };

  const transcribeChunk = async (blob, apiKeyStr, langStr, chunkIndex, promptStr, retries = 2) => {
    const formData = new FormData();
    const fileName = blob.name || `chunk_${chunkIndex}.wav`;
    formData.append('file', blob, fileName);
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'verbose_json');
    formData.append('temperature', '0');
    if (langStr !== 'auto') formData.append('language', langStr);
    if (promptStr) formData.append('prompt', promptStr);

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const resp = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + apiKeyStr },
          body: formData
        });

        if (resp.status === 429) {
          const wait = (attempt + 1) * 3000;
          await new Promise(r => setTimeout(r, wait));
          continue;
        }

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error?.message || `HTTP ${resp.status}`);
        }

        return await resp.json();
      } catch(e) {
        if (attempt < retries && !e.message.includes('API key')) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        throw e;
      }
    }
  };

  const startTranscription = async () => {
    if (!apiKey) {
      Swal.fire({ icon: 'error', title: 'Oops...', text: 'Masukkan Groq API Key dulu!', background: '#1e293b', color: '#fff' });
      return;
    }
    if (!selectedFile) return;

    setIsTranscribing(true);
    setProgress(0);
    setFullTranscript('');
    setParagraphs([]);
    let currentText = '';

    try {
      if (selectedFile.size <= MAX_CHUNK_BYTES) {
        setStatusText('📤 Mengunggah dan memproses audio...');
        setProgress(40);
        const data = await transcribeChunk(selectedFile, apiKey, language, 0, contextPrompt);
        setProgress(100);
        currentText = data.text || '';
        setFullTranscript(currentText);
        formatResult(currentText);
        formatStats(currentText, data.duration);
        setStatusText(`✅ Selesai! Durasi: ${Math.round(data.duration||0)}s`);
        Swal.fire({ icon: 'success', title: 'Berhasil', background: '#1e293b', color: '#fff', timer: 1500, showConfirmButton: false });
        return;
      }

      setStatusText('🔄 Mendekode audio...');
      setProgress(10);
      const audioBuffer = await decodeAudioFile(selectedFile);
      setStatusText(`🔪 Memotong audio menjadi bagian-bagian kecil...`);
      setProgress(20);
      const chunks = splitAudioToChunks(audioBuffer);
      
      let totalDur = 0;
      let lastText = '';
      
      for (let i = 0; i < chunks.length; i++) {
        setStatusText(`🎯 Memproses bagian ${i + 1} dari ${chunks.length}...`);
        setProgress(20 + ((i / chunks.length) * 75));
        
        const cPrompt = [contextPrompt, lastText].filter(Boolean).join('. ');
        const data = await transcribeChunk(chunks[i], apiKey, language, i, cPrompt);
        
        const t = (data.text || '').trim();
        if (t) {
          currentText += (currentText ? ' ' : '') + t;
          setFullTranscript(currentText);
          formatResult(currentText);
          lastText = t.slice(-200);
        }
        totalDur += (data.duration || 0);
        formatStats(currentText, totalDur);
        
        if (i < chunks.length - 1) {
          setStatusText(`⏳ Menunggu sebentar...`);
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      setProgress(100);
      setStatusText(`✅ Selesai diproses!`);
      Swal.fire({ icon: 'success', title: 'Berhasil', background: '#1e293b', color: '#fff', timer: 1500, showConfirmButton: false });

    } catch (err) {
      setStatusText('❌ Error: ' + err.message);
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message, background: '#1e293b', color: '#fff' });
    } finally {
      setIsTranscribing(false);
      setTimeout(() => setProgress(0), 3000);
    }
  };

  const toggleMic = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      Swal.fire({ icon: 'error', title: 'Tidak Didukung', text: 'Browser tidak mendukung Speech Recognition.', background: '#1e293b', color: '#fff' });
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SR();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = micLanguage;

    let localFull = fullTranscript;

    recognitionRef.current.onresult = (e) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      if (final) {
        localFull += final;
        setFullTranscript(localFull);
        formatResult(localFull);
        formatStats(localFull, 0);
      }
      if (interim) {
        setParagraphs(prev => {
           // just a rough preview
           const lastPara = [[interim]];
           return prev.length ? [...prev.slice(0, prev.length-1), ...lastPara] : lastPara;
        });
      }
    };
    
    recognitionRef.current.onerror = (e) => {
      console.error(e);
      if (isRecording) {
         if (recognitionRef.current) recognitionRef.current.stop();
         setIsRecording(false);
      }
    };
    recognitionRef.current.onend = () => {
      if (isRecording) recognitionRef.current.start();
    };
    
    recognitionRef.current.start();
    setIsRecording(true);
  };

  const copyResult = () => {
    if (!fullTranscript) return;
    navigator.clipboard.writeText(fullTranscript).then(() => {
      Swal.fire({ icon: 'success', title: 'Teks Disalin', background: '#1e293b', color: '#fff', timer: 1000, showConfirmButton: false });
    });
  };

  const downloadResult = () => {
    if (!fullTranscript) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([fullTranscript],{type:'text/plain'}));
    a.download = 'transkripsi.txt';
    a.click();
  };

  const clearResult = () => {
    setFullTranscript('');
    setParagraphs([]);
    setStats({ words: 0, chars: 0, duration: 0 });
  };

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

      <header className="header" style={{ marginBottom: '2.5rem' }}>
        <h1 className="title" style={{ fontSize: '2.5rem' }}>🎙️ Speech to Text</h1>
        <p className="subtitle">Konversi audio/video menjadi teks dengan akurat menggunakan AI</p>
      </header>

      <div style={{ 
        background: 'var(--card-bg)', border: '1px solid var(--card-border)', 
        borderRadius: '1.5rem', padding: '1.5rem', backdropFilter: 'blur(12px)', marginBottom: '1.5rem'
      }}>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => setActiveTab('upload')}
            style={{ 
              flex: 1, padding: '12px', background: activeTab === 'upload' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'upload' ? '#fff' : 'var(--text-secondary)', border: activeTab === 'upload' ? 'none' : '1px solid var(--card-border)',
              borderRadius: '10px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit'
            }}
          >📁 Upload File</button>
          <button 
            onClick={() => setActiveTab('mic')}
            style={{ 
              flex: 1, padding: '12px', background: activeTab === 'mic' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'mic' ? '#fff' : 'var(--text-secondary)', border: activeTab === 'mic' ? 'none' : '1px solid var(--card-border)',
              borderRadius: '10px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit'
            }}
          >🎤 Mikrofon Live</button>
        </div>

        {activeTab === 'upload' && (
          <div>
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              style={{
                border: `2px dashed var(--accent-glow)`, background: 'rgba(99, 102, 241, 0.05)',
                borderRadius: '1rem', padding: '2rem', textAlign: 'center', cursor: 'pointer', marginBottom: '1rem'
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" style={{ marginBottom: '10px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <h3 style={{ color: 'var(--primary)', marginBottom: '4px' }}>Klik atau Drag & Drop File</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Mendukung MP3, MP4, WAV, OGG, WebM</p>
              <input type="file" ref={fileInputRef} accept="audio/*,video/*" style={{ display: 'none' }} onChange={(e) => { if(e.target.files[0]) handleFile(e.target.files[0]) }} />
            </div>

            {selectedFile && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{selectedFile.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{(selectedFile.size/1024/1024).toFixed(2)} MB</div>
                </div>
                <button onClick={() => setSelectedFile(null)} style={{ background: 'var(--danger-glow)', color: 'var(--danger)', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Hapus</button>
              </div>
            )}

            <select value={language} onChange={e => setLanguage(e.target.value)} style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: '#fff', borderRadius: '8px', marginBottom: '1rem', fontFamily: 'inherit', outline: 'none' }}>
              <option value="id" style={{ background: '#1e293b' }}>🇮🇩 Bahasa Indonesia</option>
              <option value="en" style={{ background: '#1e293b' }}>🇬🇧 English</option>
              <option value="auto" style={{ background: '#1e293b' }}>🌐 Auto Detect</option>
            </select>

            <input type="text" value={contextPrompt} onChange={e => setContextPrompt(e.target.value)} placeholder="💡 Konteks opsional: nama, istilah, topik..." style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: '#fff', borderRadius: '8px', marginBottom: '1rem', fontFamily: 'inherit', outline: 'none' }} />

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '1rem' }}>
              <input type="password" value={apiKey} onChange={handleKeyChange} placeholder="🔑 Groq API Key (gsk_...)" style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: '#fff', borderRadius: '8px', fontFamily: 'inherit', outline: 'none' }} />
            </div>

            <button onClick={startTranscription} disabled={isTranscribing || !selectedFile} style={{ width: '100%', padding: '14px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: (isTranscribing || !selectedFile) ? 'not-allowed' : 'pointer', opacity: (isTranscribing || !selectedFile) ? 0.7 : 1, transition: 'all 0.2s' }}>
              {isTranscribing ? 'Memproses...' : 'Mulai Transkripsi'}
            </button>

            {progress > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ width: '100%', height: '6px', background: 'var(--card-border)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s' }}></div>
                </div>
                <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>{statusText}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'mic' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <button 
              onClick={toggleMic}
              style={{ 
                width: '80px', height: '80px', borderRadius: '50%', border: 'none',
                background: isRecording ? 'var(--danger)' : 'var(--primary)', color: '#fff',
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isRecording ? '0 0 0 8px var(--danger-glow)' : '0 4px 20px rgba(99,102,241,0.3)',
                transition: 'all 0.3s'
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
            <div style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>{isRecording ? 'Merekam... Klik untuk berhenti' : 'Klik untuk mulai merekam'}</div>
            <select value={micLanguage} onChange={e => setMicLanguage(e.target.value)} style={{ marginTop: '1rem', padding: '8px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: '#fff', borderRadius: '8px', fontFamily: 'inherit', outline: 'none' }}>
              <option value="id-ID" style={{ background: '#1e293b' }}>🇮🇩 Bahasa Indonesia</option>
              <option value="en-US" style={{ background: '#1e293b' }}>🇬🇧 English</option>
            </select>
          </div>
        )}
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '1.5rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--card-border)' }}>
          <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>📝 Hasil Transkripsi</h2>
          {stats.words > 0 && (
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>📊 {stats.words} kata</span>
              <span>🔤 {stats.chars} karakter</span>
            </div>
          )}
        </div>
        
        <div ref={resultAreaRef} style={{ minHeight: '200px', maxHeight: '500px', overflowY: 'auto', padding: '1.5rem', color: 'var(--text-primary)', lineHeight: '1.8' }}>
          {paragraphs.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0', fontStyle: 'italic' }}>Hasil transkripsi akan muncul di sini...</div>
          ) : (
            paragraphs.map((para, i) => (
              <p key={i} style={{ marginBottom: '1rem' }}>
                {para.map((sentence, j) => (
                  <span key={j} style={{ padding: '0 2px', borderRadius: '3px', transition: 'background 0.2s' }}>{sentence} </span>
                ))}
              </p>
            ))
          )}
        </div>
        
        <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--card-border)', display: 'flex', gap: '10px' }}>
          <button onClick={copyResult} style={{ padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Salin Teks</button>
          <button onClick={downloadResult} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--card-border)', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Download .txt</button>
          <button onClick={clearResult} style={{ padding: '8px 16px', background: 'transparent', color: 'var(--danger)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', marginLeft: 'auto' }}>Hapus</button>
        </div>
      </div>
    </main>
  );
}
