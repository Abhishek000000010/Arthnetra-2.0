from fastapi import FastAPI, Query
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
import json
import secrets
import smtplib
import random
import uuid
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
    return str(value).replace("â‚¹", "Rs ").replace("₹", "Rs ").strip()


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
        "dna_classification": {
            "type": "Newbie",
            "emoji": "🌱",
            "color": "#00BCD4",
            "desc": "Just started their journey.",
            "badges": ["Early Stage"]
        }
    }
    member["score"] = member_score(member)
    return member



# --- FUND DNA CORE ENGINE (HACKATHON PRIDE) ---

DEFAULT_DNA_RULES = {
    "version": 1,
    "min_bid_percent": 0.70,        # 70% of pool minimum
    "min_trust_to_bid": 60,         # trust score needed to bid
    "max_strikes_allowed": 3,       # strikes before excluded
    "auction_duration_hours": 48,   # how long auction stays open
    "due_day": 5,                   # 5th of month
    "grace_period_days": 3,         # 3 days grace
    "penalty_type": "flat",         # flat or progressive
    "penalty_value": 500,           # Rs 500 flat penalty
    "penalty_percent": 0.02,        # 2% (used if progressive)
    "reserve_percent": 0.05,        # 5% of pool to reserve
}

def get_default_dna():
    return {
        "version": 1,
        "maturity_score": 15,
        "last_evolution": utc_now_iso(),
        "rules": DEFAULT_DNA_RULES,
        "risk_analysis": {
            "overall_score": 100,
            "level": "LOW",
            "message": "Initial group formation complete. System in observation mode."
        },
        "history": [],
        "observations": ["Genesis block created", "Risk parameters initialized"],
        "insights": ["Collecting initial behavior patterns for liquidity prediction."]
    }

def calculate_cycle_metrics(fund: dict):
    members = fund.get("members", [])
    auction = fund.get("auction", {})
    total = len(members)
    if total == 0: return {}

    on_time = len([m for m in members if m.get("status") == "paid"])
    overdue = len([m for m in members if m.get("status") == "overdue"])
    defaults = len([m for m in members if m.get("status") == "defaulted"])
    
    pool_total = auction.get("pool_amount", 0)
    winning_bid = auction.get("last_result", {}).get("winningBid", pool_total)
    
    # metrics calculation
    return {
        "on_time_rate": on_time / total,
        "late_rate": overdue / total,
        "default_rate": defaults / total,
        "bid_pressure": winning_bid / pool_total if pool_total > 0 else 1.0,
        "avg_trust": sum(m.get("score", 0) for m in members) / (total * 10) # 0-100 scale
    }

def classify_member(member: dict, fund_cycle: int):
    # Behavioral logic
    history = member.get("repayment_history", [])
    total_cycles = len(history)
    on_time_count = len([h for h in history if h >= 100])
    late_count = len([h for h in history if 0 < h < 100])
    default_count = len([h for h in history if h == 0])
    
    trust = member.get("score", 0) / 10 # 0-100
    
    if default_count == 0 and late_count <= 1 and trust >= 85:
        return {
            "type": "Champion",
            "emoji": "🏆",
            "color": "#00D68F",
            "desc": "Consistently reliable. The backbone of the fund.",
            "badges": ["On-Time Specialist", "Fund Anchor"]
        }
    elif default_count == 0 and late_count <= 3 and trust >= 70:
        return {
            "type": "Reliable",
            "emoji": "✅",
            "color": "#6C63FF",
            "desc": "Dependable member with minor delays.",
            "badges": ["Active Contributor"]
        }
    elif default_count == 0 and late_count > 3:
        return {
            "type": "Irregular",
            "emoji": "⚠️",
            "color": "#FFB547",
            "desc": "Pays eventually but struggles with deadlines.",
            "badges": ["Late Settler"]
        }
    elif default_count > 0:
        return {
            "type": "Defaulter",
            "emoji": "❌",
            "color": "#FF0000",
            "desc": "Chronic issues detected. Restricted access.",
            "badges": ["High Risk"]
        }
    else:
        return {
            "type": "Newbie",
            "emoji": "🌱",
            "color": "#00BCD4",
            "desc": "Just started their journey.",
            "badges": ["Early Stage"]
        }

