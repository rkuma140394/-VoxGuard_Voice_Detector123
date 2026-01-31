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

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="VoxGuard API")

# Configure CORS
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

# API_KEY is set via environment variable in Cloud Run
api_key = os.getenv("API_KEY")

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_voice(request: AnalysisRequest):
    if not api_key:
        logger.error("API_KEY is missing from environment variables")
        raise HTTPException(status_code=500, detail="Server misconfiguration: API_KEY not found")
    
    try:
        # Initialize the GenAI client
        client = genai.Client(api_key=api_key)
        
        system_instruction = (
            "You are a world-class audio forensic expert specializing in deepfake detection. "
            "Analyze the provided audio to determine if it is an authentic human recording "
            "or AI-generated (synthetic). Look for spectral anomalies, robotic prosody, "
            "lack of natural breathing, and phase inconsistencies."
        )

        prompt = (
            f"Analyze this audio file. The expected language is {request.language}. "
            "Return the analysis strictly as JSON."
        )

        audio_part = types.Part.from_bytes(
            data=base64.b64decode(request.audio_base64),
            mime_type=request.mime_type
        )
        
        # Use gemini-3-flash-preview for fast audio analysis
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
             raise ValueError("Gemini returned no content")
             
        return json.loads(response.text)
        
    except Exception as e:
        logger.error(f"Analysis Failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis engine error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Use PORT from environment or default to 8080
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
