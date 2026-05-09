from sqlalchemy import Column, Integer, String, DateTime, Float
from .database import Base

class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(String, index=True)
    timestamp = Column(DateTime, index=True)
    sender = Column(String, index=True)
    recipient = Column(String, index=True)
    size = Column(Integer, nullable=True)
    status = Column(String, index=True)  # sent, deferred, bounced, rejected
    reason = Column(String, nullable=True)
    delay = Column(Float, nullable=True)
    client_ip = Column(String, nullable=True)
    
    # Extra field for suspicious activity tracking
    is_suspicious = Column(Integer, default=0) # 0 or 1
    raw_log = Column(String, nullable=True) # Stores the actual log lines

class SystemSettings(Base):
    __tablename__ = "system_settings"
    key = Column(String, primary_key=True)
    value = Column(String)
