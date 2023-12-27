from pydantic import BaseModel, EmailStr
from typing import Union

class Comment(BaseModel):
    cid: int = None
    timestamp: int = 0
    content: str
    nickname: str
    email: Union[EmailStr, None] = None


class VisitCount(BaseModel):
    page: str = ''
    count: int = 0
    timestamp: int = 0
