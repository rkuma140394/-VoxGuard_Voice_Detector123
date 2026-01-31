from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import base64
import json
from google import genai
from google.genai import types
from typing import List, Optional
import logging

# Configure logging for Cloud Run monitoring
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="VoxGuard Forensic API")

# Enable CORS for all origins to allow external API calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    audio_base64: str
    mime_type: str
    language: str

class AnalysisResponse(BaseModel):
    classification: str
    confidenceScore: float
    explanation: str
    detectedLanguage: str
    artifacts: Optional[List[str]] = []

# API_KEY is injected by Cloud Run environment variables
api_key = os.getenv("API_KEY")

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_voice(request: AnalysisRequest):
    if not api_key:
        logger.error("API_KEY environment variable is missing")
        raise HTTPException(status_code=500, detail="Server configuration error: API_KEY missing")
    
    try:
        # Initialize the new GenAI client
        client = genai.Client(api_key=api_key)
        
        system_instruction = (
            "You are a world-class audio forensic expert. Your task is to analyze "
            "audio recordings and determine if they are authentic human voices or "
            "AI-generated/synthetic deepfakes. Look for spectral anomalies, "
            "unnatural rhythmic patterns, lack of breath pauses, robotic prosody, "
            "and phase inconsistencies typical of neural speech synthesis."
        )

        prompt = (
            f"Analyze this audio sample. The expected language is {request.language}. "
            "Classify the voice as 'HUMAN', 'AI_GENERATED', or 'INCONCLUSIVE'. "
            "Provide a confidence score (0-1) and a technical explanation."
        )

        audio_part = types.Part.from_bytes(
            data=base64.b64decode(request.audio_base64),
            mime_type=request.mime_type
        )
        
        # Using gemini-3-flash-preview for high-speed multimodal analysis
        response = client.models.generate_content(
            model='gemini-3-flash-preview',
            contents=[audio_part, prompt],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema={
                    "type": "OBJECT",
                    "properties": {
                        "classification": {"type": "STRING"},
                        "confidenceScore": {"type": "NUMBER"},
                        "explanation": {"type": "STRING"},
                        "detectedLanguage": {"type": "STRING"},
                        "artifacts": {"type": "ARRAY", "items": {"type": "STRING"}}
                    },
                    "required": ["classification", "confidenceScore", "explanation", "detectedLanguage"]
                }
            )
        )
        
        if not response.text:
             logger.warning("Empty response received from GenAI")
             raise ValueError("The AI engine failed to return a valid analysis.")
             
        return json.loads(response.text)
        
    except Exception as e:
        logger.error(f"Analysis Exception: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Forensic analysis failed: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
