from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from google import genai
import os
import json
import math
import re
import base64
import hashlib
import hmac
import secrets
import smtplib
from datetime import datetime, timezone
from dotenv import load_dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

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


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(password: str, salt: str | None = None) -> str:
    resolved_salt = salt or secrets.token_hex(16)
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        resolved_salt.encode("utf-8"),
        100_000,
    )
    digest = base64.b64encode(derived).decode("utf-8")
    return f"{resolved_salt}${digest}"


def verify_password(password: str, stored_value: str) -> bool:
    try:
        salt, _ = stored_value.split("$", 1)
    except ValueError:
        return False
    candidate = hash_password(password, salt)
    return hmac.compare_digest(candidate, stored_value)


def generate_join_code() -> str:
    return secrets.token_hex(3).upper()


def make_member_id(code: str, index: int) -> str:
    return f"MEM-{code}-{index:02d}"


def member_score(member: dict) -> int:
    history = member.get("repayment_history") or [100]
    average = sum(history) / max(len(history), 1)
    penalty = 0
    if member.get("status") == "grace":
        penalty = 30
    if member.get("status") == "overdue":
        penalty = 80
    return int(min(1000, max(300, average * 8 + 180 - penalty)))


def build_member(name: str, email: str, picture: str | None, code: str, index: int) -> dict:
    due_date = datetime.now(timezone.utc).date().isoformat()
    member = {
        "id": make_member_id(code, index),
        "name": name,
        "email": email.lower(),
        "picture": picture,
        "wallet_balance": 100000,
        "status": "grace",
        "repayment_history": [100, 100],
        "total_contributed": 0,
        "due_date": due_date,
        "last_paid_on": None,
    }
    member["score"] = member_score(member)
    return member


def add_activity(fund: dict, title: str, detail: str, activity_type: str = "system") -> None:
    item = {
        "id": f"activity-{int(datetime.now(timezone.utc).timestamp() * 1000)}-{secrets.token_hex(3)}",
        "title": title,
        "detail": detail,
        "type": activity_type,
        "timestamp": utc_now_iso(),
    }
    fund["activity"] = [item, *fund.get("activity", [])][:30]


def recompute_fund(fund: dict) -> dict:
    members = fund.get("members", [])
    for member in members:
        member["score"] = member_score(member)

    fund["trust_health"] = (
        round(sum(member["score"] for member in members) / (len(members) * 10))
        if members
        else 0
    )

    auction = fund["auction"]
    auction["pool_amount"] = len(members) * fund["monthly_installment"]
    previous_winner_emails = {
        entry.get("winner_email")
        for entry in auction.get("previous_winners", [])
        if entry.get("winner_email")
    }
    auction["eligible_members"] = [
        member["email"] for member in members if member["email"] not in previous_winner_emails
    ]

    history = auction.get("history", [])
    if history:
        history.sort(key=lambda item: item["amount"])
        leader = history[0]
        auction["current_bid"] = leader["amount"]
        auction["highest_bidder"] = leader["bidder"]
        auction["highest_bidder_email"] = leader["bidder_email"]
    else:
        auction["current_bid"] = auction["pool_amount"]
        auction["highest_bidder"] = None
        auction["highest_bidder_email"] = None

    auction["time_left"] = max(0, int(auction.get("time_left", 1800)))
    return fund


def serialize_member(member: dict, current_email: str | None) -> dict:
    return {
        "id": member["id"],
        "name": member["name"],
        "email": member["email"],
        "picture": member.get("picture"),
        "score": member["score"],
        "status": member["status"],
        "repaymentHistory": member["repayment_history"],
        "totalContributed": member["total_contributed"],
        "dueDate": member["due_date"],
        "lastPaidOn": member.get("last_paid_on"),
        "walletBalance": member.get("wallet_balance", 0),
        "isCurrentUser": current_email == member["email"],
    }


