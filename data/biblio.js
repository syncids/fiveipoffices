const axios = require('axios');
const _ = require('lodash');
const getDb = require('../mongodb-client');
const cheerio = require('cheerio');

async function search(appNumber, { getRawData } = {}) {
  const { country, number } = extractCountryAndNumber(appNumber);

  const espacenetData = await searchEspacenet(country, number);

  if (getRawData) return espacenetData;

  const appData = processEspacenetData(country, number, espacenetData);

  return appData;
}

async function searchEspacenet(country, number) {
  const query = {
    q: `PN=${country} AND (NUM=${country}${number} OR NUM=${number})`
  };

  const db = await getDb();
  const cachedResponseCol = await db.collection('espacenet-biblio-response');
  let cachedResponse = await cachedResponseCol.findOne(query);

  if (cachedResponse) {
    return cachedResponse.data;
  }

  try {
    const response = await axios({
      baseURL: 'https://worldwide.espacenet.com/3.2/rest-services',
      url: '/published-data/search/biblio',
      headers: { accept: 'application/xml' },
      params: query
    });

    const { data } = response;
    await cachedResponseCol.insertOne(Object.assign({}, query, { data }));

    return data;
  } catch (e) {
    console.log(`Error processing appNumber: ${country}${number}\n`, e.message);
    return null;
  }
}

function extractCountryAndNumber(inputStr) {
  const re = /^([a-zA-Z]+)(\d+.*)$/;
  const execRes = re.exec(inputStr);
  if (execRes) {
    return {
      country: execRes[1],
      number: execRes[2].replace(/[.-]/g, '')
    };
  }
}

function processEspacenetData(country, number, data) {
  const $ = cheerio.load(data);

  const $matchingExchangeDoc = findMatchingDocument(country, number, $);

  return {
    familyId: $matchingExchangeDoc.attr('family-id'),
    country: $matchingExchangeDoc.attr('country'),
    docNumber: $matchingExchangeDoc.attr('doc-number'),
    kind: $matchingExchangeDoc.attr('kind')
    // docIds: _.get(exchangeDocument, [
    //   'bibliographic-data',
    //   'publication-reference',
    //   'document-id'
    // ]).map(mapDocId)
  };
}

function findMatchingDocument(country, number, $) {
  const exchangeDocs = $('exchange-documents > exchange-document');

  if (exchangeDocs.length === 1) {
    return exchangeDocs.first();
  }

  const matchByDocument = $(
    `exchange-document[country="${country}"][doc-number="${number}"]`
  );

  if (matchByDocument.length) return matchByDocument.first();

  const matchByApplicationRef = $(
    `exchange-document[country="${country}"] bibliographic-data > application-reference > document-id[document-id-type="original"] doc-number`
  )
    .filter((i, el) => $(el).text() === number)
    .closest('exchange-document');

  if (matchByApplicationRef.length) return matchByApplicationRef.first();
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
