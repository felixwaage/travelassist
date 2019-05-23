var db_price = require('db-prices');
var express = require('express');
var stations = require('db-stations')
var request = require('request');
const fs = require('fs');

var app = express();

const berlin =  8011160;
const münchen = 8000261;

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

function getWeatherInformationByCityName(city,date){

	request(url, {}, (err,res,body) => {

	});
	
}

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
	for(var i = 0; i < cityList; i++){
		await getRoute(start,cityList[i].city,date).then((res) => {
			routesList.push(res);
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
			})
		})
	})
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
	
	getRoutesByCityList(start,largeCities,date).then((res) => {
		console.log(res);
	})
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});