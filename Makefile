.PHONY: help
.DEFAULT_GOAL := help

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

setup: ## Installs the project and setup initial data
	@bash scripts/setup.sh

start: ## Starts the project
	@docker-compose up -d
	@echo "Api running on port 3005"

stop: ## Stops the project
	@docker-compose stop

logs: ## Show the logs for the running project
	@docker-compose logs -f yawoen_api

check: ## Run project tests
	@docker exec -it yawoen_api bash -c "npm run test"

nyc: ## Runs the Coverage UI on port 8081
	@docker exec -it yawoen_api bash -c "npm run coverage"
	@echo "Tests coverage running on port 8081"

docs: ## Runs the Swagger Explorer UI on port 8082
	@docker exec -it yawoen_api bash -c "npm run swagger"
	@echo "API documentation running on port 8082"

lcov: ## Output coverage lcov data
	@docker exec -it yawoen_api bash -c "npm run lcov"

remove: ## Removes project
	@docker-compose stop yawoen_api
	@docker-compose stop yawoen_mongo
	@docker-compose rm -f yawoen_api
	@docker-compose rm -f yawoen_mongo