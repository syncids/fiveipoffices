const axios = require('axios');
const cheerio = require('cheerio');
const _ = require('lodash');
const getDb = require('../mongodb-client');

async function get(familyId, { getRawData } = {}) {
  const espacenetData = await searchEspacenet(familyId);

  if (getRawData) return espacenetData;

  const familyData = processEspacenetData(espacenetData);

  return familyData;
}

async function searchEspacenet(familyId) {
  const query = {
    familyId
  };

  const db = await getDb();
  const cachedResponseCol = await db.collection('espacenet-family-response');
  let cachedResponse = await cachedResponseCol.findOne(query);

  if (cachedResponse) {
    return JSON.parse(cachedResponse.data);
  }

  try {
    const response = await axios({
      baseURL: 'https://worldwide.espacenet.com/3.2/rest-services',
      headers: { accept: 'application/xml' },
      url: `/family/simple/${familyId}?ccd`
    });

    const { data } = response;

    await cachedResponseCol.insertOne(
      Object.assign({}, query, { data: JSON.stringify(data) })
    );

    return data;
  } catch (e) {
    console.log(`Error processing family: ${familyId}\n`, e.message);
    return null;
  }
}

function processEspacenetData(espacenetData) {
  const $ = cheerio.load(espacenetData);

  const familyMembers = $(`ccd\\:ccd ccd\\:ccd-member`)
    .map((i, el) => {
      const $el = $(el);
      const country = $el.attr('country');

      const member = { country };

      const $docdbId = $('[document-id-type="docdb"]', $el).first();
      if ($docdbId) {
        member.docdbNumber = `${country}${$('doc-number', $docdbId).text()}`;
      }
      const $origId = $('[document-id-type="original"]', $el).first();
      if ($origId) {
        member.originalNumber = `${country}${$('doc-number', $origId).text()}`;
      }

      return member;
    })
    .get()
    .sort((a, b) => a.country.localeCompare(b.country));

  return familyMembers;
}

module.exports = { get };
