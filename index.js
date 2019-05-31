var express = require('express');
var weather = require('./weather');
var bodyparser = require('body-parser');
var db = require('./db');

const fs = require('fs');
var largeCities = [];

var app = express();

app.use(bodyparser.json());

var date = new Date('2019-05-18T00:00:00.000Z');

startUp();

function updateWeather(){
	weather.updateWeather(largeCities);
}

function startUp(){
	let rawdata = fs.readFileSync('de.json');  
	let cities = JSON.parse(rawdata);
	
	for(var i = 0; i < cities.length; i++){
		if(cities[i].population > 2000000) largeCities.push(cities[i]);
	}

	updateWeather();
	setInterval(updateWeather,3600000);

	weather.getWeatherByCityName('Duisburg').then((res) => {

	})
}

async function generateResultList(startPoint,date){
	//Alle Städte durchlaufen
	for(var i = 0; i < largeCities.length; i++){
		//Wetterinformationen für Stadt-X
		var weatherInformation;
		await weather.getWeatherByCityName(largeCities[i].city).then((res) => { weatherInformation = res });
		//Verbindungsinformationen für Stadt-X von Stadt-Y
		var connections;
		await db.getBestPriceForCity(startPoint,largeCities[i].city,date).then((route) => {
			connections = route;
		}).catch((err) => {
			console.log(err);
		});

		var day1 = date.split('T');
		var rows = weatherInformation.rows;
		var weatherOnDay = [];

		for(var i = 0; i < rows.length; i++){
			var day2 = rows[i].dt_value.split(' ');
			if(day1[0] === day2[0]){ weatherOnDay.push(rows[i]); }
		}

		//Aufruf der Wetterbewertung für die Stadt

		console.log('BREAK-POINT');
	}
}

async function processWeatherInfo(city,date) {
	var forecast;
	await getWeatherInformationByCityNameForDay(city,date).then((res) => {
		forecast = res;
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

app.post('/api/getRaking', (req,res) => {
	
})

app.get('/api/getPrice/:start/:date', function (req, res) {
  	var start = req.params.start;
  	var date = req.params.date;
	generateResultList(start,date);
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});