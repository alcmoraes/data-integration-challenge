#Challenge Makefile

start:
	docker-compose up -d
	@echo "Api running on port 3005"

stop:
	docker-compose stop

logs:
	docker-compose logs -f

check:
#TODO: include command to test the code and show the results

setup:
	./scripts/setup.sh