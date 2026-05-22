from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from extractor import generate_brief

app = FastAPI(title="KesiAI NLP Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["*"],
    allow_headers=["*"],
)


class RulingRequest(BaseModel):
    text: str


@app.post("/generate-brief")
def generate(req: RulingRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Ruling text is required.")
    return generate_brief(req.text)


@app.get("/health")
def health():
    return {"status": "ok"}
