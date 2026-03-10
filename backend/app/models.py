from sqlalchemy import Column, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "user"

    id = Column(String, primary_key=True)
    email = Column(String, nullable=False)
    created_at = Column(Integer, nullable=False)
    updated_at = Column(Integer, nullable=False)

    __table_args__ = (UniqueConstraint("email"),)


class Session(Base):
    __tablename__ = "session"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("user.id"), nullable=False)
    expires_at = Column(Integer, nullable=False)


class MagicLink(Base):
    __tablename__ = "magic_link"

    id = Column(String, primary_key=True)
    email = Column(String, nullable=False)
    expires_at = Column(Integer, nullable=False)
    created_at = Column(Integer, nullable=False)


class Spec(Base):
    __tablename__ = "spec"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("user.id"), nullable=False)
    title = Column(String, nullable=False, default="Untitled Spec")
    mode = Column(String, nullable=False, default="specz")
    status = Column(String, nullable=False, default="draft")
    conversation = Column(Text, nullable=False, default="[]")
    output = Column(Text, nullable=True)
    created_at = Column(Integer, nullable=False)
    updated_at = Column(Integer, nullable=False)
