from typing import Annotated, TypeAlias
from fastapi import FastAPI, Header, HTTPException
from mangum import Mangum

from .models import VisitCount, Comment
from .db import DynamoOperation, DynamoOperationFailed

HeaderType: TypeAlias = Annotated[str | None, Header()]

app = FastAPI(title='Blog Backend API')
op = DynamoOperation()


@app.get("/")
def index():
    return {"message": "running"}


@app.get("/visitcount", response_model=VisitCount)
def get_visit_count(x_referer_page: HeaderType,
                    x_referer_site: HeaderType = 'http://localhost'):
    page = x_referer_site.strip('/') + '/' + x_referer_page.strip('/')
    page = page.strip('/')
    vc = op.vc_get(page)
    return vc


@app.put("/visitcount", response_model=VisitCount)
def update_visit_count(x_referer_page: HeaderType,
                       x_referer_site: HeaderType = 'http://localhost'):
    page = x_referer_site.strip('/') + '/' + x_referer_page.strip('/')
    page = page.strip('/')
    vc = op.vc_update(page)
    return vc


@app.get("/visitcount/listall", response_model=list[VisitCount])
def list_all_visit_count(x_referer_site: HeaderType = 'http://localhost'):
    site = x_referer_site.strip('/')
    vclist = op.vc_scan(site)
    return vclist


@app.get("/comments", response_model=list[Comment])
def get_comments(x_referer_page: HeaderType,
                 x_referer_site: HeaderType = 'http://localhost',
                 count: int = 10,
                 offset: int = 0):
    page = x_referer_site.strip('/') + '/' + x_referer_page.strip('/')
    page = page.strip('/')
    data = op.comment_get(page, offset, count)
    return data


@app.post("/comments", status_code=201)
def new_comment(x_referer_page: HeaderType, 
                comment: Comment,
                x_referer_site: HeaderType = 'http://localhost'):
    page = x_referer_site.strip('/') + '/' + x_referer_page.strip('/')
    page = page.strip('/')
    try:
        op.comment_new(page, comment)
    except DynamoOperationFailed as e:
        raise HTTPException(status_code=400, detail=repr(e))
    return {'status': 'ok'}


handler = Mangum(app, lifespan="off")
