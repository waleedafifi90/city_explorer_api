drop table if EXISTS city_explorer;

create table city_explorer (
    id serial primary key ,
    name varchar(255),
    latitude varchar(255),
    longitude varchar(255)
);

insert into city_explorer(name, latitude, longitude) values('Gaza', '31.4433', '34.22233')