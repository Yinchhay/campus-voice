from rest_framework.throttling import UserRateThrottle, AnonRateThrottle

class BurstRateThrottle(AnonRateThrottle):
    scope = 'burst'

class SustainedRateThrottle(AnonRateThrottle):
    scope = 'sustained'

class BurstUserRateThrottle(UserRateThrottle):
    scope = 'user_burst'

class SustainedUserRateThrottle(UserRateThrottle):
    scope = 'user_sustained'
