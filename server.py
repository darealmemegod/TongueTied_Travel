
from __future__ import annotations
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import secrets
import hashlib
from datetime import datetime, timedelta
from email.message import EmailMessage
from typing import Optional
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from dotenv import load_dotenv

# Brevo imports
from sib_api_v3_sdk import Configuration, ApiClient, TransactionalEmailsApi, SendSmtpEmail, SendSmtpEmailSender, SendSmtpEmailTo

load_dotenv()

# Config
DEV_MODE = os.getenv("DEV_MODE", "false") == "true"
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
JWT_SECRET = os.getenv("JWT_SECRET", "CHANGE_ME_TO_A_LONG_RANDOM_SECRET")
JWT_ALG = "HS256"
ACCESS_TOKEN_DAYS = int(os.getenv("ACCESS_TOKEN_DAYS", "30"))

MAGIC_LINK_TTL_MIN = int(os.getenv("MAGIC_LINK_TTL_MIN", "15"))
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "http://127.0.0.1:8000")
API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")

BREVO_API_KEY = os.getenv("BREVO_API_KEY")  # <-- Put your key here in .env

# Database
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class MagicLink(Base):
    __tablename__ = "magic_links"
    id = Column(Integer, primary_key=True)
    email = Column(String, index=True, nullable=False)
    token_hash = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    meta = Column(Text, nullable=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Auth stuff
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/exchange")

def create_access_token(user_id: int) -> str:
    exp = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_DAYS)
    payload = {"sub": str(user_id), "exp": int(exp.timestamp())}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def sha256(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

# Brevo email sender
def send_magic_link_email(to_email: str, verify_url: str):
    if not BREVO_API_KEY:
        print("No BREVO_API_KEY in .env → falling back to console print")
        print("\n" + "="*60)
        print(f"WOULD SEND TO: {to_email}")
        print("SUBJECT: Your TongueTied Travel sign-in link")
        print(f"BODY:\nClick here to sign in: {verify_url}\n\nExpires in {MAGIC_LINK_TTL_MIN} minutes.")
        print("="*60 + "\n")
        return

    config = Configuration()
    config.api_key['api-key'] = BREVO_API_KEY
    api_instance = TransactionalEmailsApi(ApiClient(config))

    sender = SendSmtpEmailSender(email="noreply@yourdomain.com", name="TongueTied Travel")  # Change to a verified sender email if you have one
    to = [SendSmtpEmailTo(email=to_email)]

    send_smtp_email = SendSmtpEmail(
        sender=sender,
        to=to,
        subject="Your TongueTied Travel sign-in link",
        text_content=f"Click to sign in:\n\n{verify_url}\n\nThis link expires in {MAGIC_LINK_TTL_MIN} minutes.\n\nIf you didn't request this, ignore it."
    )

    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        print(f"Brevo magic link sent to {to_email} - message ID: {api_response.message_id}")
    except Exception as e:
        print(f"Brevo send failed: {str(e)}")
        # Fallback so you don't get 500 in frontend
        print(f"Fallback - link for {to_email}: {verify_url}")

# FastAPI app
app = FastAPI(debug=True)

@app.middleware("http")
async def log_exceptions(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        import traceback
        print("\n🔥 UNHANDLED ERROR:", request.url)
        traceback.print_exc()
        raise

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    print("[startup] DB ready")

app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")
app.mount("/partials", StaticFiles(directory="partials"), name="partials")

@app.get("/", response_class=FileResponse)
def index():
    return FileResponse("index.html")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class RequestLinkIn(BaseModel):
    email: EmailStr

class ExchangeIn(BaseModel):
    token: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class MeOut(BaseModel):
    email: EmailStr

# Routes
@app.post("/auth/request-link")
def request_link(body: RequestLinkIn, request: Request, db: Session = Depends(get_db)):
    email = body.email.lower().strip()
    print(f"Requesting magic link for: {email}")

    raw = secrets.token_urlsafe(32)
    th = sha256(raw)
    now = datetime.utcnow()

    ml = MagicLink(
        email=email,
        token_hash=th,
        expires_at=now + timedelta(minutes=MAGIC_LINK_TTL_MIN),
        meta=f"ip={request.client.host if request.client else 'unknown'}"
    )
    db.add(ml)
    db.commit()

    verify_url = f"{API_BASE_URL}/auth/verify?token={raw}"
    print(f"Verify URL: {verify_url}")

    try:
        send_magic_link_email(email, verify_url)
    except Exception as e:
        print(f"Email send attempt failed but continuing: {e}")

    return {"ok": True}

@app.get("/auth/verify", response_class=HTMLResponse)
def verify(token: str, db: Session = Depends(get_db)):
    th = sha256(token)
    now = datetime.utcnow()

    ml = db.query(MagicLink).filter(MagicLink.token_hash == th).first()
    if ml is None or ml.used_at is not None or ml.expires_at < now:
        return HTMLResponse("<h2>Invalid or Expired link</h2>", status_code=400)

    ml.used_at = now
    db.commit()

    user = db.query(User).filter(User.email == ml.email).first()
    if not user:
        user = User(email=ml.email)
        db.add(user)
        db.commit()

    redirect_url = f"{PUBLIC_BASE_URL}/#auth=success&token={token}"
    return HTMLResponse(f"""
    <html>
      <head>
        <meta http-equiv="refresh" content="0; url='{redirect_url}'" />
      </head>
      <body>Signing in…</body>
    </html>
    """)

@app.post("/auth/exchange", response_model=TokenOut)
def exchange(body: ExchangeIn, db: Session = Depends(get_db)):
    th = sha256(body.token)
    now = datetime.utcnow()

    ml = db.query(MagicLink).filter(MagicLink.token_hash == th).first()
    if not ml or ml.used_at is None or ml.expires_at < now:
        raise HTTPException(status_code=400, detail="Invalid exchange token")

    user = db.query(User).filter(User.email == ml.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    return TokenOut(access_token=create_access_token(user.id))

@app.get("/me", response_model=MeOut)
def me(user: User = Depends(get_current_user)):
    return MeOut(email=user.email)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)