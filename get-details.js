const Router = require('koa-router');
const getDb = require('./mongodb-client');
const _ = require('lodash');

const biblio = require('./data/biblio');

const router = new Router();

router.get('/family/:appNumber', getDetails);

async function getDetails(ctx) {
  const { appNumber } = ctx.params;
  const data = await biblio.search(appNumber);
  ctx.body = { data };
}

module.exports = router.routes();
