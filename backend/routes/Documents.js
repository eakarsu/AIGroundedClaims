const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'documents', fields: ['title','source','sha256','status','page_count','notes'] });