def analyze_group_risk(metrics: dict):
    # Risk Dimension Scoring
    p_health = round(metrics["on_time_rate"] * 100)
    d_risk = round((1 - metrics["default_rate"]) * 100)
    t_health = round(metrics["avg_trust"])
    a_health = round(metrics["bid_pressure"] * 100)
    
    # Weighted Score
    overall = (p_health * 0.35) + (d_risk * 0.35) + (t_health * 0.20) + (a_health * 0.10)
    
    level = "LOW"
    msg = "Fund is healthy. Members are reliable."
    if overall < 50:
        level = "CRITICAL"
        msg = "Immediate intervention required. High default risk."
    elif overall < 65:
        level = "HIGH"
        msg = "Significant risk detected. Rules must be tightened."
    elif overall < 80:
        level = "MEDIUM"
        msg = "Status: Warning. Monitor payment patterns closely."
        
    return {
        "overall_score": round(overall),
        "level": level,
        "message": msg,
        "dimensions": {
            "payment": p_health,
            "default": d_risk,
            "trust": t_health,
            "auction": a_health
        }
    }

def detect_dna_problems(metrics: dict):
    problems = []
    if metrics["default_rate"] > 0.15:
        problems.append({"code": "HIGH_DEFAULT", "msg": f"{metrics['default_rate']*100:.1f}% members defaulted"})
    if metrics["late_rate"] > 0.25:
        problems.append({"code": "HIGH_LATE", "msg": "Payment delays reaching critical threshold"})
    if metrics["bid_pressure"] <= 0.72:
        problems.append({"code": "DESPERATE_BIDDING", "msg": "Winning bid hit the minimum floor"})
    if metrics["avg_trust"] < 65:
        problems.append({"code": "LOW_TRUST", "msg": "Average group trust is declining"})
    return problems

def generate_dna_evolution(problems: dict, rules: dict):
    changes = []
    new_rules = rules.copy()
    
    for p in problems:
        if p["code"] == "HIGH_DEFAULT":
            old = new_rules["min_trust_to_bid"]
            new_rules["min_trust_to_bid"] = min(90, old + 10)
            changes.append({
                "title": "Stricter Bidding",
                "reason": "Default risk detected. Raising trust threshold to protect pool.",
                "before": f"Score > {old}",
                "after": f"Score > {new_rules['min_trust_to_bid']}"
            })
            
        if p["code"] == "HIGH_LATE":
            old = new_rules["due_day"]
            new_rules["due_day"] = min(15, old + 2)
            changes.append({
                "title": "Payment Flexibility",
                "reason": "Detected systematic delays. Aligning due date with current patterns.",
                "before": f"{old}th of month",
                "after": f"{new_rules['due_day']}th of month"
            })
            
        if p["code"] == "DESPERATE_BIDDING":
            old = new_rules["min_bid_percent"]
            new_rules["min_bid_percent"] = min(0.90, old + 0.05)
            changes.append({
                "title": "Bid Floor Raised",
                "reason": "Desperation bidding detected. Raising floor to reduce exploitation.",
                "before": f"{old*100:.0f}%",
                "after": f"{new_rules['min_bid_percent']*100:.0f}%"
            })

    return new_rules, changes

def validate_prediction_accuracy(fund: dict):
    if "prediction_stats" not in fund:
        fund["prediction_stats"] = {
            "total_evaluated": 0,
            "correct_predictions": 0,
            "accuracy_history": []
        }
        
    evaluated_this_cycle = 0
    correct_this_cycle = 0
    
    for m in fund.get("members", []):
        if "lastPrediction" in m:
            pred = m["lastPrediction"].get("riskLevel", "LOW")
            status = m.get("status", "pending")
            
            evaluated_this_cycle += 1
            
            if pred == "HIGH" and status == "overdue":
                correct_this_cycle += 1
            elif pred in ["LOW", "MEDIUM"] and status in ["paid", "grace"]:
                correct_this_cycle += 1
                
    if evaluated_this_cycle > 0:
        fund["prediction_stats"]["total_evaluated"] += evaluated_this_cycle
        fund["prediction_stats"]["correct_predictions"] += correct_this_cycle
        cycle_acc = round((correct_this_cycle / evaluated_this_cycle) * 100, 1)
        fund["prediction_stats"]["accuracy_history"].append({
            "cycle": fund.get("current_cycle", 1),
            "evaluated": evaluated_this_cycle,
            "correct": correct_this_cycle,
            "accuracy": cycle_acc
        })

