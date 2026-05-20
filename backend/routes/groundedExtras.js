// routes/groundedExtras.js — real Merkle tree for a grounding_report
const crypto=require('crypto');
const express=require('express');
const pool=require('../config/database');
const router=express.Router();
function sha(s){ return crypto.createHash('sha256').update(String(s)).digest('hex'); }
router.get('/grounding-reports/:id/merkle-tree', async (req,res)=>{
  try {
    const rep=await pool.query('SELECT * FROM grounding_reports WHERE id=$1',[req.params.id]);
    if(!rep.rows.length) return res.status(404).json({error:'not found'});
    const docTitle=rep.rows[0].document_title;
    const claims=await pool.query('SELECT * FROM claims WHERE document_title=$1 ORDER BY id ASC',[docTitle]);
    let leaves=claims.rows.map(c=>sha(c.claim_text+'|'+c.status));
    if(leaves.length===0) leaves=[sha(docTitle)];
    const levels=[leaves];
    while(levels[levels.length-1].length>1){
      const prev=levels[levels.length-1];
      const next=[];
      for(let i=0;i<prev.length;i+=2){
        const a=prev[i];const b=prev[i+1]||prev[i]; // duplicate last if odd
        next.push(sha(a+b));
      }
      levels.push(next);
    }
    res.json({report_id:Number(req.params.id),root:levels[levels.length-1][0],levels,leaf_count:leaves.length});
  } catch(e){ res.status(500).json({error:e.message}); }
});
module.exports=router;