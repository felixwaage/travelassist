var db_price = require('db-prices');
var stations = require('db-stations')
var request = require('request');

stations.full

function getStationInfoBySearchString(searchString){
	return new Promise(function(resolve,reject){
		var url = 'https://api.deutschebahn.com/stada/v2/stations?searchstring='+searchString+'*';
		var header = { "Authorization" : "Bearer aafc6963b3c122a3bcf12b7109547308" };

		request(url, {headers: header, json: true }, (err, res, body) => {
		if (err) { reject(err); }
			var Station = body.result[0];
			resolve(Station);
		});
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
	var routes = [];

	for(var i = 0; i < connections.length; i++){
		var connection = connections[i];
		await db_price(connection.start.id,connection.end.id,date,option).then((res) => {
			routes.push(res);
		});
	}	

	return routes;
}

function getBestPriceForCity(origin,destination,date){
	return new Promise((resolve,reject) => {
		getRoutesToCity(origin,destination,date).then((connections) => {
			var connectionMinPrice;
			for(var i = 0; i < connections.length; i++){
				var item = connections[i];
				if(item.length > 0){
					for(var y = 0; y < item.length; y++){
						if(y===0) connectionMinPrice = item[y];
						else{ if(item[y].price.amount < connectionMinPrice.price.amount) connectionMinPrice = item[y]; }
					}
				}
			}
			resolve(connectionMinPrice);
		}).catch((err) => {
			reject(err);
		})
	})
}

function getRoutesToCity(origin,destination,date){
	return new Promise((resolve,reject) => {
		getRoute(origin,destination,date).then((connections) => {
			resolve(connections);
		}).catch((err) => {
			reject(err);
		});
	});	
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

module.exports = {
	getRoutesByCityList,
	getRoutesToCity,
	getBestPriceForCity,
	getStationInfoBySearchString
}