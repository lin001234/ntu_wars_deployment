// utils/checkToxicity.js
const { google } = require('googleapis');

const API_KEY = process.env.GOOGLE_API_KEY;
const DISCOVERY_URL =
  'https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1';

let clientPromise = null;

async function loadClient() {
  if (!clientPromise) {
    clientPromise = google.discoverAPI(DISCOVERY_URL);
  }
  return clientPromise;
}

async function checkToxicity(text) {
  const client = await loadClient();


  const analyzeRequest = {
    comment: { text },
    requestedAttributes: { TOXICITY: {} },
  };

  return new Promise((resolve, reject) => {
    client.comments.analyze(
      { key: API_KEY, resource: analyzeRequest },
      (err, response) => {
        if (err) return reject(err);
        const score =
          response.data.attributeScores.TOXICITY.summaryScore.value;
        resolve(score);
      }
    );
  });
}

module.exports = { checkToxicity };
