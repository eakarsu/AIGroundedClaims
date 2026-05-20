const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'source_corpora', fields: ['name','doc_count','status'] });
