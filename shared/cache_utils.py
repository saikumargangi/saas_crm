import json
import functools
from typing import Callable, Any, Optional
from shared.cache import RedisClient

class CacheService:
    def __init__(self, redis_client: RedisClient):
        self.redis = redis_client

    async def get(self, key: str) -> Optional[Any]:
        val = await self.redis.get(key)
        if val:
            try:
                return json.loads(val)
            except json.JSONDecodeError:
                return val
        return None

    async def set(self, key: str, value: Any, expire: int = 3600):
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        await self.redis.set(key, value, expire)

    def cached(self, prefix: str, expire: int = 300):
        """
        Decorator to cache the result of an async function.
        Usage:
            @cache_service.cached("user_profile", expire=600)
            async def get_user_profile(user_id: str):
                ...
        """
        def decorator(func: Callable):
            @functools.wraps(func)
            async def wrapper(*args, **kwargs):
                # Construct key from prefix and arguments
                # This is a simple strategy; for complex args, might need better hashing
                key_parts = [prefix]
                if args:
                    key_parts.extend([str(a) for a in args])
                if kwargs:
                    key_parts.extend([f"{k}={v}" for k, v in kwargs.items()])
                
                cache_key = ":".join(key_parts)
                
                # Check cache
                cached_val = await self.get(cache_key)
                if cached_val is not None:
                    return cached_val
                
                # Call function
                result = await func(*args, **kwargs)
                
                # Cache result
                if result is not None:
                    # Note: You might need to serialize Pydantic models specifically here
                    # For now, assuming result is serializable or primitive
                    await self.set(cache_key, result, expire)
                    
                return result
            return wrapper
        return decorator

# Initialize global instance (assuming RedisClient is singleton-like or we pass the global one)
# from shared.cache import redis_client
# cache_service = CacheService(redis_client)