def serialize_fund(fund: dict, current_email: str | None) -> dict:
    members = [serialize_member(member, current_email) for member in fund.get("members", [])]
    me = next((member for member in members if member["email"] == current_email), None)
    auction = fund["auction"]

    return {
        "fundId": fund["_id"],
        "fundName": fund["name"],
        "fundCode": fund["code"],
        "purpose": fund["purpose"],
        "groupSizeTarget": fund["group_size"],
        "durationMonths": fund["duration_months"],
        "memberCount": len(members),
        "availableSlots": max(fund["group_size"] - len(members), 0),
        "poolTotal": fund["pool_total"],
        "monthlyInstallment": fund["monthly_installment"],
        "currentCycle": fund["current_cycle"],
        "trustHealth": fund["trust_health"],
        "members": members,
        "auction": {
            "isActive": auction["is_active"],
            "currentBid": auction["current_bid"],
            "highestBidder": auction.get("highest_bidder"),
            "highestBidderEmail": auction.get("highest_bidder_email"),
            "timeLeft": auction["time_left"],
            "history": auction.get("history", []),
            "poolAmount": auction["pool_amount"],
            "bidIncrement": auction["bid_increment"],
            "eligibleMembers": auction.get("eligible_members", []),
            "previousWinners": auction.get("previous_winners", []),
            "lastResult": auction.get("last_result"),
        },
        "contributionHistory": fund.get("contribution_history", []),
        "activity": fund.get("activity", []),
        "myWalletBalance": me["walletBalance"] if me else 0,
        "myMemberId": me["id"] if me else None,
        "isCreator": fund["creator_email"] == current_email,
        "creatorName": fund["creator_name"],
    }


def find_member_by_id(fund: dict, member_id: str) -> dict | None:
    return next((member for member in fund.get("members", []) if member["id"] == member_id), None)


def find_member_by_email(fund: dict, email: str) -> dict | None:
    target = email.lower()
    return next((member for member in fund.get("members", []) if member["email"] == target), None)


def append_contribution_history(fund: dict, member: dict, amount: int, status: str, note: str) -> None:
    item = {
        "id": f"txn-{int(datetime.now(timezone.utc).timestamp() * 1000)}-{secrets.token_hex(3)}",
        "memberId": member["id"],
        "memberName": member["name"],
        "amount": amount,
        "status": status,
        "timestamp": utc_now_iso(),
        "note": note,
    }
    fund["contribution_history"] = [item, *fund.get("contribution_history", [])][:60]


def create_fund_document(payload: dict) -> dict:
    code = generate_join_code()
    creator = build_member(
        payload["creator_name"],
        payload["creator_email"],
        payload.get("creator_picture"),
        code,
        1,
    )
    fund = {
        "_id": secrets.token_hex(12),
        "code": code,
        "name": payload["fund_name"],
        "purpose": payload["purpose"],
        "creator_name": payload["creator_name"],
        "creator_email": payload["creator_email"].lower(),
        "group_size": payload["group_size"],
        "duration_months": payload["duration_months"],
        "monthly_installment": payload["monthly_installment"],
        "pool_total": 0,
        "current_cycle": 1,
        "trust_health": 0,
        "members": [creator],
        "contribution_history": [],
        "activity": [],
        "auction": {
            "is_active": True,
            "current_bid": payload["monthly_installment"],
            "highest_bidder": None,
            "highest_bidder_email": None,
            "time_left": 1800,
            "history": [],
            "pool_amount": payload["monthly_installment"],
            "bid_increment": max(500, payload["monthly_installment"] // 20),
            "eligible_members": [payload["creator_email"].lower()],
            "previous_winners": [],
            "last_result": None,
        },
        "created_at": utc_now_iso(),
        "updated_at": utc_now_iso(),
    }
    add_activity(
        fund,
        "Fund created",
        f"{payload['creator_name']} created {payload['fund_name']} with code {code}.",
        "system",
    )
    return recompute_fund(fund)


def send_invite_email_via_smtp(payload: dict) -> None:
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "465"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    from_email = os.getenv("SMTP_FROM_EMAIL")
    from_name = os.getenv("SMTP_FROM_NAME", "ArthaNetra Demo")

    if not smtp_user or not smtp_pass or not from_email:
        raise HTTPException(
            status_code=503,
            detail="SMTP is not configured yet. Add SMTP_USER, SMTP_PASS, and SMTP_FROM_EMAIL in the backend env.",
        )

    html = f"""
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2>You're invited to join {payload['fundName']}</h2>
      <p>{payload['inviterName']} invited you to join the live ArthaNetra chit fund room.</p>
      <p><strong>Fund Code:</strong> {payload['fundCode']}</p>
      <p><strong>Join Page:</strong> <a href="{payload['joinPageUrl']}">{payload['joinPageUrl']}</a></p>
      <p>{payload['message']}</p>
      <p style="margin-top:24px">Open the join page and enter the fund code above to join the chit fund room.</p>
      <p style="color:#6b7280;font-size:12px">This invite was sent from the ArthaNetra demo using Gmail SMTP.</p>
    </div>
    """.strip()

    message = MIMEMultipart("alternative")
    message["Subject"] = f"You're invited to join {payload['fundName']}"
    message["From"] = f"{from_name} <{from_email}>"
    message["To"] = payload["recipientEmail"]
    message.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10) as server:
            server.login(smtp_user, smtp_pass)
            server.sendmail(from_email, [payload["recipientEmail"]], message.as_string())
    except Exception as error:
        raise HTTPException(status_code=502, detail="Could not send invite email through Gmail SMTP.") from error


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


