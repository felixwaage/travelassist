const { Pool } = require('pg');
var config = require('./config');
var request = require('request');

const oDBPool = new Pool({
    user: config.DBUSER,
    host: config.DBHOST,
    database: config.DBNAME,
    password: config.DBPW,
    port: config.DBPORT,
});

function getWeatherInformationByCityName(city){
	var url = 'https://api.openweathermap.org/data/2.5/forecast?q='+city.city+',de&appid=df538d083c1139ae67e484a785bb276c';
	request(url, {json:true}, (err,res,body) => {
		if(typeof body !== 'undefined' && typeof body.list !== 'undefined') {
			var list = res.body.list;
			var city = res.body.city;
			
			for(var i = 0; i < list.length; i++){
				var item = list[i];
	
				var city_id = city.id;
				var city_name = city.name;
				var temperature = item.main.temp;
				var humidity = item.main.humidity;
				var weather_id = item.weather[0].id;
				var clouds = item.clouds.all;
				var wind_speed = item.wind.speed;
				var dt_value = item.dt_txt;
	
				var sql = 'INSERT INTO weather_information (city_id,city_name,temperature,humidity,weather_id,clouds,wind_speed,dt_value) VALUES ('+city_id+','+'\''+city_name+'\''+','+temperature
				+','+humidity+','+weather_id+','+clouds+','+wind_speed+','+'\''+dt_value+'\''+')';
	
				oDBPool.query(sql,(err,res) => {
				})			
			}
		}
	});
}

function updateWeather(cities){
	var sql = 'DELETE FROM weather_information;';
	oDBPool.query(sql, (err,res) => {
		for(var i = 0; i < cities.length; i++){
			getWeatherInformationByCityName(cities[i]);
		}
	});
}

function getWeatherByCityName(city){
	var sql = 'SELECT * FROM WEATHER_INFORMATION WHERE city_name =\'' + city +'\'';
	return new Promise((resolve,reject) => {
		oDBPool.query(sql,(err,res) => {
			if(typeof err === 'undefined'){
				resolve(res);
			} else {
				reject(err + ' ...maybe City not found!');
			}
		});
	});
}

function getAllWeatherInformation(){
	var sql = 'SELECT * FROM WEATHER_INFORMATION;';
	return new Promise((resolve,reject) => {
		oDBPool.query(sql,(err,res) => {
			if(typeof err === 'undefined'){
				resolve(res);
			} else {
				reject('Database Error!');
			}
		});
	});
}
module.exports = {
	updateWeather,
	getWeatherByCityName,
	getAllWeatherInformation
}