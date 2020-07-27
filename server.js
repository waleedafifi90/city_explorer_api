'use strict';

const server = require('express');
const cors = require('cors');
const superagent = require('superagent');

require('dotenv').config();

const app = server();

const PORT = process.env.PORT || 3100;

app.use(cors());

app.listen(PORT, () => {
  console.log('Server is listening to port ', PORT);
});


function Location(city, data) {
  this.search_query = city;
  this.formatted_query = data[0].display_name;
  this.latitude = data[0].lat;
  this.longitude = data[0].lon;
}

function Weather(city, data){
  this.forecast = data.weather.description;
  this.time = new Date(data.valid_date).toString().slice(0, 15);
  Weather.all.push(this);
}
Weather.all=[];

app.get('/location', handelLocation);

app.get('/weather', handelWeather);

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

  return superagent.get(url).then( data => {
    let locationData = new Location(city, data.body);
    return locationData;
  });
}

function handelWeather(req, res) {
  let city = req.query.city;

  getWeather(city).then( returnedData => {
    res.send(returnedData);
  }).catch((err) => {
    console.log(err.message);
  });
}

function getWeather(city) {
  Weather.all = [];

  let WEATHER_API_KEY = process.env.WEATHER_API_KEY;
  let NUMBER_OF_DAY = process.env.NUMBER_OF_DAY;
  let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=${WEATHER_API_KEY}&days=${NUMBER_OF_DAY}`;

  return superagent.get(url).then( data => {
    console.log(data.body.data);
    return data.body.data.map( item => {
      // console.log(item.weather);
      return new Weather(city, item);
    });
  });
}