async def evolve_dna_internal(fund: dict):
    # 0. Validate Predictions
    validate_prediction_accuracy(fund)

    # 1. Metrics
    metrics = calculate_cycle_metrics(fund)
    if not metrics: return fund
    
    # 2. Risk Analysis
    risk = analyze_group_risk(metrics)
    
    # 3. Classify Members
    for m in fund["members"]:
        m["dna_classification"] = classify_member(m, fund["current_cycle"])
        
    # 4. Detect & Evolve
    problems = detect_dna_problems(metrics)
    current_rules = fund.get("dna", {}).get("rules") or DEFAULT_DNA_RULES
    new_rules, changes = generate_dna_evolution(problems, current_rules)
    
    # 5. Build DNA Payload
    dna = fund.get("dna", get_default_dna())
    dna["version"] += 1
    dna["maturity_score"] = min(100, dna["maturity_score"] + (10 if not problems else 5))
    dna["last_evolution"] = utc_now_iso()
    dna["rules"] = new_rules
    dna["risk_analysis"] = risk
    dna["observations"] = [p["msg"] for p in problems] if problems else ["Perfect cycle synchronization observed."]
    dna["insights"] = [c["reason"] for c in changes] if changes else ["System stability verified. Rules unchanged."]
    
    if changes:
        dna["history"].append({
            "version": dna["version"],
            "timestamp": dna["last_evolution"],
            "changes": changes
        })
    
    fund["dna"] = dna
    add_activity(
        fund, 
        "DNA Sequence Mutated", 
        f"AI evolved Fund DNA to v{dna['version']} based on Cycle {fund['current_cycle']} semantics.",
        "system"
    )
    return fund




# VIRTUAL BLOCKCHAIN GLOBAL STATE
VIRTUAL_BLOCK_HEIGHT = 482931

def generate_tx_hash():
    return f"0x{secrets.token_hex(32)}"

def add_activity(fund: dict, title: str, detail: str, type: str = "info", user: str = "System"):
    global VIRTUAL_BLOCK_HEIGHT
    VIRTUAL_BLOCK_HEIGHT += random.randint(3, 12)
    
    activity_entry = {
        "id": secrets.token_hex(12),
        "title": title,
        "detail": detail,
        "type": type,
        "user": user,
        "timestamp": utc_now_iso(),
        "hash": generate_tx_hash(),
        "block": VIRTUAL_BLOCK_HEIGHT,
        "gas_used": random.randint(21000, 48000),
        "unread": True
    }

    if "activity" not in fund:
        fund["activity"] = []
    
    fund["activity"].insert(0, activity_entry)
    if len(fund["activity"]) > 100:
        fund["activity"] = fund["activity"][:100]

    return activity_entry


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


async def serialize_member(member: dict, current_email: str | None) -> dict:
    member_email = member["email"].strip().lower()
    user_for_member = await db.users.find_one({"email": member_email})
    member_wallet = user_for_member.get("wallet_balance", 10000.0) if user_for_member else 10000.0

    return {
        "id": member["id"],
        "name": member["name"],
        "email": member["email"],
        "picture": member.get("picture"),
        "score": member["score"],
        "status": member["status"],
        "repaymentHistory": member.get("repayment_history", []),
        "totalContributed": member.get("total_contributed", 0),
        "dueDate": member.get("due_date", ""),
        "lastPaidOn": member.get("last_paid_on"),
        "walletBalance": member_wallet,
        "isCurrentUser": member["email"] == current_email,
        "dnaClassification": member.get("dna_classification", {
            "type": "Newbie",
            "emoji": "🌱",
            "color": "#00BCD4",
            "desc": "Just started their journey.",
            "badges": ["Early Stage"]
        }),
        "currentRiskLevel": member.get("currentRiskLevel"),
        "lastPrediction": member.get("lastPrediction")
    }


async def serialize_fund(fund: dict, current_email: str | None) -> dict:
    members = []
    for m in fund.get("members", []):
        members.append(await serialize_member(m, current_email))
        
    me = next((member for member in members if member["email"] == current_email), None)
    auction = fund["auction"]
    
    # Fetch global wallet balance for the current user if they are logged in
    global_wallet = 0
    if current_email:
        user_doc = await db.users.find_one({"email": current_email.strip().lower()})
        if user_doc:
            global_wallet = user_doc.get("wallet_balance", 10000.0)

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
        "myWalletBalance": global_wallet,
        "myMemberId": me["id"] if me else None,
        "isCreator": fund["creator_email"] == current_email,
        "creatorName": fund["creator_name"],
        "dna": fund.get("dna", get_default_dna()),
        "predictionStats": fund.get("prediction_stats"),
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
            "current_bid": payload["group_size"] * payload["monthly_installment"],
            "highest_bidder": None,
            "highest_bidder_email": None,
            "time_left": 1800,
            "history": [],
            "pool_amount": payload["group_size"] * payload["monthly_installment"],
            "bid_increment": 1,
            "eligible_members": [payload["creator_email"].lower()],
            "previous_winners": [],
            "last_result": None,
        },
        "dna": get_default_dna(),
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