class GoogleUserProfile(BaseModel):
    id: str
    name: str
    email: str
    picture: str | None = None


class AuthRegister(BaseModel):
    name: str
    email: str
    password: str


class AuthLogin(BaseModel):
    email: str
    password: str


class CreateLiveFundRequest(BaseModel):
    fundName: str
    purpose: str
    groupSize: int
    durationMonths: int
    monthlyInstallment: int
    creatorName: str
    creatorEmail: str
    creatorPicture: str | None = None


class JoinLiveFundRequest(BaseModel):
    code: str
    name: str
    email: str
    picture: str | None = None


class ContributionActionRequest(BaseModel):
    memberId: str


class MemberStatusUpdateRequest(BaseModel):
    memberId: str
    status: str


class LiveAuctionBidRequest(BaseModel):
    bidderEmail: str
    bidderName: str
    amount: int


class InviteMemberRequest(BaseModel):
    recipientEmail: str
    inviterEmail: str
    inviterName: str


class RequestJoinCodeEmailRequest(BaseModel):
    recipientEmail: str
    recipientName: str


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
    state = await db.funds.find_one(sort=[("updated_at", -1)])
    if not state:
        return {"msg": "No active fund found"}
    recompute_fund(state)
    return serialize_fund(state, None)


@app.post("/api/auth/register")
async def register_user(payload: AuthRegister):
    email = payload.email.strip().lower()
    name = payload.name.strip()
    password = payload.password

    if not name:
        raise HTTPException(status_code=400, detail="Name is required.")
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Enter a valid email address.")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    now = utc_now_iso()
    user_doc = {
        "auth_provider": "local",
        "name": name,
        "email": email,
        "password_hash": hash_password(password),
        "picture": None,
        "created_at": now,
        "last_login_at": now,
    }
    await db.users.insert_one(user_doc)

    return {
        "user": {
            "id": email,
            "name": name,
            "email": email,
            "picture": None,
            "provider": "local",
        }
    }


@app.post("/api/auth/login")
async def login_user(payload: AuthLogin):
    email = payload.email.strip().lower()
    password = payload.password

    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    password_hash = user.get("password_hash")
    if not password_hash:
        raise HTTPException(status_code=400, detail="This account uses Google sign-in. Use Google login.")
    if not verify_password(password, password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login_at": utc_now_iso()}},
    )

    return {
        "user": {
            "id": str(user.get("_id", email)),
            "name": user.get("name", "Member"),
            "email": user["email"],
            "picture": user.get("picture"),
            "provider": "local",
        }
    }


