from fastapi import APIRouter, HTTPException, Response, status
from fastapi.concurrency import run_in_threadpool
from bson import ObjectId
from jose import JWTError
from datetime import datetime, timezone, timedelta

from app.core.database import db
from app.core.email import send_verification_email, send_password_reset_email
from app.schemas.auth import SignupRequest, LoginRequest
from app.core.security import (
    get_password_hash, 
    verify_password, 
    create_access_token,
    create_refresh_token,
    decode_token
)


router = APIRouter(tags=["Authentication"])


@router.post("/signup")
@router.post("/register")
async def signup(data: SignupRequest):
    """Create new user account"""
    
    # Check if email exists
    existing_email = await db.users.find_one({"email": str(data.email).lower()})
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered! Please use a different email to Sign-up."
        )
    
    # Check if userid exists
    existing_userid = await db.users.find_one({"userid": data.userid.lower()})
    if existing_userid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID already taken! Choose a different one."
        )
    
    hashed_password = await run_in_threadpool(get_password_hash, data.password)
    
    # Create user
    new_user = {
        "name": data.name,
        "userid": data.userid.lower(),
        "email": str(data.email).lower(),
        "password": hashed_password,
        "theme": "light",
        "is_verified": False,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await db.users.insert_one(new_user)
    user_id = str(result.inserted_id)
    
    # Create verification token (30 min expiry)
    verification_token = create_access_token(
        data={"sub": user_id, "purpose": "email_verification"},
        expires_delta=timedelta(minutes=30)
    )
    
    # Send verification email
    await send_verification_email(
        email=str(data.email),
        name=data.name,
        token=verification_token
    )
    
    return {
        "message": "Account created successfully. Please check your email to verify.",
        "user": {
            "id": user_id,
            "name": data.name,
            "userid": data.userid,
            "email": data.email
        }
    }


@router.post("/sign-in")
@router.post("/login")
async def login(data: LoginRequest, response: Response):
    """Login with email/userid and password"""

    # Find user by email or userid
    user = await db.users.find_one({
        "$or": [
            {"email": data.login.lower()},
            {"userid": data.login.lower()}
        ]
    })

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User does not exist")

    password_is_correct = await run_in_threadpool(verify_password, data.password, user["password"])

    if not password_is_correct:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not user.get("is_verified"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your email."
        )

    if not user.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account deactivated"
        )

    # Update last login
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc)}}
    )

    # Create tokens
    access_token = create_access_token(data={"sub": str(user["_id"])})
    refresh_token = create_refresh_token(data={"sub": str(user["_id"])})

    # Set refresh token in httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,  # HTTPS only in production
        samesite="lax",
        max_age=7 * 24 * 60 * 60  # 7 days
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 3600,
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "userid": user["userid"],
            "email": user["email"],
            "theme": user.get("theme", "light"),
            "profile_picture": user.get("profile_picture")
        }
    }


@router.post("/verify-email/{token}")
async def verify_email(token: str):
    """Verify user email"""
    try:
        payload = decode_token(token)
        
        if payload.get("purpose") != "email_verification":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token"
            )
        
        user_id = payload.get("sub")
        
        # Update user
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_verified": True, "updated_at": datetime.now(timezone.utc)}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found or already verified"
            )
        
        return {"message": "Email verified successfully! You can now log in."}
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )


@router.post("/resend-verification")
async def resend_verification(email: str):
    """Resend verification email"""
    user = await db.users.find_one({"email": email.lower()})
    
    if not user:
        return {"message": "If account exists, verification email has been sent"}      # Don't reveal if email exists
    
    if user.get("is_verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified"
        )
    
    # Create new token
    verification_token = create_access_token(
        data={"sub": str(user["_id"]), "purpose": "email_verification"},
        expires_delta=timedelta(minutes=30)
    )
    
    await send_verification_email(
        email=user["email"],
        name=user["name"],
        token=verification_token
    )
    
    return {"message": "Verification email sent"}


@router.post("/forgot-password")
async def forgot_password(email: str):
    """Request password reset"""
    user = await db.users.find_one({"email": email.lower()})
    
    if not user:
        return {"message": "If account exists, password reset email has been sent"}     # Don't reveal if email exists
    
    # Create reset token
    reset_token = create_access_token(
        data={"sub": str(user["_id"]), "purpose": "password_reset"},
        expires_delta=timedelta(minutes=30)
    )
    
    await send_password_reset_email(
        email=user["email"],
        name=user["name"],
        token=reset_token
    )
    
    return {"message": "Password reset email sent"}


@router.post("/reset-password/{token}")
async def reset_password(token: str, new_password: str):
    """Reset password with token"""
    try:
        payload = decode_token(token)
        
        if payload.get("purpose") != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset token"
            )
        
        user_id = payload.get("sub")
        hashed_password = await run_in_threadpool(get_password_hash, new_password)
        
        # Update password
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "password": hashed_password,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {"message": "Password reset successfully"}
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
