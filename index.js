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

async function processWeatherInfo(city,date) {
	var forecast;
	await getWeatherInformationByCityNameForDay(city,date).then((res) => {
		forecast = res;
		console.log("Processing: " + forecast);
		//do something with the weather forecast
	});
	return forecast;
}

function getWeatherInformationByCityNameForDay(city, date){
	//var city_country = "London,us"
	return new Promise(function(resolve,reject){
		var url = 'https://api.openweathermap.org/data/2.5/forecast?q=' + city+ '&mode=json&APPID='+ WEATHER_API_KEY;

		request(url, {}, (err,res,body) => {
			if (err) { reject(err); }
			var weatherO = JSON.parse(res.body);
			totalForecast = weatherO.list;
			var forecast = totalForecast.slice(dateToDays(date)*8, dateToDays(date)*8 + 8)
			resolve( forecast );
		}); 
	})
}
function dateToDays (date) {
	var today = new Date();
	var thatday = new Date(date); //watch out which format the parameter has
	var daysBetween = thatday.getDay() - today.getDay();
	daysBetween = daysBetween > 0 ? daysBetween : 7 + daysBetween ;
	//console.log("client requests weather for " + daysBetween + " days in advance");
	return daysBetween;
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