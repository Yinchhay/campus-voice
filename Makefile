.PHONY: dev-up

# ==============================================================================
# Development Commands
# ==============================================================================
dev-up: 
	docker-compose -f docker-compose.dev.yml up -d
	
dev-down:
	docker-compose -f docker-compose.dev.yml down

dev-build:
	docker-compose -f docker-compose.dev.yml build

dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

# Django Commands
dev-shell:
	docker-compose -f docker-compose.dev.yml exec web python manage.py shell

db-migrate:
	docker-compose -f docker-compose.dev.yml exec backend python manage.py makemigrations
	docker-compose -f docker-compose.dev.yml exec backend python manage.py migrate

db-shell:
	docker-compose -f docker-compose.dev.yml exec db psql -U admin@admin.com -d campus-voice-db