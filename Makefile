.PHONY: dev-up

# ==============================================================================
# Development Commands
# ==============================================================================
dev-up: 
	docker-compose -f docker-compose.dev.yml up -d

dev-build:
	docker-compose -f docker-compose.dev.yml build