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

function Weather(city, data, longTimeStamp){
  this.forecast = data.weather.description;
  this.time = longTimeStamp;
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
    let day = getDay(item)[0];
    let daynum = getDay(item)[1];

    let month = getMonthandYear(item)[0];
    let year = getMonthandYear(item)[1];

    let longTimeStamp = `${day} ${month} ${daynum} ${year}`;

    let newData = new Weather(city, item, longTimeStamp);
  });
  //   console.log(weatherData);
  res.send(Weather.all);
});




function getDay(item){
  var weekday = new Array(7);
  weekday[0] = 'Sunday';
  weekday[1] = 'Monday';
  weekday[2] = 'Tuesday';
  weekday[3] = 'Wednesday';
  weekday[4] = 'Thursday';
  weekday[5] = 'Friday';
  weekday[6] = 'Saturday';

  let d = new Date(`${item.valid_date}`);
  let day = weekday[d.getDay()];
  return [day,d.getDay()];
}
function getMonthandYear(item){
  var d = new Date(`${item.valid_date}`);
  var month = new Array();
  month[0] = 'January';
  month[1] = 'February';
  month[2] = 'March';
  month[3] = 'April';
  month[4] = 'May';
  month[5] = 'June';
  month[6] = 'July';
  month[7] = 'August';
  month[8] = 'September';
  month[9] = 'October';
  month[10] = 'November';
  month[11] = 'December';
  var n = month[d.getMonth()];
  var nyear = d.getFullYear();
  return [n,nyear];
}
