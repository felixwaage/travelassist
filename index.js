var db_price = require('db-prices');
var express = require('express');
var stations = require('db-stations')
var request = require('request');
const fs = require('fs');

var app = express();

const berlin =  8011160;
const münchen = 8000261;

const WEATHER_API_KEY = '3aa8e75fdae1e5fbf3d94bacf8b9f114'

stations.full

var date = new Date('2019-05-18T00:00:00.000Z');

var option = {
	class: 			2, 	// 1st class or 2nd class
	noICETrains: 		false,
	transferTime: 		0, 	// in minutes
	duration: 		1440, 	// search for routes in the next n minutes
	preferFastRoutes: 	true,
	travellers: [{ 		// one or more
		bc:	0, 	// BahnCard ID (see https://gist.github.com/juliuste/202bb04f450a79f8fa12a2ec3abcd72d)
		typ: 	"E", 	// E: adult: K: child; B: baby -- BUG: child and baby dont work ATM
		alter: 	30 	// age
	}]
};

db_price(berlin,münchen,date,option).then( (res) => {
  console.log(res[0]);
});

function getStationIDs(cityname){
	
	return new Promise(function(resolve,reject){
		var url = 'https://api.deutschebahn.com/stada/v2/stations?searchstring='+cityname+'*';
		var header = { "Authorization" : "Bearer aafc6963b3c122a3bcf12b7109547308" };

		request(url, {headers: header, json: true }, (err, res, body) => {
		if (err) { reject(err); }
			var mainStations = body.result;
			var Cat1 = [];
			var Cat2 = [];
			var CatLow = [];

			if(typeof mainStations === 'undefined'){
				reject(body.errMsg);
				return;
			} 

			for(var i = 0; i < mainStations.length; i++){
				if(mainStations[i].category === 1) Cat1.push(mainStations[i]);
				else if(mainStations[i].category === 2) Cat2.push(mainStations[i]);
				else CatLow.push(mainStations[i]);
			}

			if(Cat1.length > 0) mainStations = Cat1;
			else if(Cat2.length > 0) mainStations = Cat2;
			else mainStations = CatLow;

			var stationIds = [];
			for(var i = 0; i < mainStations.length; i++){
				var station = {id: mainStations[i].evaNumbers[0].number,
											name: mainStations[i].name}
				stationIds.push(station);
			}
			resolve(stationIds);
		});
	});
}

async function getByConnection(connections,date){
	console.log(connections);

	var routes = [];

	for(var i = 0; i < connections.length; i++){
		var connection = connections[i];
		await db_price(connection.start.id,connection.end.id,date,option).then((res) => {
			routes.push(res);
		});
	}	

	return routes;
}

async function getRoutesByCityList(start,cityList,date){
	var routesList = [];
	for(var i = 0; i < cityList.length; i++){
		await getRoute(start,cityList[i].city,date).then((res) => {
			routesList.push(res);
		}).catch((err) => {
			var errMsg = cityList[i].city + " not found!";
			routesList.push({err:errMsg});
		})
	}
	return routesList;
}

function getRoute(start,end,date){
	return new Promise((resolve,reject) => {
		var routes = [];
		var connection = {};
		var connections = [];

		getStationIDs(start).then((res) =>{
			start = res;
			getStationIDs(end).then((res) => {
				end = res;
				for(var i = 0; i<start.length; i++){
					for(var x = 0; x<end.length; x++){
						console.log(start[0])
						connection = {start: start[i],end: end[x]};
						connections.push(connection);
					}
				}
				getByConnection(connections,date).then((res) => {
					resolve(res);
				})
			}).catch((err) => {
				reject(err);
			}) 
		}).catch((err) => {
			reject(err);
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

  	let rawdata = fs.readFileSync('de.json');  
	let cities = JSON.parse(rawdata);
	var largeCities = [];
	for(var i = 0; i < cities.length; i++){
		if(cities[i].population > 300000) largeCities.push(cities[i]);
	}
	processWeatherInfo(start, date).then((res) => {
		console.log(res);
	})
	
	getRoutesByCityList(start,largeCities,date).then((connections) => {
		console.log(connections);
		res.send(connections);
	})
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});