.PHONY: dev-up

# ==============================================================================
# Development Commands
# ==============================================================================

dev-up: 
	docker compose -f docker-compose.dev.yml up -d
	@echo "Development environment is starting..."
	@echo "Web application will be available at http://localhost:8000"
	@echo "PostgreSQL will be available at localhost:5432"
	
dev-down:
	docker compose -f docker-compose.dev.yml down

dev-build:
	docker compose -f docker-compose.dev.yml build

dev-logs:
	docker compose -f docker-compose.dev.yml logs -f

dev-shell:
	docker compose -f docker-compose.dev.yml exec backend python manage.py shell

# Django commands
db-migrate:
	docker compose -f docker-compose.dev.yml exec backend python manage.py makemigrations
	docker compose -f docker-compose.dev.yml exec backend python manage.py migrate

db-shell:
	docker compose -f docker-compose.dev.yml exec db psql -U admin@admin.com -d campus-voice-db

db-seed:
	docker compose -f docker-compose.dev.yml exec backend python manage.py seed_categories
	docker compose -f docker-compose.dev.yml exec backend python manage.py seed_rbac

dev-setup:
	make dev-build
	make dev-up
	@echo "Waiting for services to start..."
	sleep 10
	make db-migrate
	make db-seed
	@echo "Setup complete! Visit http://localhost:8000/"
	make dev-down
	make dev-up

createsuperuser:
	docker compose -f docker-compose.dev.yml exec backend python manage.py createsuperuser

prod-setup:
	make prod-build

prod-up:
	docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
	@echo "Production environment is starting..."
	@echo "Web application will be available at http://localhost:80"
	@echo "PostgreSQL is running in a container."

