import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    AI_MODEL: str = os.getenv("AI_MODEL", "gpt-4o-mini")
    AI_EMBEDDING_MODEL: str = os.getenv("AI_EMBEDDING_MODEL", "text-embedding-3-small")
    INTERNAL_SERVICE_KEY: str = os.getenv("INTERNAL_SERVICE_KEY", "dev_sicp_ai_internal_token_2026")
    PIPELINE_VERSION: str = "phase4-v1.0"
    PROMPT_VERSION: str = "v1.0"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    ENVIRONMENT: str = os.getenv("NODE_ENV", "development")
    
    # Duplicate similarity thresholds
    SIMILARITY_HIGH_THRESHOLD: float = 0.80
    SIMILARITY_MEDIUM_THRESHOLD: float = 0.60
    SIMILARITY_LOW_THRESHOLD: float = 0.40

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
