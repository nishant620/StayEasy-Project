// const mongoose = require('mongoose');
// const initdata = require('./data.js');
// const Listing = require('../models/listing.js');

// const MONGO_URL = 'mongodb://localhost:27017/wanderlust';
// main().then(() => {
//     console.log('Connected to DB');
// }).catch(err => {
//     console.error('Error connecting to MongoDB:', err);
// });
// async function main() {
//     await mongoose.connect(MONGO_URL);
// }

// const initDB = async () => {
//   await Listing.deleteMany({});
//   initdata.data = initdata.data.map((obj)=>({...obj,owner:'68b2f0f47e3e50aba5561eb1'}));
//   await Listing.insertMany(initdata.data);
//   console.log("Database initialized with seed data");
// }

// initDB();

require('dotenv').config();
const axios = require('axios');

const mongoose = require('mongoose');
const initdata = require('./data.js');
const Listing = require('../models/listing.js');

const MONGO_URL = 'mongodb://localhost:27017/wanderlust';


main().then(() => console.log('Connected to DB'))
     .catch(err => console.error('Error connecting to MongoDB:', err));

async function main() {
  await mongoose.connect(MONGO_URL);
}

const geocodeLocation = async (location) => {
  const mapboxToken = process.env.MAP_TOKEN;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${mapboxToken}`;
  const resp = await axios.get(url);
  if (resp.data.features && resp.data.features.length) {
    return resp.data.features[0].geometry; // { type: 'Point', coordinates: [lng, lat] }
  }
  // fallback if not found
  return { type: 'Point', coordinates: [0, 0] };
};

const initDB = async () => {
  await Listing.deleteMany({});
  const seedData = [];

  for (const obj of initdata.data) {
    const geometry = await geocodeLocation(`${obj.location}, ${obj.country}`);
    seedData.push({
      ...obj,
      owner: '68b2f0f47e3e50aba5561eb1',
      geometry // e.g. { type: 'Point', coordinates: [lng, lat] }
    });
  }

  await Listing.insertMany(seedData);
  console.log('Database initialized with seed data including geometry');
  mongoose.connection.close();
};

initDB();
