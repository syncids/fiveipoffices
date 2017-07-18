const Koa = require('koa');
const getDetails = require('./get-details');

const app = new Koa();

app.use(getDetails);

app.listen(3002, err => {
  console.log('Listening on', 3002);
});
