const buildCrud = require('./_crudFactory');
module.exports = buildCrud({
  table: 'sources',
  fields: ['corpus_id','url','title','publisher','author','published_at','retrieved_at','sha256','license','credibility_score','notes'],
});