@app.post("/api/funds/{fund_id}/dna/evolve")
async def evolve_fund_dna(fund_id: str):
    fund = await db.funds.find_one({"_id": fund_id})
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found.")
    
    await evolve_dna_internal(fund)
    await db.funds.replace_one({"_id": fund["_id"]}, fund)
    
    return {
        "message": "ArthaNetra DNA Evolution Complete",
        "fund": await serialize_fund(fund, None)
    }

async def find_or_create_user(email: str, name: str = "Demo User"):
    normalized = email.strip().lower()
    user = await db.users.find_one({"email": normalized})
    if not user:
        user = {
            "name": name,
            "email": normalized,
            "picture": f"https://api.dicebear.com/7.x/avataaars/svg?seed={normalized}",
            "wallet_balance": 10000.0,
            "created_at": utc_now_iso(),
        }
        await db.users.insert_one(user)
    return user




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


@app.get("/api/user/balance")
async def get_user_balance(email: str):
    user = await db.users.find_one({"email": email.strip().lower()})
    if not user:
        return {"walletBalance": 10000.0} # Default for demo
    return {"walletBalance": user.get("wallet_balance", 10000.0)}


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
        "wallet_balance": 10000.0,
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
    user = await db.users.find_one({"email": profile.email.lower()})
    if not user:
        user = {
            "name": profile.name,
            "email": profile.email.lower(),
            "picture": profile.picture,
            "wallet_balance": 10000.0,
            "created_at": utc_now_iso(),
        }
        await db.users.insert_one(user)
    
    return user


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
        "fund": await serialize_fund(fund_doc, payload.creatorEmail.strip().lower()),
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
            "fund": await serialize_fund(recompute_fund(fund), email),
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
        "fund": await serialize_fund(fund, email),
    }


@app.get("/api/funds/{fund_id}")
async def get_live_fund(fund_id: str, email: str | None = None):
    fund = await db.funds.find_one({"_id": fund_id})
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found.")
    recompute_fund(fund)
    return {"fund": await serialize_fund(fund, email.strip().lower() if email else None)}


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
        "fund": await serialize_fund(fund, inviter_email),
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


@app.post("/api/funds/{fund_id}/pay/{member_id}")
async def pay_contribution(fund_id: str, member_id: str):
    fund = await db.funds.find_one({"_id": fund_id})
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")

    member = next((m for m in fund["members"] if m["id"] == member_id), None)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    if member["status"] == "paid":
        return {"message": "Already paid", "fund": await serialize_fund(fund, member["email"])}

    # Logic: Deduct from User's Global Wallet
    member_email = member["email"].strip().lower()
    user = await db.users.find_one({"email": member_email})
    if not user:
        raise HTTPException(status_code=404, detail=f"User profile with email {member_email} not found")
    
    # Ensure wallet_balance is initialized for the demo if missing
    current_balance = user.get("wallet_balance")
    if current_balance is None:
        current_balance = 10000.0
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"wallet_balance": current_balance}})

    cost = fund["monthly_installment"]
    if current_balance < cost:
        raise HTTPException(status_code=400, detail=f"Insufficient wallet balance ({format_inr(current_balance)}). Need {format_inr(cost)}. Top up first!")

    # Perform Deduction
    await db.users.update_one(
        {"email": member["email"]}, 
        {"$inc": {"wallet_balance": -cost}}
    )

    member["status"] = "paid"
    fund["pool_total"] += cost
    fund["updated_at"] = utc_now_iso()
    
    add_activity(
        fund, 
        "Payment Processed", 
        f"{member['name']} paid Rs {cost}. Wallet updated.", 
        "payment",
        amount=cost,
        user=member['name']
    )
    
    await db.funds.replace_one({"_id": fund_id}, fund)
    return {"message": "Payment successful", "fund": await serialize_fund(fund, member["email"])}

@app.post("/api/user/wallet/topup")
async def topup_wallet(email: str, amount: float = 5000.0):
    normalized = email.strip().lower()
    user = await db.users.find_one({"email": normalized})
    if not user:
        raise HTTPException(status_code=404, detail=f"User {normalized} not found")
    
    await db.users.update_one({"email": normalized}, {"$inc": {"wallet_balance": amount}})
    return {"message": f"Added Rs {amount} to your wallet.", "new_balance": (user.get("wallet_balance", 0) or 0) + amount}


