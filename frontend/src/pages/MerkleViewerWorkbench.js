
import React, { useEffect, useState } from 'react';
const TOKEN_KEY = Object.keys(localStorage).find((k) => k.endsWith('_token')) || 'grounded_claims_token';
const API_BASE = 'http://localhost:4057/api';
export default function MerkleViewerWorkbench(){
  const [reports,setReports]=useState([]);const [pick,setPick]=useState(null);const [tree,setTree]=useState(null);
  useEffect(()=>{fetch(API_BASE+'/grounding-reports',{headers:{Authorization:'Bearer '+localStorage.getItem(TOKEN_KEY)}}).then(r=>r.json()).then(setReports);},[]);
  useEffect(()=>{
    if(!pick) return;
    fetch(API_BASE+'/grounding-reports/'+pick.id+'/merkle-tree',{headers:{Authorization:'Bearer '+localStorage.getItem(TOKEN_KEY)}}).then(r=>r.json()).then(setTree);
  },[pick]);
  return (
    <div>
      <div className="page-header"><div><h2>Merkle Viewer</h2><p>Real SHA-256 Merkle tree over each report's claim list.</p></div></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:16}}>
        <div className="card">
          <h3 style={{margin:'0 0 12px',color:'#cbd5e1'}}>Reports</h3>
          {reports.map(r=>(
            <div key={r.id} onClick={()=>setPick(r)} style={{padding:10,borderRadius:6,marginBottom:4,cursor:'pointer',background:pick&&pick.id===r.id?'#1e293b':'transparent'}}>
              <strong>{r.document_title}</strong>
              <div style={{color:'#94a3b8',fontSize:12}}>score {r.grounding_score}% · {r.status}</div>
            </div>
          ))}
        </div>
        <div className="card">
          <h3 style={{margin:'0 0 12px',color:'#cbd5e1'}}>Merkle tree</h3>
          {!pick&&<div className="empty-state">Pick a report ←</div>}
          {tree&&(
            <div>
              <div style={{padding:12,background:'#0b1424',borderRadius:6,marginBottom:14,fontFamily:'Menlo,monospace',fontSize:11}}>
                <div style={{color:'#94a3b8'}}>root</div>
                <div style={{color:'#a78bfa',wordBreak:'break-all',marginTop:4}}>{tree.root}</div>
              </div>
              {tree.levels && tree.levels.map((lvl,i)=>(
                <div key={i} style={{marginBottom:10}}>
                  <div style={{color:'#94a3b8',fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Level {i} ({lvl.length})</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {lvl.map((h,j)=>(<span key={j} className="ai-tag" style={{fontFamily:'Menlo,monospace',fontSize:10}}>{String(h).slice(0,16)}…</span>))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}