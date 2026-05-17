from sqlalchemy import Column, String, Boolean, DateTime, func
from ..core.database import Base

class UserSettings(Base):
    """
    Store preferences for individual users.
    """
    __tablename__ = "user_settings"

    user_id = Column(String(255), primary_key=True, index=True)
    email_notifications = Column(Boolean, default=True)
    desktop_notifications = Column(Boolean, default=True)
    weekly_digest = Column(Boolean, default=False)
    marketing_emails = Column(Boolean, default=False)
    
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<UserSettings(user_id='{self.user_id}')>"