@app.post("/api/user/wallet/withdraw")
async def withdraw_wallet(email: str, amount: float):
    normalized = email.strip().lower()
    user = await db.users.find_one({"email": normalized})
    if not user:
        raise HTTPException(status_code=404, detail=f"User {normalized} not found")
    
    current_balance = user.get("wallet_balance", 0) or 0
    if current_balance < amount:
        raise HTTPException(status_code=400, detail="Insufficient funds in your wallet.")
    
    await db.users.update_one({"email": normalized}, {"$inc": {"wallet_balance": -amount}})
    
    # Generate a dummy transaction hash for realism
    tx_hash = "0x" + secrets.token_hex(32)
    
    return {
        "message": f"Withdrawal of Rs {amount} processed successfully.",
        "new_balance": current_balance - amount,
        "transactionHash": tx_hash
    }


@app.post("/api/funds/{fund_id}/contributions/bulk")
async def bulk_collect_live_contributions(fund_id: str):
    fund = await db.funds.find_one({"_id": fund_id})
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found.")

    processed = 0
    members_list = fund.get("members", [])
    cost = fund["monthly_installment"]

    for member in members_list:
        if member["status"] == "paid":
            continue
        
        # Consistent logic: Use Global Wallet
        member_email = member["email"].strip().lower()
        user = await db.users.find_one({"email": member_email})
        global_balance = 10000.0 if not user else user.get("wallet_balance", 10000.0)

        if global_balance < cost:
            member["status"] = "overdue"
            continue
        
        # Deduct from Global Wallet
        if user:
            await db.users.update_one({"_id": user["_id"]}, {"$inc": {"wallet_balance": -cost}})
        
        member["status"] = "paid"
        member["last_paid_on"] = utc_now_iso()
        member["total_contributed"] = member.get("total_contributed", 0) + cost
        member["repayment_history"] = [*member.get("repayment_history", []), 100][-6:]
        member["score"] = member_score(member)
        fund["pool_total"] += cost
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
        "fund": await serialize_fund(fund, None),
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
    return {"message": f"{member['name']} updated.", "fund": await serialize_fund(fund, member["email"])}


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
    
    # Restrict members to a single bid per auction cycle
    for entry in auction.get("history", []):
        if entry.get("bidder_email") == payload.bidderEmail.lower():
            raise HTTPException(
                status_code=400,
                detail="You have already placed a bid in this cycle. Members are allowed only one bid per cycle.",
            )

    if payload.amount >= auction["current_bid"]:
        raise HTTPException(
            status_code=400,
            detail=f"Bid must be lower than {format_inr(auction['current_bid'])}.",
        )
    # Bid increment check removed to allow flexible bidding as per user request

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
        "fund": await serialize_fund(fund, payload.bidderEmail.lower()),
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
            "fund": await serialize_fund(fund, None),
        }

    leader = sorted(auction["history"], key=lambda item: item["amount"])[0]
    winner = find_member_by_email(fund, leader["bidder_email"])
    if not winner:
        raise HTTPException(status_code=404, detail="Winning member not found.")

    winning_bid = leader["amount"]
    payout = winning_bid
    group_dividend = max(auction["pool_amount"] - winning_bid, 0)
    bonus_per_member = round(group_dividend / max(len(fund["members"]), 1))

    # Important: Distribute Payouts and Dividends to Global User Wallets
    for member in fund["members"]:
        member_email = member["email"].strip().lower()
        member_bonus = bonus_per_member
        
        # Accumulate won payout for the winner
        if member_email == winner["email"].strip().lower():
            member_bonus += payout
            
        # Update fund's local member statistics
        member["wallet_balance"] = member.get("wallet_balance", 0) + member_bonus
        
        # Update the actual user global wallet
        await db.users.update_one(
            {"email": member_email},
            {"$inc": {"wallet_balance": member_bonus}}
        )

    fund["pool_total"] = max(fund["pool_total"] - auction["pool_amount"], 0)
    auction["is_active"] = False
    auction["time_left"] = 0
    result = {
        "cycle": fund["current_cycle"],
        "winner": winner["name"],
        "winnerEmail": winner["email"],
        "winningBid": winning_bid,
        "payout": payout,
        "groupDividend": group_dividend,
        "bonusPerMember": bonus_per_member,
        "closedAt": utc_now_iso(),
    }
    auction["last_result"] = result
    auction["previous_winners"] = [
        {
            "month": fund["current_cycle"],
            "winner": winner["name"],
            "winner_email": winner["email"],
            "amount": winning_bid,
        },
        *auction.get("previous_winners", []),
    ][:12]

    add_activity(
        fund,
        "Winner Paid",
        f"Verified payout of Rs {payout} sent to {winner['name']}'s wallet.",
        "auction",
        amount=payout,
        user=winner['name']
    )

    fund["updated_at"] = utc_now_iso()
    
    # AUTO-EVOLVE DNA on Auction Close
    await evolve_dna_internal(fund)
    
    await db.funds.replace_one({"_id": fund_id}, fund)

    return {
        "message": "Auction closed successfully.",
        "result": result,
        "fund": await serialize_fund(fund, winner["email"]),
    }


