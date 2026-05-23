from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="TRADESELECT_", env_file=".env", extra="ignore")

    app_name: str = "TradeSelect"
    env: str = "dev"
    cors_origins: list[str] = ["http://localhost:5173"]

    data_dir: str = "./data"
    use_mock_data: bool = True


settings = Settings()
