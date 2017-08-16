const Koa = require('koa');
const getDetails = require('./get-details');
const port = process.env.PORT || 3002;
const app = new Koa();

app.use(getDetails);

app.listen(port, err => {
  console.log('Listening on', port);
});