@app.post("/api/auth/google-user")
async def upsert_google_user(profile: GoogleUserProfile):
    await db.users.update_one(
        {"email": profile.email.lower()},
        {
            "$set": {
                "auth_provider": "google",
                "google_id": profile.id,
                "name": profile.name,
                "email": profile.email.lower(),
                "picture": profile.picture,
                "last_login_at": utc_now_iso(),
            },
            "$setOnInsert": {
                "created_at": utc_now_iso(),
            }
        },
        upsert=True,
    )
    return {
        "status": "Google user stored",
        "user": {
            "id": profile.id,
            "name": profile.name,
            "email": profile.email.lower(),
            "picture": profile.picture,
            "provider": "google",
        },
    }


@app.get("/api/funds/by-user")
async def list_funds_for_user(email: str):
    normalized = email.strip().lower()
    cursor = db.funds.find({"members.email": normalized}).sort("updated_at", -1)
    funds = []
    async for fund in cursor:
        funds.append(
            {
                "fundId": fund["_id"],
                "fundName": fund["name"],
                "fundCode": fund["code"],
                "memberCount": len(fund.get("members", [])),
                "currentCycle": fund.get("current_cycle", 1),
                "poolTotal": fund.get("pool_total", 0),
            }
        )
    return {"funds": funds}


@app.get("/api/funds/public")
async def list_public_funds():
    cursor = db.funds.find({"group_size": {"$gt": 0}}).sort("updated_at", -1)
    funds = []
    async for fund in cursor:
        recompute_fund(fund)
        if len(fund.get("members", [])) >= fund["group_size"]:
            continue
        funds.append(
            {
                "fundId": fund["_id"],
                "fundName": fund["name"],
                "purpose": fund["purpose"],
                "creatorName": fund["creator_name"],
                "memberCount": len(fund.get("members", [])),
                "availableSlots": max(fund["group_size"] - len(fund.get("members", [])), 0),
                "durationMonths": fund["duration_months"],
                "monthlyInstallment": fund["monthly_installment"],
            }
        )
    return {"funds": funds}


@app.post("/api/funds/create")
async def create_live_fund(payload: CreateLiveFundRequest):
    if payload.groupSize < 2:
        raise HTTPException(status_code=400, detail="Group size must be at least 2.")
    if payload.monthlyInstallment <= 0:
        raise HTTPException(status_code=400, detail="Monthly installment must be greater than zero.")

    fund_doc = create_fund_document(
        {
            "fund_name": payload.fundName.strip(),
            "purpose": payload.purpose.strip(),
            "group_size": payload.groupSize,
            "duration_months": payload.durationMonths,
            "monthly_installment": payload.monthlyInstallment,
            "creator_name": payload.creatorName.strip(),
            "creator_email": payload.creatorEmail.strip().lower(),
            "creator_picture": payload.creatorPicture,
        }
    )
    await db.funds.insert_one(fund_doc)
    return {
        "message": "Fund created successfully.",
        "fund": serialize_fund(fund_doc, payload.creatorEmail.strip().lower()),
    }


@app.post("/api/funds/join")
async def join_live_fund(payload: JoinLiveFundRequest):
    code = payload.code.strip().upper()
    email = payload.email.strip().lower()
    fund = await db.funds.find_one({"code": code})
    if not fund:
        raise HTTPException(status_code=404, detail="No chit fund found with that code.")
    if len(fund.get("members", [])) >= fund["group_size"]:
        raise HTTPException(status_code=409, detail="This chit fund is already full.")

    existing_member = find_member_by_email(fund, email)
    if existing_member:
        return {
            "message": "You are already part of this chit fund.",
            "fund": serialize_fund(recompute_fund(fund), email),
        }

    new_member = build_member(payload.name.strip(), email, payload.picture, fund["code"], len(fund["members"]) + 1)
    fund["members"].append(new_member)
    fund["updated_at"] = utc_now_iso()
    add_activity(
        fund,
        "New member joined",
        f"{payload.name.strip()} joined via code {fund['code']}.",
        "member",
    )
    recompute_fund(fund)
    await db.funds.replace_one({"_id": fund["_id"]}, fund)

    return {
        "message": "Joined chit fund successfully.",
        "fund": serialize_fund(fund, email),
    }


