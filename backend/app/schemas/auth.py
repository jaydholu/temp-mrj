from pydantic import BaseModel, EmailStr, SecretStr, ValidationInfo, Field, field_validator
import re


class SignupRequest(BaseModel):
    """Signup request schema"""
    full_name: str = Field(..., alias="fullName", min_length=2, max_length=50)
    user_name: str = Field(..., alias="userName", min_length=2, max_length=20)
    email: EmailStr = Field(..., alias="email")
    password: SecretStr = Field(..., alias="password", min_length=8, max_length=100)
    confirm_password: SecretStr = Field(..., alias="confirmPassword")
    password: SecretStr = Field(..., min_length=8, max_length=100)
    
    @field_validator('user_name')
    def validate_user_name(cls, v):
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('User name can only contain letters, numbers, and underscores')
        return v.lower()
    
    @field_validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain an uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain a lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain a number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain a special character')
        return v
    
    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, info: ValidationInfo):
        if info.data.get("password") != v:
            raise ValueError("Passwords do not match")
        return v


class LoginRequest(BaseModel):
    """Login request schema"""
    login: str = Field(..., description="Email or User ID")
    password: SecretStr = Field(..., min_length=8)


class VerifyEmailRequest(BaseModel):
    """Verify email request"""
    token: str


class ForgotPasswordRequest(BaseModel):
    """Forgot password request"""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Reset password request"""
    password: SecretStr = Field(..., min_length=8, max_length=100)
    confirm_password: SecretStr
    
    @field_validator('password')
    def validate_password(cls, v):
        if len(v.get_secret_value()) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v.get_secret_value()):
            raise ValueError('Password must contain an uppercase letter')
        if not re.search(r'[a-z]', v.get_secret_value()):
            raise ValueError('Password must contain a lowercase letter')
        if not re.search(r'\d', v.get_secret_value()):
            raise ValueError('Password must contain a number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v.get_secret_value()):
            raise ValueError('Password must contain a special character')
        return v.get_secret_value()
    
    @field_validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and v.get_secret_value() != values['password']:
            raise ValueError('Passwords do not match')
        return v.get_secret_value()
    