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

	
}

async function generateResultList(startPoint,date){
	//Objekt zur Rückgabe an den Aufrufer
	var response = [];
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

		for(var x = 0; x < rows.length; x++){
			var day2 = rows[x].dt_value.split(' ');
			if(day1[0] === day2[0]){ weatherOnDay.push(rows[x]); }
		}

		//Aufruf der Wetterbewertung für die Stadt
		for(x = 0; x = rows.length; x++) {
			var temp = weatherInformation.rows[x].temperature; // In Kelvin; 273.15 Kelvin = 0°C; 1°C = 1Kelvin
			var hum = weatherInformation.rows[x].humidity; // In %
			var wind = weatherInformation.rows[x].wind_speed; // In meter/second
			var cloudiness = weatherInformation.rows[x].clouds; // In %

			var tempPrio = 0.25;
			var humPrio = 0.25;
			var windPrio = 0.25;
			var cloudinessPrio = 0.25;

			// Berechnung tempRanking
			var tempRanking;
			if(temp > 306.48) {
				tempRanking = 100 * tempPrio;
			} else if(temp < 273.15){
				tempRanking = 0;
			} else {
				tempRanking = (temp - 273.15) * 3 * tempPrio;
			}

			// Berechnung humRanking
			var humRanking = hum * humPrio;

			// Berechnung windRanking
			beaufort = Math.round(Math.pow((wind / 0.836), 2/3));
			var windRanking = (beaufort -10) * (-1) * 10 * windPrio;

			// Berechnung cloudinessRanking
			var cloudinessRanking = (cloudiness -100) * (-1) * cloudinessPrio;

			// Endwertberechnung
			let weatherRankingSum = tempRanking + humRanking + windRanking + cloudinessRanking;
		}
		let weatherRanking = weatherRankingSum / rows.length;



		var responseItem = {
		ranking: 3, // TODO
			weather_value: weatherRanking,
			dp_route: connections
		}

		response.push(responseItem);
	}

	return response;
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
	generateResultList(start,date).then((response) => {
		res.send(response);
	});
});

app.get('/api/test/:callback', (req,res) => {
	res.send('Parameter: '+req.params.callback);
});

app.get('/api/test2/largeCities', (req,res) => {
	res.send(largeCities);
});

app.listen(8080, function () {
  console.log('Example app listening on port 3000!');
});