@app.get("/api/funds/{fund_id}")
async def get_live_fund(fund_id: str, email: str | None = None):
    fund = await db.funds.find_one({"_id": fund_id})
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found.")
    recompute_fund(fund)
    return {"fund": serialize_fund(fund, email.strip().lower() if email else None)}


@app.post("/api/funds/{fund_id}/invite")
async def invite_member_to_fund(fund_id: str, payload: InviteMemberRequest):
    fund = await db.funds.find_one({"_id": fund_id})
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found.")

    inviter_email = payload.inviterEmail.strip().lower()
    if fund["creator_email"] != inviter_email:
        raise HTTPException(status_code=403, detail="Only the fund creator can send email invites.")

    invite_payload = {
        "recipientEmail": payload.recipientEmail.strip().lower(),
        "inviterName": payload.inviterName.strip(),
        "inviterEmail": inviter_email,
        "fundName": fund["name"],
        "fundCode": fund["code"],
        "creatorName": fund["creator_name"],
        "joinPageUrl": os.getenv("FRONTEND_BASE_URL", "http://127.0.0.1:5173") + "/join",
        "message": f"You have been invited to join {fund['name']}. Use code {fund['code']} on the join page.",
    }

    send_invite_email_via_smtp(invite_payload)

    fund["updated_at"] = utc_now_iso()
    add_activity(
        fund,
        "Invite email sent",
        f"{payload.inviterName.strip()} sent a join invite to {payload.recipientEmail.strip().lower()}.",
        "system",
    )
    await db.funds.replace_one({"_id": fund["_id"]}, fund)

    return {
        "message": f"Invite sent to {payload.recipientEmail.strip().lower()} through Gmail SMTP.",
        "fund": serialize_fund(fund, inviter_email),
    }


@app.post("/api/funds/{fund_id}/request-join-code")
async def request_join_code_email(fund_id: str, payload: RequestJoinCodeEmailRequest):
    fund = await db.funds.find_one({"_id": fund_id})
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found.")

    recipient_email = payload.recipientEmail.strip().lower()
    if len(fund.get("members", [])) >= fund["group_size"]:
        raise HTTPException(status_code=409, detail="This chit fund is already full.")

    invite_payload = {
        "recipientEmail": recipient_email,
        "inviterName": fund["creator_name"],
        "inviterEmail": fund["creator_email"],
        "fundName": fund["name"],
        "fundCode": fund["code"],
        "creatorName": fund["creator_name"],
        "joinPageUrl": os.getenv("FRONTEND_BASE_URL", "http://127.0.0.1:5173") + "/join",
        "message": (
            f"Hi {payload.recipientName.strip()}, use code {fund['code']} on the join page to join "
            f"{fund['name']}."
        ),
    }

    send_invite_email_via_smtp(invite_payload)

    fund["updated_at"] = utc_now_iso()
    add_activity(
        fund,
        "Join code requested",
        f"{recipient_email} requested the join email for this fund.",
        "member",
    )
    await db.funds.replace_one({"_id": fund["_id"]}, fund)

    return {
        "message": f"Join code email sent to {recipient_email}.",
    }


