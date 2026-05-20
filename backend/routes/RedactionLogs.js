const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'redaction_logs', fields: ['document_title','redacted_span','reason','status'] });
