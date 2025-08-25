import secrets
import warnings
from typing import Annotated, Any, Literal, Optional

from pydantic import (
    AnyUrl,
    BeforeValidator,
    EmailStr,
    HttpUrl,
    PostgresDsn,
    computed_field,
    model_validator,
)
from pydantic_core import MultiHostUrl
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Self

from app.lib.kakao_alimtalk import KakaoAlimtalk


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


CorsOrigins = Annotated[list[AnyUrl] | str, BeforeValidator(parse_cors)]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Use top level .env file (one level above ./backend/)
        env_file="../.env",
        env_ignore_empty=True,
        extra="ignore",
    )

    FRONTEND_HOST: str = "http://localhost:5173"
    ENVIRONMENT: Literal["local", "staging", "production"] = "local"

    PROJECT_NAME: str = ""
    API_V1_STR: str = "/api/v1"

    BACKEND_CORS_ORIGINS: CorsOrigins = []
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ADMIN_PASSWORD: str = ""

    # 60 minutes * 24 hours * 8 days = 8 days
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8

    @computed_field  # type: ignore[prop-decorator]
    @property
    def all_cors_origins(self) -> list[str]:
        return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS] + [
            self.FRONTEND_HOST
        ]

    BANK_ACCOUNT_NO: str = ""
    BANK_ACCOUNT_BIRTHDAY: str = ""
    BANK_ACCOUNT_PASSWORD: str = ""
    BANK_SYNC_INTERVAL_SECOND: int = 10

    KAKAO_ACCESS_KEY: str = ""
    KAKAO_SECRET_KEY: str = ""
    KAKAO_SERVICE_ID: str = ""

    POSTGRES_SERVER: str = ""
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = ""
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = ""

    SENTRY_DSN: Optional[HttpUrl] = None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn:
        return MultiHostUrl.build(
            scheme="postgresql+psycopg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )

    def _check_default_secret(self, var_name: str, value: Optional[str]) -> None:
        if value == "changethis":
            message = (
                f'The value of {var_name} is "changethis", '
                "for security, please change it, at least for deployments."
            )
            if self.ENVIRONMENT == "local":
                warnings.warn(message, stacklevel=1)
            else:
                raise ValueError(message)

    @model_validator(mode="after")
    def _enforce_non_default_secrets(self) -> Self:
        self._check_default_secret("SECRET_KEY", self.SECRET_KEY)
        self._check_default_secret("POSTGRES_PASSWORD", self.POSTGRES_PASSWORD)
        self._check_default_secret("ADMIN_PASSWORD", self.ADMIN_PASSWORD)

        return self

    __alimtalk: Optional[KakaoAlimtalk] = None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def alimtalk(self) -> KakaoAlimtalk:
        if self.__alimtalk is None:
            self.__alimtalk = KakaoAlimtalk(
                service_id=self.KAKAO_SERVICE_ID,
                access_key=self.KAKAO_ACCESS_KEY,
                secret_key=self.KAKAO_SECRET_KEY,
            )

        return self.__alimtalk


settings = Settings()  # type: ignore
