import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useAuth, apiFetch, STATUS_LABELS } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/ToastContainer.jsx';
import { Upload, FileCode, XCircle, AlertCircle, CheckCircle } from 'lucide-react';

export default function Submit() {
  const { user, loading } = useAuth();
  const navigate  = useNavigate();
  const toast     = useToast();
  const [file,         setFile]         = useState(null);
  const [name,         setName]         = useState('');
  const [desc,         setDesc]         = useState('');
  const [version,      setVersion]      = useState('1.0.0');
  const [tags,         setTags]         = useState('');
  const [contributors, setContributors] = useState('');
  const [uploading,    setUploading]    = useState(false);
  const [progress,     setProgress]     = useState(0);
  const [step,         setStep]         = useState('');

  const onDrop = useCallback(accepted => {
    if (accepted[0]) { setFile(accepted[0]); if (!name) setName(accepted[0].name.replace('.jar','')); }
  }, [name]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { 'application/java-archive':['.jar'], 'application/octet-stream':['.jar'] },
    maxFiles: 1, maxSize: 100*1024*1024,
    onDropRejected: () => toast.error('Solo .jar fino a 100MB'),
  });

  const handleSubmit = async () => {
    if (!file)        return toast.error('Seleziona un file .jar');
    if (!name.trim()) return toast.error('Inserisci il nome');
    setUploading(true); setProgress(0);
    try {
      setStep('uploading');
      const { uploadUrl, filePath } = await apiFetch('/api/upload-url', {
        method:'POST', body: JSON.stringify({ filename: file.name }),
      });

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable) setProgress(Math.round(e.loaded/e.total*100));
        });
        xhr.addEventListener('load', () => xhr.status < 300 ? resolve() : reject(new Error('Upload fallito')));
        xhr.addEventListener('error', () => reject(new Error('Errore di rete')));
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', 'application/java-archive');
        xhr.send(file);
      });

      setStep('submitting');
      await apiFetch('/api/programs/submit', {
        method:'POST',
        body: JSON.stringify({
          name: name.trim(), description: desc.trim(),
          version: version.trim()||'1.0.0', tags: tags.trim(),
          contributors: contributors.trim(),
          filePath, originalName: file.name, fileSize: file.size,
        }),
      });

      setStep('done');
      toast.success('Inviato! L\'admin lo revisionerà a breve.');
      setTimeout(() => navigate('/'), 2000);
    } catch(e) {
      toast.error(e.message); setStep('');
    } finally { setUploading(false); }
  };

  if (loading) return null;
  if (!user) { navigate('/login'); return null; }

  const sl = STATUS_LABELS[user.user_status];
  const maxP = user.user_status==='whitelisted' ? 5 : user.user_status==='active' ? 2 : null;
  const dropBorder = isDragReject?'var(--danger)':isDragActive?'var(--accent)':file?'var(--success)':'var(--border)';

  return (
    <>
      <div className="page" style={{maxWidth:660}}>
        <div className="fade-up" style={{marginBottom:24}}>
          <h1 style={{fontFamily:'var(--font-mono)',fontSize:26,fontWeight:700}}>
            <span style={{color:'var(--accent)'}}>{'//'} </span>Carica programma
          </h1>
          <p style={{color:'var(--text-muted)',fontSize:12,marginTop:4,fontFamily:'var(--font-mono)'}}>
            Verrà revisionato dall'admin prima di essere pubblicato
          </p>
        </div>

        {/* Banner status */}
        {['whitelisted','admin','superadmin'].includes(user.user_status) && (
          <div style={{...S.banner, borderColor:'rgba(63,185,80,0.3)', background:'rgba(63,185,80,0.06)'}} className="fade-up">
            <CheckCircle size={15} color="var(--success)"/>
            <span style={{fontSize:13,color:'var(--success)'}}>
              Account <strong>{sl?.label}</strong>
              {maxP && ` — max ${maxP} progetti approvati`}
              {!maxP && ' — nessun limite'}
            </span>
          </div>
        )}
        {user.user_status === 'active' && (
          <div style={S.banner} className="fade-up">
            <AlertCircle size={15} color="var(--warning)"/>
            <span style={{fontSize:13,color:'var(--text-secondary)'}}>
              Account <strong style={{color:'var(--warning)'}}>Utente</strong> — max 2 progetti approvati · 1 in revisione alla volta
            </span>
          </div>
        )}

        <div className="card fade-up" style={{padding:24,display:'flex',flexDirection:'column',gap:14,marginTop:14}}>
          {/* Dropzone */}
          <div {...getRootProps()} style={{...S.drop,borderColor:dropBorder,background:isDragActive?'var(--accent-dim)':file?'rgba(63,185,80,0.06)':'var(--bg-base)'}}>
            <input {...getInputProps()}/>
            {file ? (
              <div style={{display:'flex',alignItems:'center',gap:12,width:'100%',flexWrap:'wrap'}}>
                <FileCode size={28} color="var(--success)"/>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontFamily:'var(--font-mono)',fontSize:13,wordBreak:'break-all'}}>{file.name}</p>
                  <p style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>{(file.size/1048576).toFixed(2)} MB</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={e=>{e.stopPropagation();setFile(null);}}>
                  <XCircle size={13}/>Rimuovi
                </button>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,pointerEvents:'none'}}>
                <Upload size={32} color={isDragActive?'var(--accent)':'var(--text-muted)'}/>
                <p style={{fontFamily:'var(--font-mono)',fontSize:13,color:'var(--text-secondary)'}}>
                  {isDragActive ? 'Rilascia il .jar' : 'Trascina il .jar qui'}
                </p>
                <p style={{fontSize:11,color:'var(--text-muted)'}}>o clicca · max 100 MB</p>
              </div>
            )}
          </div>

          {/* Campi */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 120px',gap:10}} className="form-two-col">
            <div style={S.field}>
              <label style={S.label}>Nome *</label>
              <input className="input" placeholder="Nome programma" value={name} onChange={e=>setName(e.target.value)}/>
            </div>
            <div style={S.field}>
              <label style={S.label}>Versione</label>
              <input className="input" placeholder="1.0.0" value={version} onChange={e=>setVersion(e.target.value)}/>
            </div>
          </div>

          <div style={S.field}>
            <label style={S.label}>Descrizione</label>
            <textarea className="textarea" placeholder="Descrivi il programma…" value={desc} onChange={e=>setDesc(e.target.value)} style={{minHeight:70}}/>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}} className="form-two-col">
            <div style={S.field}>
              <label style={S.label}>Tag <span style={{fontWeight:400,color:'var(--text-muted)'}}>( , separati)</span></label>
              <input className="input" placeholder="gioco, utility…" value={tags} onChange={e=>setTags(e.target.value)}/>
            </div>
            <div style={S.field}>
              <label style={S.label}>Collaboratori <span style={{fontWeight:400,color:'var(--text-muted)'}}>( , separati)</span></label>
              <input className="input" placeholder="@utente1, @utente2…" value={contributors} onChange={e=>setContributors(e.target.value)}/>
            </div>
          </div>

          {/* Progress */}
          {uploading && (
            <div>
              <div style={{height:5,background:'var(--bg-elevated)',borderRadius:3,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${progress}%`,background:'linear-gradient(90deg,var(--accent),var(--accent2))',borderRadius:3,transition:'width .2s'}}/>
              </div>
              <p style={{fontSize:11,color:'var(--text-muted)',marginTop:5}}>
                {step==='uploading' ? `Caricamento… ${progress}%` : 'Registrazione…'}
              </p>
            </div>
          )}

          <button className="btn btn-primary" style={{justifyContent:'center'}} onClick={handleSubmit} disabled={uploading||!file}>
            {uploading ? <><span className="spinner" style={{width:15,height:15}}/>Invio…</> : <><Upload size={15}/>Invia per revisione</>}
          </button>
        </div>
      </div>
      <ToastContainer toasts={toast.toasts}/>
    </>
  );
}

const S = {
  banner: { display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'rgba(210,153,34,0.06)', border:'1px solid rgba(210,153,34,0.25)', borderRadius:'var(--radius-md)', marginBottom:0 },
  drop:   { border:'2px dashed', borderRadius:'var(--radius-md)', padding:'24px 16px', cursor:'pointer', transition:'all var(--transition)', minHeight:110, display:'flex', alignItems:'center', justifyContent:'center' },
  field:  { display:'flex', flexDirection:'column', gap:5 },
  label:  { fontSize:11, fontWeight:600, color:'var(--text-secondary)', letterSpacing:'.04em', textTransform:'uppercase' },
};
