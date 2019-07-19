var express = require('express');
var weather = require('./weather');
var bodyparser = require('body-parser');
var db = require('./db');
var request = require('request');
var db_price = require('db-prices');

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
	let rawdata = fs.readFileSync('cities.json');  
	let cities = JSON.parse(rawdata);
	
	for(var i = 0; i < cities.length; i++){
		largeCities.push(cities[i]);
	}

	updateWeather();
	setInterval(updateWeather,3600000);

	
}

async function generateResultList(startPoint,date){
	
	var origin = {};

	await db.getStationInfoBySearchString(startPoint).then((res) => {
		origin = {
			city_name: res.mailingAddresscity,
			station_name: res.name,
			lat: res.evanumbers0geographiccoordinatescoordinates1,
			long: res.evanumbers0geographiccoordinatescoordinates0,
		}
	});
	//Objekt zur Rückgabe an den Aufrufer
	var response = [];
	var weatherRankingSum;
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
		for(var x = 0; x < rows.length; x++) {
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
			var weatherRankingSum = tempRanking + humRanking + windRanking + cloudinessRanking;
		}
		var weatherRanking = weatherRankingSum / rows.length;



		var responseItem = {
			ranking: null,
			weather_value: weatherRanking,
			weather_information: weatherInformation,
			db_route: connections,
			city: largeCities[i],
			origin
		}

		if(typeof responseItem.db_route !== 'undefined') response.push(responseItem);
	}

	return createRanking(response);
}

function createRanking(responseList){
	responseList.sort(compareByPrice);

	for(var i = 0; i < responseList.length; i++){
		responseList[i].ranking = i;
	}
	
	return responseList;
}

function compareByPrice(a,b){
	const priceA = a.db_route.price.amount;
	const priceB = b.db_route.price.amount;

	if(priceA>priceB) return 1;
	else if(priceA<priceB) return -1;
	else return 0;
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

function convertWeatherIDtoIconID(weatherConditionID){
	iconID = 0;
	code_char = weatherConditionID.toString().charAt(0) ;
	code = parseInt( code_char ) ;
	switch (code) {
		case 2:
			iconID = "11d"; //thunderstorm
			break;
		case 3:
			iconID = "09d"; //drizzle
			break;
		case 5:
			iconID = "10d"; //rain
			if (weatherConditionID == 511) iconID = "13d";
			else if (weatherConditionID > 511) iconID = "09d";
			break;
		case 6:
			iconID = "13d"; //snow
			break;
		case 7:
			iconID = "50d"; //atmosphere
			break;
		case 8: //clouds
			if (weatherConditionID == 800) iconID = "01d"; //clear sky
			else if (weatherConditionID == 801) iconID = "02d";
			else if (weatherConditionID == 802) iconID = "03d";
			else if (weatherConditionID == 803 || weatherConditionID == 804) iconID = "04d";
			break;
		default:
			break;
	}
	if (iconID == 0) return false;
	return iconID;  
}

//http://localhost:3000/api/getPrice/berlin/2019-06-13T00:00:00.000Z
app.get('/api/getPrice/:start/:date', function (req, res) {
	console.log('Request: \nhost:'+req.host+'\nCity: '+req.params.start+'\nDate: '+req.params.date);
		var start = req.params.start;
		var date = req.params.date;
	generateResultList(start,date).then((response) => {
		res.send(response);
	});
});

app.get('/api/test/:callback', (req,res) => {
	res.send('Parameter: '+req.params.callback);
});

// für moderaten Regen bspw: http://localhost:8080/api/getWeatherIcon/10d
// für alle Icons siehe https://openweathermap.org/weather-conditions
app.get('/api/getWeatherIcon/:id', (req,res) => {
	iconID = req.params.id;
	if (! Array('n', 'd').includes( iconID[iconID.length - 1] ) ) { //sowohl die Anfrage mit IconId (endend auf d oder n) als auch mit WetterCode ist möglich
		iconID = convertWeatherIDtoIconID( parseInt(iconID) );
		if (iconID == false) {
			//Fehlerbehandlung: Icon konnte nicht bestimmt werden
		}
	}
	//QM TODO: Check einbauen
	var requestSettings = {
        url: "http://openweathermap.org/img/w/" + iconID + ".png",
        method: 'GET',
        encoding: null
    };
	request(requestSettings, (error, response, body) => {
        res.set('Content-Type', 'image/png');
        res.send(body);
    });
});

app.get('/api/test2/largeCities', (req,res) => {
	res.send(largeCities);
});

app.listen(8080, function () {
  console.log('Example app listening on port 8080!');
});