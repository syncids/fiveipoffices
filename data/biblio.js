const axios = require('axios');
const _ = require('lodash');
const getDb = require('../mongodb-client');

async function search(appNumber) {
  const db = await getDb();
  const biblioCol = await db.collection('biblio');
  const appData = await searchEspacenet(appNumber);
  await biblioCol.insertOne(appData);
  return appData;
}

async function searchEspacenet(appNumber) {
  console.log('searching ---------------', appNumber);
  try {
    const response = await axios({
      baseURL: 'https://worldwide.espacenet.com/3.2/rest-services',
      url: '/published-data/search/biblio/.json',
      params: {
        q: `num=${appNumber}`
      }
    });

    const appData = processEspacenetData(response.data);
    return appData;
  } catch (e) {
    console.log(`Error processing appNumber: ${appNumber}\n`, e);
    return null;
  }
}

function processEspacenetData(data) {
  const searchResult = _.get(data, [
    'ops:world-patent-data',
    'ops:biblio-search'
  ]);
  const resultCount = parseInt(searchResult['@total-result-count']);
  console.log(searchResult);
  if (resultCount !== 1) throw new Error('Too many resuls found');

  const exchangeDocument = _.get(searchResult, [
    'ops:search-result',
    'exchange-documents',
    'exchange-document'
  ]);

  return {
    familyId: exchangeDocument['@family-id'],
    country: exchangeDocument['@country'],
    docNumber: exchangeDocument['@doc-number'],
    kind: exchangeDocument['@kind'],
    docIds: _.get(exchangeDocument, [
      'bibliographic-data',
      'publication-reference',
      'document-id'
    ]).map(mapDocId)
  };
}

function mapDocId(espaceNetDocId) {
  const docId = {
    type: espaceNetDocId['@document-id-type'],
    country: _.get(espaceNetDocId, ['country', '$']),
    docNumber: _.get(espaceNetDocId, ['doc-number', '$']),
    kind: _.get(espaceNetDocId, ['kind', '$']),
    date: _.get(espaceNetDocId, ['date', '$'])
  };
  return _.omitBy(docId, _.isUndefined);
}

module.exports = { search };
