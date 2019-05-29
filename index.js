var express = require('express');
var weather = require('./weather');
var db = require('./db');

const fs = require('fs');
var largeCities = [];

var app = express();

var date = new Date('2019-05-18T00:00:00.000Z');

startUp();

function updateWeather(){
	weather.updateWeather(largeCities);
}

function startUp(){
	let rawdata = fs.readFileSync('de.json');  
	let cities = JSON.parse(rawdata);
	
	for(var i = 0; i < cities.length; i++){
		if(cities[i].population > 300000) largeCities.push(cities[i]);
	}

	updateWeather();
	setInterval(updateWeather,3600000);

	weather.getWeatherByCityName('Duisburg').then((res) => {
		console.log(res);
	})
}

function generateResultList(startPoint,date){
	weather.getAllWeatherInformation().then((weather) => {
		db.getRoutesByCityList(startPoint,largeCities,date).then((connections) => {
			console.log(connections);
			console.log(weather);

			for(var i = 0; i < connections.length; i++){
				console.log(typeof connections[12].length);
			}

		})
	})
}

app.get('/getPrice/:start/:date', function (req, res) {
  	console.log(req);
  	var start = req.params.start;
  	var date = req.params.date;
	generateResultList(start,date);
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});