# models.py - Pydantic Models
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class Project(BaseModel):
    name: str
    repo_url: str


class Environment(BaseModel):
    name: str
    branch: str
    is_production: bool = False
    domain: Optional[str] = None


class EnvVariable(BaseModel):
    key: str
    value: str


class Deployment(BaseModel):
    branch: str
    commit_hash: str
    status: Optional[str] = "queued"
    logs: Optional[str] = None
    url: Optional[str] = None


class VM(BaseModel):
    instance_id: str
    region: str
    status: Optional[str] = "available"
    current_deployment_id: Optional[int] = None
