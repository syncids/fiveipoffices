const Router = require('koa-router');

const biblio = require('./data/biblio');
const family = require('./data/family');

const router = new Router();

router.get('/biblio/:appNumber', getBiblio);
router.get('/family/:appNumber', getFamily);

async function getBiblio(ctx) {
  const { appNumber } = ctx.params;
  const getRawData = ctx.query.raw !== undefined;

  let data = await biblio.search(appNumber, { getRawData });
  if (getRawData) {
    ctx.set('Content-Disposition', 'inline');
    ctx.type = 'text/xml';
    data = data.replace(/<\?xml-stylesheet.*\?>/, '');
  }
  ctx.body = data;
}

async function getFamily(ctx) {
  const { appNumber } = ctx.params;
  const getRawData = ctx.query.raw !== undefined;

  const appBiblio = await biblio.search(appNumber);

  let data = await family.get(appBiblio.familyId, { getRawData });

  if (getRawData) {
    ctx.set('Content-Disposition', 'inline');
    ctx.type = 'text/xml';
    data = data.replace(/<\?xml-stylesheet.*\?>/, '');
  }
  ctx.body = data;
}

module.exports = router.routes();
