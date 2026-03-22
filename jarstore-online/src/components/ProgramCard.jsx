import { useState } from 'react';
import { Download, Terminal, HardDrive, Calendar, User } from 'lucide-react';
import { apiFetch } from '../hooks/useAuth.jsx';

const fmtSize = b => b ? (b>=1048576 ? `${(b/1048576).toFixed(1)} MB` : `${(b/1024).toFixed(0)} KB`) : '—';
const fmtDate = s => new Date(s).toLocaleDateString('it-IT',{day:'2-digit',month:'short',year:'numeric'});

export function ProgramCard({ program, onDownload }) {
  const [showHow, setShowHow]         = useState(false);
  const [downloading, setDownloading] = useState(false);
  const tags = program.tags ? program.tags.split(',').map(t=>t.trim()).filter(Boolean) : [];
  const contributors = program.contributors ? program.contributors.split(',').map(t=>t.trim()).filter(Boolean) : [];

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { url } = await apiFetch(`/api/programs/download?id=${program.id}`);
      const a = document.createElement('a');
      a.href = url; a.download = program.original_name; a.click();
      onDownload?.();
    } catch (e) { alert('Errore: ' + e.message); }
    finally { setTimeout(() => setDownloading(false), 1500); }
  };

  return (
    <>
      <div className="card fade-up" style={S.card}>
        <div style={S.header}>
          <div style={S.icon}>☕</div>
          <div style={{flex:1,minWidth:0}}>
            <h3 style={S.name}>{program.name}</h3>
            <span style={S.ver}>v{program.version}</span>
          </div>
        </div>

        {program.description && <p style={S.desc}>{program.description}</p>}

        {tags.length > 0 && (
          <div style={S.tags}>{tags.map((t,i)=><span key={i} className="badge badge-purple">{t}</span>)}</div>
        )}

        <div className="glow-line" style={{margin:'12px 0'}}/>

        {/* Uploader */}
        {program.uploader && (
          <div style={S.uploaderRow}>
            <img src={program.uploader_avatar || 'https://github.com/ghost.png'} style={S.uploaderAvatar} alt=""/>
            <span style={S.uploaderName}>@{program.uploader}</span>
            {contributors.length > 0 && (
              <span style={S.contribs}>+ {contributors.join(', ')}</span>
            )}
          </div>
        )}

        <div style={S.footer}>
          <div style={S.stats}>
            <span style={S.stat}><HardDrive size={12}/>{fmtSize(program.file_size)}</span>
            <span style={S.stat}><Download  size={12}/>{program.download_count}</span>
            <span style={S.stat}><Calendar  size={12}/>{fmtDate(program.created_at)}</span>
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}} className="card-actions">
            <button className="btn btn-ghost btn-sm" onClick={()=>setShowHow(true)}><Terminal size={13}/>Come usare</button>
            <button className="btn btn-primary btn-sm" onClick={handleDownload} disabled={downloading}>
              {downloading ? <span className="spinner" style={{width:13,height:13}}/> : <Download size={13}/>}
              Download
            </button>
          </div>
        </div>
      </div>

      {showHow && (
        <div className="modal-overlay" onClick={()=>setShowHow(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3 style={{fontFamily:'var(--font-mono)',marginBottom:16}}>Come eseguire {program.name}</h3>
            <p style={{color:'var(--text-secondary)',fontSize:14,marginBottom:12}}>Scarica e lancia con Java:</p>
            <code style={{display:'block',padding:'12px',background:'var(--bg-base)',borderRadius:'var(--radius-sm)',fontSize:13,wordBreak:'break-all'}}>
              java -jar {program.original_name}
            </code>
            <p style={{color:'var(--text-muted)',fontSize:12,marginTop:10}}>
              Serve Java: <a href="https://adoptium.net" target="_blank" rel="noreferrer">adoptium.net</a>
            </p>
            <div style={{display:'flex',gap:10,marginTop:20,justifyContent:'flex-end',flexWrap:'wrap'}}>
              <button className="btn btn-ghost btn-sm" onClick={()=>setShowHow(false)}>Chiudi</button>
              <button className="btn btn-primary btn-sm" onClick={()=>{handleDownload();setShowHow(false);}}>
                <Download size={14}/>Scarica ora
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const S = {
  card:          { padding:16, display:'flex', flexDirection:'column', gap:10 },
  header:        { display:'flex', alignItems:'flex-start', gap:12 },
  icon:          { width:40, height:40, borderRadius:10, background:'var(--bg-elevated)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 },
  name:          { fontFamily:'var(--font-mono)', fontSize:14, fontWeight:700, marginBottom:2, wordBreak:'break-word' },
  ver:           { fontSize:11, color:'var(--accent)', fontFamily:'var(--font-mono)' },
  desc:          { fontSize:13, color:'var(--text-secondary)', lineHeight:1.5 },
  tags:          { display:'flex', flexWrap:'wrap', gap:5 },
  uploaderRow:   { display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' },
  uploaderAvatar:{ width:20, height:20, borderRadius:'50%', border:'1px solid var(--border)', flexShrink:0 },
  uploaderName:  { fontSize:12, color:'var(--text-secondary)', fontFamily:'var(--font-mono)' },
  contribs:      { fontSize:11, color:'var(--text-muted)' },
  footer:        { display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' },
  stats:         { display:'flex', gap:10, flexWrap:'wrap' },
  stat:          { display:'flex', alignItems:'center', gap:3, fontSize:11, color:'var(--text-muted)' },
};
