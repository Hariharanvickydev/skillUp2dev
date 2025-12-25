from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import courses, auth, exams, topics, progress, organizations, users, analytics, admin_organizations, library, org, groups, bulk, important_questions
from .database import engine, Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SkillUp2Dev API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
import os

# Create uploads directory
UPLOAD_DIR = "static/uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers
app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(topics.router)
app.include_router(exams.router)
app.include_router(progress.router)
app.include_router(organizations.router)
app.include_router(users.router)
app.include_router(analytics.router)
app.include_router(admin_organizations.router)
app.include_router(library.router)
app.include_router(org.router)
app.include_router(groups.router)
app.include_router(bulk.router)
app.include_router(important_questions.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to SkillUp2Dev API"}

