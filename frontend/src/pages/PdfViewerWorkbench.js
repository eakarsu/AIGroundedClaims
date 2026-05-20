
import React, { useEffect, useState } from 'react';
const TOKEN_KEY = Object.keys(localStorage).find((k) => k.endsWith('_token')) || 'grounded_claims_token';
const API_BASE = 'http://localhost:4057/api';
export default function PdfViewerWorkbench(){
  const [docs,setDocs]=useState([]);const [pick,setPick]=useState(null);const [claims,setClaims]=useState([]);
  useEffect(()=>{fetch(API_BASE+'/documents',{headers:{Authorization:'Bearer '+localStorage.getItem(TOKEN_KEY)}}).then(r=>r.json()).then(setDocs);},[]);
  useEffect(()=>{
    if(!pick) return;
    fetch(API_BASE+'/claims',{headers:{Authorization:'Bearer '+localStorage.getItem(TOKEN_KEY)}}).then(r=>r.json()).then(d=>setClaims(d.filter(c=>c.document_title===pick.title)));
  },[pick]);
  const verdictColor=(v)=>v==='supported'?'rgba(16,185,129,0.25)':v==='partial'?'rgba(234,88,12,0.25)':v==='contradicted'?'rgba(220,38,38,0.25)':'rgba(100,116,139,0.25)';
  return (
    <div>
      <div className="page-header"><div><h2>Document Viewer (with real claim highlights)</h2><p>Each claim from the claims table renders its source span color-coded by grounding verdict.</p></div></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:16}}>
        <div className="card">
          <h3 style={{margin:'0 0 12px',color:'#cbd5e1'}}>Documents</h3>
          {docs.map(r=>(
            <div key={r.id} onClick={()=>setPick(r)} style={{padding:10,borderRadius:6,marginBottom:4,cursor:'pointer',background:pick&&pick.id===r.id?'#1e293b':'transparent'}}>
              <div style={{fontWeight:600}}>{r.title}</div>
              <div style={{color:'#94a3b8',fontSize:12}}>{r.page_count} pages · sha {String(r.sha256||'').slice(0,12)}…</div>
            </div>
          ))}
        </div>
        <div className="card">
          <h3 style={{margin:'0 0 12px',color:'#cbd5e1'}}>Preview · {pick?pick.title:'(pick a doc)'}</h3>
          {pick&&(
            <div style={{background:'#0b1424',borderRadius:8,padding:16,color:'#cbd5e1',lineHeight:1.7}}>
              {claims.length===0?<em style={{color:'#64748b'}}>No claims found for this document.</em>:claims.map(c=>(
                <p key={c.id} style={{margin:'0 0 12px'}}>
                  <span style={{background:verdictColor(c.status),padding:'2px 6px',borderRadius:3}}>{c.claim_text}</span>
                  <span style={{color:'#64748b',fontSize:11,marginLeft:8}}>verdict: {c.status}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}