from typing import Union, Annotated, TypeAlias
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, EmailStr

from db import DynamoClient

app = FastAPI()


HeaderType: TypeAlias = Annotated[str | None, Header()]


class Comment(BaseModel):
    id: int
    timestamp: int
    content: str
    nickname: str
    email: Union[EmailStr, None]


class VisitCount(BaseModel):
    count: int = 0
    lastvisit: int = 0


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/visitcount", response_model=VisitCount)
def vc_get(origin: HeaderType, x_referer_page: HeaderType):
    return VisitCount()


@app.put("/visitcount", response_model=VisitCount)
def vc_update(origin: HeaderType, x_referer_page: HeaderType):
    return VisitCount()


@app.get("/comments", response_model=list[Comment])
def comment_get(origin: HeaderType, x_referer_page: HeaderType, count: int = 10, offset: int = 0):
    return [Comment()]


@app.post("/comments", status_code=201)
def comment_new(origin: HeaderType, x_referer_page: HeaderType, comment: Comment):
    return {'status': 'ok'}