@app.post("/api/funds/{fund_id}/demo/reset")
async def demo_reset_auction(fund_id: str):
    fund = await db.funds.find_one({"_id": fund_id})
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found.")
    
    # HARD RESET for demonstration purposes
    fund["auction"]["is_active"] = True
    fund["auction"]["history"] = []
    fund["auction"]["time_left"] = 1800
    fund["auction"]["last_result"] = None
    fund["auction"]["previous_winners"] = []
    fund["auction"]["eligible_members"] = [m["email"] for m in fund["members"]]
    fund["auction"]["current_bid"] = len(fund["members"]) * fund["monthly_installment"]
    fund["auction"]["highest_bidder"] = None
    fund["auction"]["highest_bidder_email"] = None
    
    # Also reset member statuses to 'paid' for a clean month
    for member in fund["members"]:
        member["status"] = "paid"
    
    fund["updated_at"] = utc_now_iso()
    fund["current_cycle"] = 1
    fund["pool_total"] = len(fund["members"]) * fund["monthly_installment"]
    
    add_activity(
        fund,
        "System Reset (Judge Ready)",
        "The auction has been fully reset to Cycle 1 for a fresh demonstration.",
        "system"
    )
    
    recompute_fund(fund)
    await db.funds.replace_one({"_id": fund["_id"]}, fund)
    return {"message": "Auction reset for demo.", "fund": await serialize_fund(fund, None)}


@app.post("/api/funds/{fund_id}/demo/simulate-bid")
async def simulate_ai_bid(fund_id: str):
    fund = await db.funds.find_one({"_id": fund_id})
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found.")
    
    recompute_fund(fund)
    auction = fund["auction"]
    if not auction["is_active"]:
        raise HTTPException(status_code=400, detail="Auction is not active.")
    
    # Eligible members are those who haven't won before
    eligible = auction.get("eligible_members", [])
    if not eligible:
        raise HTTPException(status_code=400, detail="No eligible members to simulate.")
    
    # Pick a random member who is not the current highest bidder
    current_highest = auction.get("highest_bidder_email")
    others = [e for e in eligible if e != current_highest]
    target_email = random.choice(others if others else [eligible[0]])
    
    member = find_member_by_email(fund, target_email)
    if not member:
         raise HTTPException(status_code=404, detail="Simulation target member not found.")

    # Bid slightly lower than current bid by the minimum increment
    new_amount = max(auction["bid_increment"], auction["current_bid"] - auction["bid_increment"])
    
    # Insert at beginning of history
    auction["history"] = [
        {
            "bidder": member["name"],
            "bidder_email": member["email"],
            "amount": new_amount,
            "time": utc_now_iso(),
        },
        *auction.get("history", []),
    ][:20]
    
    add_activity(
        fund,
        "Competitive Bid",
        f"{member['name']} outbid the previous best with {format_inr(new_amount)}.",
        "bid"
    )
    recompute_fund(fund)
    await db.funds.replace_one({"_id": fund["_id"]}, fund)
    return {"message": f"Simulated bid by {member['name']} placed.", "fund": await serialize_fund(fund, None)}


@app.post("/api/auction/bid")
async def place_bid(bid: AuctionBid):
    await db.bids.insert_one(bid.dict())
    return {"status": "Bid recorded on chain (mock)"}

# -------------------------------------------------------------------
#  AI DEFAULT PREDICTION ENGINE (FEATURE 13)
# -------------------------------------------------------------------
import google.generativeai as google_genai

