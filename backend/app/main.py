from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.base_class import Base
from app.db.session import engine
from app.db import base  # noqa: F401 — imports all models so metadata is populated
from app.routers.issues import router as issues_router
from app.routers.auth import router as auth_router
from app.routers.admin import router as admin_router
from app.routers.invites import router as invites_router
from app.routers.client_team import router as client_team_router
from app.routers.client_issues import router as client_issues_router
from app import cloudinary_config  # noqa: F401 — initializes cloudinary on startup

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Issue Tracker API", version="2.0.0")

# Allow the Next.js frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(issues_router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(invites_router)
app.include_router(client_team_router)
app.include_router(client_issues_router)


@app.get("/")
def root():
    return {"message": "Issue Tracker API running", "version": "2.0.0"}
