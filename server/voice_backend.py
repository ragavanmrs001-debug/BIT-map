import os
import re
import tempfile
import base64
import logging
import datetime as dt
import subprocess
import requests
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import Optional

# ---- Logging Setup ----
LOG_FOLDER = "server_logs"
os.makedirs(LOG_FOLDER, exist_ok=True)
LOG_FILE = os.path.join(LOG_FOLDER, "jarvis_backend.log")

logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

app = FastAPI(title="BIT-map JARVIS Voice Assistant Backend", version="1.0.0")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- TTS Engine Setup ----
def generate_tts_base64(txt: str, lang: str = "en") -> str:
    """Generate audio file using gTTS (or espeak fallback) and return base64 data string."""
    tmp_path = None
    try:
        from gtts import gTTS
        tts = gTTS(text=txt, lang=lang, slow=False)
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
            tmp_path = f.name
            tts.write_to_fp(f)
            f.flush()
        
        with open(tmp_path, "rb") as audio_file:
            encoded = base64.b64encode(audio_file.read()).decode("utf-8")
        return f"data:audio/mp3;base64,{encoded}"
    except Exception as e:
        logging.warning(f"gTTS failed: {e}. Trying espeak-ng fallback...")
        try:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                tmp_path = f.name
            espeak_bin = os.popen("which espeak-ng || which espeak").read().strip()
            if espeak_bin:
                subprocess.run([
                    espeak_bin, "-v", "en-us+Alicia", "-s", "155", "-p", "50", "-w", tmp_path, txt
                ], check=False)
                with open(tmp_path, "rb") as audio_file:
                    encoded = base64.b64encode(audio_file.read()).decode("utf-8")
                return f"data:audio/wav;base64,{encoded}"
        except Exception as espeak_err:
            logging.error(f"Espeak fallback failed: {espeak_err}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass
    return ""

# ---- Wikipedia Helper ----
WIKI_HEADERS = {
    "User-Agent": "BIT-map-JARVIS/1.0 (student project campus nav)"
}

def wiki_get_summary(term: str) -> Optional[str]:
    try:
        resp = requests.get(
            "https://en.wikipedia.org/w/api.php",
            params={"action": "query", "list": "search", "srsearch": term, "format": "json", "srlimit": 1},
            headers=WIKI_HEADERS,
            timeout=5,
        )
        resp.raise_for_status()
        results = resp.json().get("query", {}).get("search", [])
        if not results:
            return None
        title = results[0]["title"]
        
        summary_resp = requests.get(
            f"https://en.wikipedia.org/api/rest_v1/page/summary/{requests.utils.quote(title)}",
            headers=WIKI_HEADERS,
            timeout=5,
        )
        if summary_resp.status_code == 200:
            extract = summary_resp.json().get("extract", "").strip()
            if extract:
                sentences = re.split(r"(?<=[.!?])\s+", extract)
                return " ".join(sentences[:2])
    except Exception as e:
        logging.error(f"Wikipedia error: {e}")
    return None

# ---- Gemini AI Brain ----
def get_gemini_response(prompt: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "I am operating in offline campus mode, sir."
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        system_prompt = (
            "You are JARVIS, the intelligent voice assistant for the BIT campus map platform. "
            "Keep answers concise (1-2 short sentences max). Address the user as 'sir'."
        )
        response = client.models.generate_content(
            model="gemini-3.7-flash",
            contents=prompt,
            config={"system_instruction": system_prompt}
        )
        return response.text
    except Exception as e:
        logging.error(f"Gemini error: {e}")
        return "I couldn't reach the AI brain right now, sir."

# ---- Campus Keyword Matcher ----
CAMPUS_KEYWORDS = {
    "kaveri": ("kaveri", "Kaveri Hostel"),
    "bhavani": ("middle-bhavani", "Bhavani Hostel"),
    "sf block": ("sf-block", "SF Block Labs"),
    "ib block": ("ib-block", "IB Block"),
    "as block": ("as-block", "AS Block"),
    "mechanic": ("mechanic-block", "Mechanical Block"),
    "sunflower": ("sunflower-block", "Sunflower Block"),
    "auditorium": ("main-auditorium", "Main Auditorium"),
    "library": ("library", "Campus Library"),
    "canteen": ("cafeteria", "Campus Cafeteria"),
    "cafeteria": ("cafeteria", "Campus Cafeteria"),
    "boys mess": ("boys-mess", "Boys Mess"),
    "girls mess": ("girls-mess", "Girls Mess"),
    "girls hostel": ("girls-hostel", "Girls Hostel"),
    "medical": ("medical-center", "Medical Centre"),
    "football": ("football-ground", "Football Ground"),
    "cricket": ("cricket-ground", "Cricket Ground"),
    "nri hostel": ("nri-hostel", "NRI Hostel"),
    "main gate": ("main-gate", "Main Entrance Gate"),
}

class CommandRequest(BaseModel):
    query: str

@app.get("/api/voice/health")
def health_check():
    return {"status": "online", "system": "JARVIS BIT-map Voice AI", "time": dt.datetime.now().isoformat()}

@app.post("/api/voice/command")
def process_command(req: CommandRequest):
    query = req.query.lower().strip()
    logging.info(f"Received voice command: {query}")
    
    response_text = ""
    target_place_id = None
    target_place_name = None

    # 1. Check for campus navigation matching
    for kw, (place_id, place_name) in CAMPUS_KEYWORDS.items():
        if kw in query:
            target_place_id = place_id
            target_place_name = place_name
            response_text = f"Navigating to {place_name}, sir."
            break

    # 2. Time query
    if not response_text and "time" in query:
        now_str = dt.datetime.now().strftime("%I:%M %p")
        response_text = f"The time is {now_str}, sir."

    # 3. Date query
    if not response_text and "date" in query:
        date_str = dt.datetime.now().strftime("%d %B %Y")
        response_text = f"Today is {date_str}, sir."

    # 4. Wikipedia query
    if not response_text and ("wikipedia" in query or "who is" in query or "what is" in query):
        clean_term = re.sub(r"\b(wikipedia|who is|what is|tell me about|search for)\b", "", query).strip()
        if clean_term:
            summary = wiki_get_summary(clean_term)
            if summary:
                response_text = summary

    # 5. Fallback to Gemini AI
    if not response_text:
        response_text = get_gemini_response(query)

    # Generate Speech Audio Base64
    audio_data = generate_tts_base64(response_text)

    return {
        "query": query,
        "response_text": response_text,
        "target_place_id": target_place_id,
        "target_place_name": target_place_name,
        "audio_base64": audio_data,
    }

@app.post("/api/voice/process-audio")
async def process_audio(file: UploadFile = File(...)):
    """Transcribe uploaded audio clip using speech_recognition and return JARVIS response."""
    try:
        import speech_recognition as sr
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        recognizer = sr.Recognizer()
        with sr.AudioFile(tmp_path) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)

        os.remove(tmp_path)
        return process_command(CommandRequest(query=text))
    except Exception as e:
        logging.error(f"Speech recognition failed: {e}")
        return JSONResponse(
            status_code=400,
            content={"error": "Could not understand audio", "details": str(e)}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
