FROM postgres:latest

ENV PGDATA ./spontanurlaubVolume:/var/lib/postgresql/data
ENV POSTGRES_PASSWORD 12345
ENV POSTGRES_DB postgres

ADD init.sql /docker-entrypoint-initdb.d/