@app.post("/api/funds/{fund_id}/contributions/pay")
async def pay_live_contribution(fund_id: str, payload: ContributionActionRequest):
    fund = await db.funds.find_one({"_id": fund_id})
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found.")

    member = find_member_by_id(fund, payload.memberId)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")
    if member["status"] == "paid":
        return {"message": f"{member['name']} is already paid.", "fund": serialize_fund(fund, member["email"])}
    if member["wallet_balance"] < fund["monthly_installment"]:
        raise HTTPException(status_code=400, detail="This member does not have enough demo balance.")

    member["wallet_balance"] -= fund["monthly_installment"]
    member["total_contributed"] += fund["monthly_installment"]
    member["status"] = "paid"
    member["last_paid_on"] = utc_now_iso()
    member["repayment_history"] = [*member.get("repayment_history", []), 100][-6:]
    member["score"] = member_score(member)
    fund["pool_total"] += fund["monthly_installment"]
    fund["updated_at"] = utc_now_iso()
    append_contribution_history(
        fund,
        member,
        fund["monthly_installment"],
        "paid",
        "Contribution collected successfully.",
    )
    add_activity(
        fund,
        "Contribution received",
        f"{member['name']} contributed {format_inr(fund['monthly_installment'])}.",
        "payment",
    )
    recompute_fund(fund)
    await db.funds.replace_one({"_id": fund["_id"]}, fund)
    return {"message": f"{member['name']} marked as paid.", "fund": serialize_fund(fund, member["email"])}


@app.post("/api/funds/{fund_id}/contributions/bulk")
async def bulk_collect_live_contributions(fund_id: str):
    fund = await db.funds.find_one({"_id": fund_id})
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found.")

    processed = 0
    for member in fund.get("members", []):
        if member["status"] == "paid":
            continue
        if member["wallet_balance"] < fund["monthly_installment"]:
            member["status"] = "overdue"
            continue
        member["wallet_balance"] -= fund["monthly_installment"]
        member["total_contributed"] += fund["monthly_installment"]
        member["status"] = "paid"
        member["last_paid_on"] = utc_now_iso()
        member["repayment_history"] = [*member.get("repayment_history", []), 100][-6:]
        member["score"] = member_score(member)
        processed += 1
        append_contribution_history(
            fund,
            member,
            fund["monthly_installment"],
            "paid",
            "Collected through bulk contribution.",
        )

    fund["pool_total"] += processed * fund["monthly_installment"]
    fund["updated_at"] = utc_now_iso()
    add_activity(
        fund,
        "Bulk collection run",
        f"{processed} member(s) were collected in one action.",
        "payment",
    )
    recompute_fund(fund)
    await db.funds.replace_one({"_id": fund["_id"]}, fund)
    return {
        "message": f"Bulk collection processed for {processed} member(s).",
        "processed": processed,
        "fund": serialize_fund(fund, None),
    }


@app.post("/api/funds/{fund_id}/members/status")
async def update_live_member_status(fund_id: str, payload: MemberStatusUpdateRequest):
    if payload.status not in {"paid", "grace", "overdue"}:
        raise HTTPException(status_code=400, detail="Unsupported status.")

    fund = await db.funds.find_one({"_id": fund_id})
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found.")
    member = find_member_by_id(fund, payload.memberId)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")

    member["status"] = payload.status
    member["score"] = member_score(member)
    fund["updated_at"] = utc_now_iso()
    append_contribution_history(
        fund,
        member,
        fund["monthly_installment"] if payload.status == "paid" else 0,
        payload.status,
        f"Member moved to {payload.status} status.",
    )
    add_activity(
        fund,
        "Member status updated",
        f"{member['name']} is now marked as {payload.status}.",
        "alert",
    )
    recompute_fund(fund)
    await db.funds.replace_one({"_id": fund["_id"]}, fund)
    return {"message": f"{member['name']} updated.", "fund": serialize_fund(fund, member["email"])}


