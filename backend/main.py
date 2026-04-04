from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from google import genai
import os
import json
import math
import re
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ArthaNetra Autonomous Backend")


def format_inr(amount: float) -> str:
    value = int(round(amount))
    sign = "-" if value < 0 else ""
    digits = str(abs(value))
    if len(digits) <= 3:
        return f"{sign}Rs {digits}"
    last_three = digits[-3:]
    remaining = digits[:-3]
    parts = []
    while len(remaining) > 2:
        parts.append(remaining[-2:])
        remaining = remaining[:-2]
    if remaining:
        parts.append(remaining)
    formatted = ",".join(reversed(parts)) + "," + last_three
    return f"{sign}Rs {formatted}"


def clean_text(value) -> str:
    return str(value).replace("â¹", "Rs ").replace("₹", "Rs ").strip()


def normalize_money(value, fallback: str) -> str:
    if value is None:
        return fallback
    if isinstance(value, (int, float)):
        return format_inr(value)
    text = clean_text(value)
    if not text:
        return fallback
    if text.lower().startswith("rs"):
        return text
    number_match = re.fullmatch(r"[\d,]+", text)
    if number_match:
        return format_inr(float(text.replace(",", "")))
    return text


def normalize_confidence(value, fallback: str) -> str:
    if value is None:
        return fallback
    text = clean_text(value)
    match = re.search(r"(\d+)", text)
    return f"{match.group(1)}%" if match else fallback


def normalize_blueprint(parsed: dict, fallback: dict) -> dict:
    return {
        "fundName": clean_text(parsed.get("fundName") or fallback["fundName"]),
        "summary": clean_text(parsed.get("summary") or fallback["summary"]),
        "poolTotal": normalize_money(parsed.get("poolTotal"), fallback["poolTotal"]),
        "monthlyInstallment": normalize_money(parsed.get("monthlyInstallment"), fallback["monthlyInstallment"]),
        "riskLevel": clean_text(parsed.get("riskLevel") or fallback["riskLevel"]),
        "dividendEstimate": normalize_money(parsed.get("dividendEstimate"), fallback["dividendEstimate"]),
        "confidence": normalize_confidence(parsed.get("confidence"), fallback["confidence"]),
    }


def infer_fund_name(intent: str) -> str:
    normalized = intent.strip()
    if not normalized:
        return "Custom Goal Fund"

    lowered = normalized.lower()
    keyword_map = [
        ("trip", "Travel Fund"),
        ("travel", "Travel Fund"),
        ("vacation", "Travel Fund"),
        ("wedding", "Wedding Fund"),
        ("education", "Education Fund"),
        ("study", "Education Fund"),
        ("medical", "Medical Fund"),
        ("house", "Home Fund"),
        ("home", "Home Fund"),
        ("business", "Business Fund"),
        ("shop", "Business Fund"),
        ("vehicle", "Vehicle Fund"),
        ("car", "Vehicle Fund"),
    ]
    for keyword, label in keyword_map:
        if keyword in lowered:
            return label

    words = re.findall(r"[A-Za-z]+", normalized)
    if not words:
        return "Custom Goal Fund"
    return f"{' '.join(words[:3]).title()} Fund"


def extract_rupee_amount(intent: str) -> float | None:
    match = re.search(r"(\d[\d,]*)", intent)
    if not match:
        return None
    return float(match.group(1).replace(",", ""))


def build_fallback_blueprint(intent: str, group_size: int, duration_months: int) -> dict:
    parsed_amount = extract_rupee_amount(intent)
    total_goal = parsed_amount if parsed_amount and parsed_amount > 0 else group_size * duration_months * 1000
    monthly_installment = math.ceil(total_goal / max(group_size * duration_months, 1))
    confidence = 90 if group_size <= 12 else 84

    return {
        "fundName": infer_fund_name(intent),
        "summary": f"A {duration_months}-month savings plan for {group_size} members built around your stated goal.",
        "poolTotal": format_inr(total_goal),
        "monthlyInstallment": format_inr(monthly_installment),
        "riskLevel": "Low" if group_size <= 12 else "Medium",
        "dividendEstimate": format_inr(max(monthly_installment * 0.08, 100)),
        "confidence": f"{confidence}%",
    }


# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGODB_URI)
db = client.arthanetra

# Gemini Setup
GEMINI_API_KEY = os.getenv("VITE_GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
ai_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


class FundIntent(BaseModel):
    intent: str
    groupSize: int
    durationMonths: int


class AuctionBid(BaseModel):
    amount: float
    bidder: str


@app.get("/")
async def root():
    return {"status": "ArthaNetra Collective Finance System Operational"}


@app.post("/api/synthesize")
async def synthesize_blueprint(data: FundIntent):
    fallback = build_fallback_blueprint(data.intent, data.groupSize, data.durationMonths)
    if not ai_client:
        return fallback

    prompt = (
        "You are the ArthaNetra Architect. Build a practical chit fund blueprint.\n"
        f"Goal: {data.intent}\n"
        f"Group size: {data.groupSize}\n"
        f"Duration in months: {data.durationMonths}\n"
        "Treat the rupee amount mentioned in the goal as the total target unless clearly stated otherwise.\n"
        "Return JSON only with these exact keys: "
        "fundName, summary, poolTotal, monthlyInstallment, riskLevel, dividendEstimate, confidence.\n"
        "Rules:\n"
        "- Use 'Rs ' instead of the rupee symbol.\n"
        "- poolTotal must be a formatted money string for the total pool target.\n"
        "- monthlyInstallment must be the per-member monthly contribution as a formatted money string.\n"
        "- dividendEstimate must be a formatted money string.\n"
        "- confidence must be a percentage string like 88%.\n"
        "- Keep summary under 18 words."
    )

    try:
        response = ai_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )
        clean_json = response.text.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(clean_json)
        return normalize_blueprint(parsed, fallback)
    except Exception as exc:
        print(f"AI synthesis failed for model {GEMINI_MODEL}: {exc}")
        return fallback


@app.get("/api/fund/state")
async def get_fund_state():
    state = await db.funds.find_one({"active": True})
    if not state:
        return {"msg": "No active fund found"}
    return state


@app.post("/api/auction/bid")
async def place_bid(bid: AuctionBid):
    await db.bids.insert_one(bid.dict())
    return {"status": "Bid recorded on chain (mock)"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