def build_gemini_prompt(member_context: dict) -> str:
    prompt = f"""You are ArthaNetra's AI risk engine. You analyse chit fund member behaviour and predict default risk for the upcoming payment cycle.

Respond ONLY in this exact JSON format with no markdown, no explanation outside the JSON. Return valid JSON only:
{{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "confidence": <number 0-100>,
  "reasoning": "<2-3 sentence plain English explanation of why this risk level was assigned. Be specific about which data points drove the decision. Sound like a smart financial advisor.>",
  "recommendedAction": "<one specific action: SEND_EARLY_NUDGE | SEND_STANDARD_NUDGE | MONITOR_ONLY | ESCALATE_TO_ADMIN | NO_ACTION_NEEDED>",
  "earlyNudgeDays": <number: how many days before due date to send nudge. 0 if no nudge.>,
  "keyRiskFactors": ["factor1", "factor2"],
  "positiveFactors": ["factor1"]
}}

Member data for analysis:
Name: {member_context['name']}
Current cycle: {member_context['cycleNumber']}
Status: {member_context['status']}
Late payment instances: {member_context['latePaymentCount']}
Missed payments: {member_context['missedCount']}
Trust score: {member_context['trustScore']}

Analyse this data and predict default risk for the upcoming payment. Be decisive.
"""
    return prompt


@app.post("/api/predictions/run/{fund_id}")
async def run_group_predictions(fund_id: str):
    fund = await db.funds.find_one({"_id": fund_id})
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")
    
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY missing in .env")
    
    google_genai.configure(api_key=api_key)
    model = google_genai.GenerativeModel("gemini-2.0-flash")
    
    updated = False
    
    for member in fund.get("members", []):
        try:
            late_count = 1 if member.get("status") == "overdue" else 0
            ctx = {
                "name": member["name"],
                "cycleNumber": fund["current_cycle"],
                "status": member.get("status", "pending"),
                "latePaymentCount": late_count,
                "missedCount": 0,
                "trustScore": member.get("score", 75)
            }
            
            # Simple heuristic override for perfect payers
            if late_count == 0 and member.get("score", 0) > 85:
                pred = {
                    "riskLevel": "LOW",
                    "confidence": 95,
                    "reasoning": "Member has a high trust score and perfect payment record. Autopay likelihood is high.",
                    "recommendedAction": "NO_ACTION_NEEDED",
                    "earlyNudgeDays": 0,
                    "keyRiskFactors": [],
                    "positiveFactors": ["High Trust Score", "Perfect History"]
                }
            else:
                prompt = build_gemini_prompt(ctx)
                response = model.generate_content(prompt)
                
                text_response = response.text.strip()
                if text_response.startswith("```json"):
                    text_response = text_response.replace("```json", "", 1)
                elif text_response.startswith("```"):
                    text_response = text_response.replace("```", "", 1)
                if text_response.endswith("```"):
                    text_response = text_response[:-3]
                
                pred = json.loads(text_response.strip())
                
            member["lastPrediction"] = pred
            member["currentRiskLevel"] = pred.get("riskLevel", "LOW")
            updated = True
        except Exception as e:
            print(f"Error predicting for {member['name']}: {e}")
            pass
            
    if updated:
        await db.funds.replace_one({"_id": fund_id}, fund)
        
    return {"message": "Predictions run complete", "fund": await serialize_fund(fund, None)}

@app.get("/api/predictions/{fund_id}")
async def get_fund_predictions(fund_id: str):
    fund = await db.funds.find_one({"_id": fund_id})
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")
        
    results = []
    for member in fund.get("members", []):
        if "lastPrediction" in member:
            results.append({
                "userId": member["id"],
                "name": member["name"],
                "email": member["email"],
                "riskLevel": member.get("currentRiskLevel", "LOW"),
                "prediction": member["lastPrediction"]
            })
            
    return results

# -------------------------------------------------------------------
#  AI FINANCIAL HEALTH COACH (FEATURE 14)
# -------------------------------------------------------------------
from fastapi.responses import StreamingResponse

class CoachMessagePayload(BaseModel):
    groupId: str
    message: str

