from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import courses, auth, exams, topics
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

# Include routers
app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(topics.router)
app.include_router(exams.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to SkillUp2Dev API"}
