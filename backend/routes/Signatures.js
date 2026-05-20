const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'signatures', fields: ['report_id_ref','signer','signed_at','key_fingerprint','status'] });
