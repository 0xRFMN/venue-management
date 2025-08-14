from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader

API_KEY = "your-secret-api-key"  # In production, this should be in environment variables
api_key_header = APIKeyHeader(name="X-API-Key")

async def get_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key"
        )
    return api_key