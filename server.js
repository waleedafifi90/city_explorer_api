'use strict';

const server = require('express');
const cors = require('cors');
const { request } = require('express');
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
  this.forecast = data.weather;
  this.time = data.datetime;
  Weather.all.push(this);
}
Weather.all=[];

app.get('/location', (req, res) => {
  const data = require('./data/location.json');
  let city = req.query.city;
  let locationData = new Location(city, data);
  res.send(locationData);
});

app.get('/weather', (req, res) => {
  const weatherData = require('./data/weather.json');
  let city = req.query.city;
  weatherData.data.forEach(item => {
    let newData = new Weather(city, item);
  });
//   console.log(weatherData);
  res.send(Weather.all);
});
