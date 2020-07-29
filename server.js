'use strict';

const server = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

require('dotenv').config();

const app = server();

const client = new pg.Client(process.env.DATABASE_URL);

const PORT = process.env.PORT || 3100;

app.use(cors());

// app.listen(PORT, () => {
//   console.log('Server is listening to port ', PORT);
// });


function Location(city, data) {
  this.search_query = city;
  this.formatted_query = data.formatted_query;
  this.latitude = data.latitude;
  this.longitude = data.longitude;
}

function Weather(city, data){
  this.forecast = data.weather.description;
  this.time = new Date(data.valid_date).toString().slice(0, 15);
  Weather.all.push(this);
}
Weather.all=[];

function Trails(data) {
  this.name = data.name;
  this.location = data.location;
  this.length = data.length;
  this.stars = data.stars;
  this.star_votes = data.starVotes;
  this.summary = data.summary;
  this.trail_url = data.url;
  this.conditions = data.conditionStatus;
  this.condition_date = new Date(data.conditionDate).toLocaleDateString();
  this.condition_time = new Date(data.conditionDate).toLocaleTimeString('en-US', { hour12: false,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'});
  Trails.all.push(this);
}
Trails.all = [];

app.get('/location', handelLocation);

app.get('/weather', handelWeather);

app.get('/trails', handelTrails);

app.all('*', (req, res) => {
  res.status(500).send({ 'status': 500, responseText: 'Sorry, something went wrong'});
});

function dateToString(date) {
  var options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
  options.timeZone = 'UTC';
  options.timeZoneName = 'short';
  return (date.toLocaleDateString('en-US', options));

}

function handelLocation(req, res) {
  let city = req.query.city;
  let reqex = /^[a-zA-Z]+(?:[\s-][a-zA-Z]+)*$/;

  if (!reqex.test(city)) { res.status(422).send({ 'status': 422, msg: 'Please enter a valid city name!'}); }
  if(!city) { res.status(500).send({ 'status': 500, responseText: 'Sorry, something went wrong'}); }

  getData(city).then( returnedData => {
    res.send(returnedData);
  }).catch((err) => {
    console.log(err.message);
  });
  // const data = require('./data/location.json');
  // res.send(locationData);
}

function getData(city){
  let GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
  let url = `https://eu1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${city}&format=json`;

  const SQL = `SELECT * FROM location WHERE search_query=$1;`;
  const values = [city];

  return client.query(SQL, values)
    .then(result => {
      if (result.rowCount > 0) {
        console.log('From SQL');
        let locationData = new Location(city, result.rows[0]);
        return locationData;
      } else {
        return superagent.get(url).then( data => {
          console.log('From location API');

          let locationData = new Location(city, data.body);

          let newSQL = `INSERT INTO location (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING id, search_query, formatted_query, latitude, longitude;`;
          console.log('newSQL', newSQL);
          let newValues = [city, data.body[0].display_name, data.body[0].lat, data.body[0].lon];

          console.log('newValues', newValues);

          // Add the record to the database
          return client.query(newSQL, newValues)
            .then(result => {
              console.log('result.rows', result.rows);

              console.log('result.rows[0].id', result.rows[0].id);
              locationData.formatted_query = result.rows[0].formatted_query;
              locationData.latitude = result.rows[0].latitude;
              locationData.longitude = result.rows[0].longitude;
              locationData.id = result.rows[0].id;
              return locationData;
            })
            .catch(console.error);
        });
      }
    });
}

function handelWeather(req, res) {
  let city = req.query.search_query;

  getWeather(req, city).then( returnedData => {
    console.log('response: ', returnedData);
    res.send(returnedData);
  }).catch((err) => {
    console.log(err.message);
  });
}

function getWeather(req, city) {
  Weather.all = [];

  let WEATHER_API_KEY = process.env.WEATHER_API_KEY;
  let NUMBER_OF_DAY = process.env.NUMBER_OF_DAY;
  let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${req.query.city}&key=${WEATHER_API_KEY}&days=${NUMBER_OF_DAY}`;

  return superagent.get(url).then( data => {
    console.log(data.body.data);
    return data.body.data.map( item => {
      // console.log(item.weather);
      return new Weather(city, item);
    });
  });

  // const SQL = `SELECT * FROM weather WHERE id = $1`;
  // const values = [180];

  // console.log(SQL);
  // return client.query(SQL, values)
  //   .then(result => {
  //     if (result.rowCount > 0) {
  //       console.log('From SQL');

  //       return result.rows.map( item => {
  //         // console.log(item.weather);
  //         return new Weather(city, item);
  //       });
  //     } else {

  //       return superagent.get(url)
  //         .then(result => {
  //           console.log('From weather API');
  //           const weatherSummaries = result.body.data.map(day => {
  //             return new Weather(req.query.city, day);
  //           });

  //           let newSQL = `INSERT INTO weather(forecast, time, location_id) VALUES ($1, $2, $3);`;

  //           console.log('weatherSummaries', weatherSummaries);

  //           weatherSummaries.forEach(summary => {
  //             let newValues = [summary.forecast, summary.time, req.query.city];

  //             return client.query(newSQL, newValues)
  //               .catch(console.error);
  //           });
  //           return weatherSummaries;
  //         })
  //         .catch(error => console.log(error));
  //     }
  //   });
}

function handelTrails(req, res) {
  let latitude = req.query.latitude;
  let longitude = req.query.longitude;

  getTrails(latitude, longitude).then( returnedData => {
    res.send(returnedData);
  }).catch((err) => {
    console.log(err.message);
  });
}

function getTrails(lat, lon) {
  let HIKING_API_KEY = process.env.HIKING_API_KEY;
  let url = `https://www.hikingproject.com/data/get-trails?lat=${lat}&lon=${lon}&maxDistance=1000&key=${HIKING_API_KEY}`;

  return superagent.get(url).then( data => {
    console.log(data.body.trails);
    return data.body.trails.map( data => {
      // console.log(item.weather);
      return new Trails(data);
    });
  });
}

client.connect()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`listening on ${PORT}`)
    );
  }).catch((err) => {
    console.log(err.message);
  });
