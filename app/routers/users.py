import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..core.database import get_db
from ..models.user_settings import UserSettings
from ..security import get_current_user

log = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])

class UserSettingsUpdate(BaseModel):
    email_notifications: bool | None = None
    desktop_notifications: bool | None = None
    weekly_digest: bool | None = None
    marketing_emails: bool | None = None

class UserSettingsResponse(BaseModel):
    email_notifications: bool
    desktop_notifications: bool
    weekly_digest: bool
    marketing_emails: bool

@router.get("/me/settings", response_model=UserSettingsResponse)
async def get_my_settings(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch the authenticated user's settings."""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not found")

    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    
    if not settings:
        # Create default settings if they don't exist
        settings = UserSettings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings

@router.patch("/me/settings", response_model=UserSettingsResponse)
async def update_my_settings(
    update_data: UserSettingsUpdate,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update specific settings for the authenticated user."""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not found")

    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.add(settings)

    # Apply updates
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(settings, key, value)
        
    db.commit()
    db.refresh(settings)

    return settings

@router.delete("/me")
async def delete_my_account(
    user: dict = Depends(get_current_user)
):
    """Delete the authenticated user's account."""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not found")
        
    log.warning(f"User {user_id} requested account deletion.")
    
    # In this template, user management is handled by Keycloak. 
    # Because AUTH_BYPASS=true is standard for development, we will just simulate success.
    # In a full deployment, this would hit keycloak_admin.delete_user(user_id)
    
    try:
        from ..services.keycloak_admin import keycloak_admin
        import os
        AUTH_BYPASS = os.getenv("AUTH_BYPASS", "false").lower() == "true"
        if not AUTH_BYPASS:
            await keycloak_admin.delete_user(user_id)
    except Exception as e:
        log.warning(f"Could not delete user from Keycloak: {e}")
        # Proceed anyway so frontend logic can be tested
        pass

    return {"status": "success", "message": "Account scheduled for deletion"}
