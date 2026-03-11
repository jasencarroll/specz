from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    database_url: str = "postgresql://localhost/specz"
    mistral_api_key: str = ""
    resend_api_key: str = ""
    cors_origins: list[str] = ["http://localhost:5173"]
    app_url: str = "http://localhost:5173"
    session_cookie_name: str = "auth-session"
    magic_link_expiry_minutes: int = 15
    session_expiry_days: int = 30
    from_email: str = "Specz <noreply@jasencarroll.com>"


settings = Settings()
