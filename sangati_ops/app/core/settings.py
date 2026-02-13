from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    SANGATI_ENV: str = "dev"
    SANGATI_SECRET: str = "change-me"
    SANGATI_TZ: str = "Pacific/Auckland"

    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8080

    DATABASE_URL: str
    REDIS_URL: str

    QDRANT_URL: str
    QDRANT_COLLECTION: str = "sangati_knowledge"

    LLM_PROVIDER: str = "none"  # none | openai_compat
    OPENAI_BASE_URL: str | None = None
    OPENAI_API_KEY: str | None = None
    OPENAI_MODEL: str | None = None

    POSBRIDGE_BASE_URL: str
    POSBRIDGE_TOKEN: str

    POLICY_FILE: str = "/app/policy/policy.yaml"

settings = Settings()