@app.post("/api/funds/{fund_id}/auction/bid")
async def place_live_bid(fund_id: str, payload: LiveAuctionBidRequest):
    fund = await db.funds.find_one({"_id": fund_id})
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found.")
    recompute_fund(fund)

    auction = fund["auction"]
    bidder = find_member_by_email(fund, payload.bidderEmail)
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder is not a member of this fund.")
    if not auction["is_active"]:
        raise HTTPException(status_code=400, detail="The auction is already closed.")
    if payload.bidderEmail.lower() not in auction["eligible_members"]:
        raise HTTPException(status_code=400, detail="This member is not eligible to bid in this cycle.")
    if payload.amount <= 0 or payload.amount > auction["pool_amount"]:
        raise HTTPException(status_code=400, detail="Bid must stay within the available pool.")
    if payload.amount >= auction["current_bid"]:
        raise HTTPException(
            status_code=400,
            detail=f"Bid must be lower than {format_inr(auction['current_bid'])}.",
        )
    if auction["current_bid"] - payload.amount < auction["bid_increment"]:
        raise HTTPException(
            status_code=400,
            detail=f"Each bid must improve by at least {format_inr(auction['bid_increment'])}.",
        )

    auction["history"] = [
        {
            "bidder": payload.bidderName,
            "bidder_email": payload.bidderEmail.lower(),
            "amount": payload.amount,
            "time": utc_now_iso(),
        },
        *auction.get("history", []),
    ][:20]
    fund["updated_at"] = utc_now_iso()
    add_activity(
        fund,
        "New reverse bid",
        f"{payload.bidderName} placed {format_inr(payload.amount)}.",
        "bid",
    )
    recompute_fund(fund)
    await db.funds.replace_one({"_id": fund["_id"]}, fund)
    return {
        "message": "Bid accepted. You are now leading the auction.",
        "fund": serialize_fund(fund, payload.bidderEmail.lower()),
    }


@app.post("/api/funds/{fund_id}/auction/close")
async def close_live_auction(fund_id: str):
    fund = await db.funds.find_one({"_id": fund_id})
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found.")
    recompute_fund(fund)

    auction = fund["auction"]
    if not auction["history"]:
        raise HTTPException(status_code=400, detail="No bids have been placed yet.")
    if not auction["is_active"] and auction.get("last_result"):
        return {
            "message": "Auction is already closed.",
            "result": auction["last_result"],
            "fund": serialize_fund(fund, None),
        }

    leader = sorted(auction["history"], key=lambda item: item["amount"])[0]
    winner = find_member_by_email(fund, leader["bidder_email"])
    if not winner:
        raise HTTPException(status_code=404, detail="Winning member not found.")

    winning_bid = leader["amount"]
    payout = winning_bid
    group_dividend = max(auction["pool_amount"] - winning_bid, 0)
    bonus_per_member = round(group_dividend / max(len(fund["members"]), 1))

    for member in fund["members"]:
        member["wallet_balance"] += bonus_per_member
    winner["wallet_balance"] += payout

    fund["pool_total"] = max(fund["pool_total"] - auction["pool_amount"], 0)
    auction["is_active"] = False
    auction["time_left"] = 0
    auction["last_result"] = {
        "cycle": fund["current_cycle"],
        "winner": winner["name"],
        "winnerEmail": winner["email"],
        "winningBid": winning_bid,
        "payout": payout,
        "groupDividend": group_dividend,
        "bonusPerMember": bonus_per_member,
        "closedAt": utc_now_iso(),
    }
    auction["previous_winners"] = [
        {
            "month": fund["current_cycle"],
            "winner": winner["name"],
            "winner_email": winner["email"],
            "amount": winning_bid,
        },
        *auction.get("previous_winners", []),
    ][:12]
    fund["updated_at"] = utc_now_iso()
    add_activity(
        fund,
        "Auction closed",
        f"{winner['name']} won {format_inr(payout)}. Each member received {format_inr(bonus_per_member)} demo dividend.",
        "system",
    )
    recompute_fund(fund)
    await db.funds.replace_one({"_id": fund["_id"]}, fund)
    return {
        "message": "Auction closed and balances distributed.",
        "result": auction["last_result"],
        "fund": serialize_fund(fund, winner["email"]),
    }


@app.post("/api/auction/bid")
async def place_bid(bid: AuctionBid):
    await db.bids.insert_one(bid.dict())
    return {"status": "Bid recorded on chain (mock)"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
