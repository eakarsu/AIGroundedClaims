const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'grounding_reports', fields: ['document_title','grounding_score','merkle_root','status','generated_at'] });
