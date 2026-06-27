"""
Load Test / Stress Test Settings
================================
Inherits from the main settings but disables API throttling
so that load testing tools (hey, JMeter, Locust, etc.) can
hit the server without getting 429 Too Many Requests responses.

Usage (same stack as production):
    1. Add to .env.prod:
       DJANGO_SETTINGS_MODULE=config.settings_loadtest

    2. Run your normal stack:
       docker compose -f docker-compose.prod.yml up

    3. Run load tests, then remove the line from .env.prod when done.

WARNING:
    DO NOT forget to remove DJANGO_SETTINGS_MODULE from .env.prod
    after testing. This file removes all rate limiting protections.
"""

from config.settings import *  # noqa: F401, F403

# =============================================================================
# THROTTLING — DISABLED FOR LOAD TESTING
# =============================================================================
# Remove all throttle classes so requests are not rate-limited.
# The original rates in settings.py (burst: 5/s, sustained: 500/day, etc.)
# would cause most load test requests to return 429.

REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = []  # noqa: F405
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {}  # noqa: F405

# =============================================================================
# LOGGING — REDUCE NOISE DURING LOAD TESTS
# =============================================================================
# Suppress verbose request logging to avoid I/O bottlenecks
# that could skew your test results.

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'level': 'WARNING',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
}
