const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

// Set response
function setResponse(travProds, rates) {
  return `<h2>${travProds} has ${rates} Github repos</h2>`;
}

// Make request to Travel Pricing for data
async function getProds(req, res, next) {
  try {
    console.log('Fetching Data...');

    const { travProds } = req.params;

    const response = await fetch(`https://api.trekkerq.com/plans/${travProds}`);

    const data = await response.json();

    const rates = data.public_rates;

    // Set pricing data to Redis
    client.setex(travProds, 3600, rates);

    res.send(setResponse(travProds, rates));
  } catch (err) {
    console.error(err);
    res.status(500);
  }
}

// Cache middleware
function cache(req, res, next) {
  const { travProds } = req.params;

  client.get(travProds, (err, data) => {
    if (err) throw err;

    if (data !== null) {
      res.send(setResponse(travprods, data));
    } else {
      next();
    }
  });
}

app.get('/rates/:travProds', cache, getPlans);

app.listen(5000, () => {
  console.log(`App listening on port ${PORT}`);
});
