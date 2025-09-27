

from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os
import uuid
from datetime import datetime
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '../uploaded_docs/metadata.db')
engine = create_engine(f'sqlite:///{DB_PATH}', connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class DocumentMeta(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, unique=True, index=True)
    md5 = Column(String, index=True)
    filetype = Column(String)
    status = Column(String)
    extra = Column(Text)

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(String, primary_key=True, index=True)  # UUID string
    created_at = Column(DateTime, default=datetime.utcnow)
    model_name = Column(String, default=None)
    history = relationship("ChatHistory", back_populates="session", cascade="all, delete-orphan")

class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("chat_sessions.id"))
    role = Column(String)  # 'user' or 'assistant'
    message = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    session = relationship("ChatSession", back_populates="history")

Base.metadata.create_all(bind=engine)

def add_document_meta(filename, md5, filetype, status, extra=None):
    db = SessionLocal()
    doc = DocumentMeta(filename=filename, md5=md5, filetype=filetype, status=status, extra=extra or "")
    db.add(doc)
    db.commit()
    db.close()

def get_document_meta(filename):
    db = SessionLocal()
    doc = db.query(DocumentMeta).filter(DocumentMeta.filename == filename).first()
    db.close()
    return doc

# Chat session and history helpers
def create_chat_session(model_name: str = None) -> str:
    db = SessionLocal()
    session_id = str(uuid.uuid4())
    session = ChatSession(id=session_id, model_name=model_name)
    db.add(session)
    db.commit()
    db.close()
    return session_id
# Centralized chat history helpers
def get_all_sessions():
    db = SessionLocal()
    sessions = db.query(ChatSession).all()
    db.close()
    return [{"id": s.id, "created_at": s.created_at, "model_name": s.model_name} for s in sessions]

def get_session_files(session_id: str):
    db = SessionLocal()
    files = db.query(DocumentMeta).filter(DocumentMeta.extra.like(f'%"session_id": "{session_id}"%')).all()
    db.close()
    return [f.filename for f in files]


# Centralized chat history helpers
def save_user_message(session_id: str, message: str):
    db = SessionLocal()
    msg = ChatHistory(session_id=session_id, role="user", message=message)
    db.add(msg)
    db.commit()
    db.close()

def save_assistant_message(session_id: str, message: str):
    db = SessionLocal()
    msg = ChatHistory(session_id=session_id, role="assistant", message=message)
    db.add(msg)
    db.commit()
    db.close()

def get_last_n_messages(session_id: str, limit: int = None):
    if limit is None:
        limit = int(os.getenv("CHAT_HISTORY_LIMIT", "10"))
    db = SessionLocal()
    msgs = db.query(ChatHistory).filter(ChatHistory.session_id == session_id).order_by(ChatHistory.timestamp.desc()).limit(limit).all()
    db.close()
    return list(reversed(msgs))

def get_session_or_create(session_id: str = None) -> str:
    db = SessionLocal()
    if session_id:
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if session:
            db.close()
            return session_id
    # Create new session
    new_id = str(uuid.uuid4())
    session = ChatSession(id=new_id)
    db.add(session)
    db.commit()
    db.close()
    return new_id

def get_last_messages(session_id: str, limit: int = 10):
    db = SessionLocal()
    msgs = db.query(ChatHistory).filter(ChatHistory.session_id == session_id).order_by(ChatHistory.timestamp.desc()).limit(limit).all()
    db.close()
    # Return in chronological order
    return list(reversed(msgs))


# Helper to get model for a session
def get_session_model(session_id: str) -> str:
    db = SessionLocal()
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    db.close()
    return session.model_name if session else None
