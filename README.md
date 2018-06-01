# Data Integration Challenge

**Obs: That's a technical challenge created by @alcmoraes to @neoway**

## Requirements

1. Docker
2. Docker Compose
3. Ports 3005, 8081 and 8082

## Usage

Use `make` to show the following commands in your terminal

| Command   |      Description     |
|-----------|:---------------------|
| help      | Gets this table in your terminal | 
| setup     | Installs the docker containers and import initial data |
| start     | Starts the project and open API on port 3005 |
| stop      | Stops the project |
| logs      | Shows the logs from the project |
| check     | Run unit tests |
| nyc       | Serve the Tests Coverage UI on port 8081 |    
| docs      | Serve the Swagger Explorer UI on port 8082 |
| remove    | Stops and removes the containers from this project |

## API Documentation (Swagger)

First ensure project is running. If not go and start it with `make start`.
Execute `make docs`, this will start server on port 8082.

## Project Coverage (NYC/Mocha)

First ensure project is running. If not go and start it with `make start`.
Execute `make check`.
To see the coverage UI, go for `make nyc`. It will start a server on port 8081.

## Import file via command line

The project have an importer that works via command line:

```
  docker exec -it yawoen_api bash
```
Now you can execute the following command to be given help

```
  node /var/www/tasks/import_from_file.js help
```
![Example output](https://skynet.doisbit.com/n/CO2dQ.png)
*Example output*

**Obs.: Please be aware that by default this script WILL NOT MERGE the content from the CSV file.**
For merging source into database instead of creating new entries, remember to use `merge=true` flag.