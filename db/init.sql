CREATE TABLE weather_information
(
    entry_id BIGSERIAL,
    city_id integer,
    city_name varchar(256),
    temperature double precision,
    humidity integer,
    weather_id integer,
    clouds integer,
    wind_speed double precision,
    dt_value varchar(256),
	PRIMARY KEY (entry_id)
);