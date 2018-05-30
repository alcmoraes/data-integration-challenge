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

## API Documentation

Start the project with `make start` and execute `make docs`.
That will run a server on port 8082 containing the Swagger Explorer UI
with all the endpoints available in the API.

