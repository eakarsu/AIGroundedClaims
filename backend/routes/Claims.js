const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'claims', fields: ['document_title','claim_text','subject','predicate','status'] });
