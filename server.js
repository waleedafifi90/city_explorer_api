'use strict';

const server = require('express');
const cors = require('cors');
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

function Weather(city, data, longTimeStamp){
  this.forecast = data.weather.description;
  this.time = longTimeStamp;
  Weather.all.push(this);
}
Weather.all=[];

app.get('/location', (req, res) => {
  let city = req.query.city;
  let reqex = /^[a-zA-Z]+(?:[\s-][a-zA-Z]+)*$/;

  if (!reqex.test(city)) { res.status(422).send({ 'status': 422, msg: 'Please enter a valid city name!'}); }
  if(!city) { res.status(500).send({ 'status': 500, responseText: 'Sorry, something went wrong'}); }

  const data = require('./data/location.json');
  let locationData = new Location(city, data);
  res.send(locationData);
});

app.get('/weather', (req, res) => {
  Weather.all = [];
  let city = req.query.city;
  // let reqex = /^[a-zA-Z]+(?:[\s-][a-zA-Z]+)*$/;

  // if (!reqex.test(city)) { res.status(422).send({ 'status': 422, msg: 'Please enter a valid city name!'}); }
  // if(!city) { res.status(500).send({ 'status': 500, responseText: 'Sorry, something went wrong'}); }

  // const weatherData = require('./data/weather.json');
  
  // weatherData.data.map(item => {

  //   const time = new Date(item.valid_date);
  //   let longTimeStamp = time.toString();

  //   let newData = new Weather(city, item, longTimeStamp.toString().substr(0, 15));
  // });
  //   console.log(weatherData);
  getWeather(city);
  res.send(Weather.all);
});

app.all('*', (req, res) => {
  res.status(500).send({ 'status': 500, responseText: 'Sorry, something went wrong'});
});

function dateToString(date) {
  var options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
  options.timeZone = 'UTC';
  options.timeZoneName = 'short';
  return (date.toLocaleDateString('en-US', options));

}

function getWeather(city) {
  Weather.all = [];
  const weatherData = require('./data/weather.json') || [];

  console.log(weatherData.data);
  return weatherData.data.map( item => {
    new Weather(city, item);
  });
}