def build_coach_prompt(member: dict, fund: dict) -> str:
    score_details = member.get("score_details", {})
    timeliness = score_details.get("timeliness", 0)
    consistency = score_details.get("payment_consistency", 0)
    missed_count = member.get("missed_count", 0)
    
    history = member.get("repayment_history", [])[-6:]
    history_str = ", ".join([f"C{h['cycle']}: {h.get('status', 'paid')}" for h in history])
    
    fund_size = fund.get("pool_total", 0)
    monthly = fund.get("monthly_installment", 0)
    current_cycle = fund.get("current_cycle", 1)
    duration = fund.get("duration_months", 1)
    members_count = len(fund.get("members", []))
    
    auction = fund.get("auction", {})
    winners = auction.get("previous_winners", [])
    won = "Won" if member.get("email") in winners else "Not won yet"
    
    return f"""You are ChitMind's AI Financial Coach. You are advising {member['name']} in their chit fund.
Be warm, specific, and concise. Max 3 sentences per response unless asked for detail.
Never be generic. Always reference their actual data when answering. Do not make up numbers.
If asked something outside chit fund finance, gently redirect back to their fund goals.

MEMBER PROFILE:
Name: {member['name']}
Trust Score: {member.get('score', 0)}/100
Payment Consistency: {consistency}
Timeliness: {timeliness}
Defaults: {missed_count}
Autopay: Disabled
Strikes: 0

PAYMENT HISTORY:
{history_str}

FUND CONTEXT:
Fund size: ₹{fund_size}
Monthly contribution: ₹{monthly}
Current cycle: {current_cycle} of {duration}
Members: {members_count}
{member['name']}'s auction status: {won}
"""

@app.get("/api/coach/session/{group_id}")
async def get_coach_session(group_id: str, email: str = Query(...)):
    target_email = email.strip().lower()
    session = await db.coach_sessions.find_one({"groupId": group_id, "email": target_email})
    
    if not session:
        messages = []
        if target_email == "zara@example.com":
            messages = [
                {"role": "user", "content": "Am I going to lose my trust score?", "timestamp": utc_now_iso()},
                {"role": "assistant", "content": "Your score is at 48 — it's the lowest in the group but not unsalvageable. Two on-time payments in a row will bring you above 55 and back into auction eligibility.", "timestamp": utc_now_iso()},
                {"role": "user", "content": "Should I enable autopay?", "timestamp": utc_now_iso()},
                {"role": "assistant", "content": "Yes — absolutely. Given your payment pattern, Autopay is the single best thing you can do right now. It gives you +5 trust immediately and removes all default risk going forward.", "timestamp": utc_now_iso()}
            ]
            await db.coach_sessions.insert_one({
                "groupId": group_id,
                "email": target_email,
                "messages": messages,
                "createdAt": utc_now_iso(),
                "updatedAt": utc_now_iso()
            })
        return {"messages": messages}
    return {"messages": session.get("messages", [])}

@app.delete("/api/coach/session/{group_id}")
async def clear_coach_session(group_id: str, email: str = Query(...)):
    target_email = email.strip().lower()
    await db.coach_sessions.delete_one({"groupId": group_id, "email": target_email})
    return {"status": "cleared"}

@app.post("/api/coach/message")
async def send_coach_message(payload: CoachMessagePayload, email: str = Query(...)):
    target_email = email.strip().lower()
    
    fund = await db.funds.find_one({"_id": payload.groupId})
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")
        
    member = find_member_by_email(fund, target_email)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
        
    session = await db.coach_sessions.find_one({"groupId": payload.groupId, "email": target_email})
    if not session:
        session = {
            "groupId": payload.groupId,
            "email": target_email,
            "messages": [],
            "createdAt": utc_now_iso(),
            "updatedAt": utc_now_iso()
        }
        await db.coach_sessions.insert_one(session)
        
    sys_prompt = build_coach_prompt(member, fund)
    
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY missing")
        
    google_genai.configure(api_key=api_key)
    model = google_genai.GenerativeModel("gemini-2.0-flash", system_instruction=sys_prompt)
    
    history = []
    for msg in session["messages"][-10:]:
        role = "user" if msg["role"] == "user" else "model"
        history.append({"role": role, "parts": [{"text": msg["content"]}]})
        
    chat = model.start_chat(history=history)
    
    import asyncio
    
    async def stream_generator():
        full_response = ""
        try:
            # send_message with stream=True is synchronous, run in executor
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, lambda: chat.send_message(payload.message, stream=True)
            )
            for chunk in response:
                if chunk.text:
                    full_response += chunk.text
                    yield chunk.text
        except Exception as e:
            print("Gemini Coach Error:", e)
            yield "Coach is taking a break. Try again shortly."
            return

        # Save the messages after streaming completes
        try:
            new_messages = session["messages"] + [
                {"role": "user", "content": payload.message, "timestamp": utc_now_iso()},
                {"role": "assistant", "content": full_response, "timestamp": utc_now_iso()}
            ]
            await db.coach_sessions.update_one(
                {"groupId": payload.groupId, "email": target_email},
                {"$set": {"messages": new_messages[-12:], "updatedAt": utc_now_iso()}}
            )
        except Exception as e:
            print("Coach DB save error:", e)
            
    return StreamingResponse(stream_generator(), media_type="text/plain")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
