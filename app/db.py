
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os
import uuid
from datetime import datetime

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
def create_chat_session() -> str:
    db = SessionLocal()
    session_id = str(uuid.uuid4())
    session = ChatSession(id=session_id)
    db.add(session)
    db.commit()
    db.close()
    return session_id

def add_chat_message(session_id: str, role: str, message: str):
    db = SessionLocal()
    msg = ChatHistory(session_id=session_id, role=role, message=message)
    db.add(msg)
    db.commit()
    db.close()

def get_last_messages(session_id: str, limit: int = 10):
    db = SessionLocal()
    msgs = db.query(ChatHistory).filter(ChatHistory.session_id == session_id).order_by(ChatHistory.timestamp.desc()).limit(limit).all()
    db.close()
    # Return in chronological order
    return list(reversed(msgs))
