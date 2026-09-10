from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.database.connection import DatabaseNotConfiguredError
from app.routers.users import router as users_router


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(title=settings.app_name)
    if settings.cors_origins:
        application.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_methods=["GET", "POST"],
            allow_headers=["Content-Type", "Authorization"],
        )
    application.include_router(users_router, prefix="/api/v1")
    application.add_api_route("/", root, methods=["GET"], tags=["Status"])

    @application.exception_handler(DatabaseNotConfiguredError)
    async def database_not_configured_handler(request, exc):
        return JSONResponse(
            status_code=503, content={"detail": "Banco de dados não configurado."}
        )

    return application


def root():
    return {"message": "InkFlow API funcionando"}


app = create_app()
