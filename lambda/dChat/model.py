from dataclasses import dataclass, asdict
import time


class DChatException(Exception):
    def __init__(self, *args: object) -> None:
        super().__init__(*args)


class BaseModel:
    def asdict(self) -> dict:
        return asdict(self)


@dataclass
class ConnectionInfo(BaseModel):
    connectionId: str
    uuid: str
    page_path: str
    room_id: str
    expiry: int

    def asitem(self):
        item_dict = asdict(self)
        item_dict['PK'] = 'connection'
        item_dict['SK'] = item_dict.pop('connectionId')
        return item_dict
    
    @classmethod
    def parseitem(cls, item: dict):
        item_dict = item.copy()
        item_dict.pop('PK')
        item_dict['connectionId'] = item_dict.pop('SK')
        return cls(**item_dict)


@dataclass
class MemberInfo(BaseModel):
    connectionId: str
    uuid: str
    nickname: str
    online: bool
    position: int


@dataclass
class Message(BaseModel):
    msgtype: str
    uuid: str
    nickname: str
    text: str = ''
    timestamp: int = 0

    def __post_init__(self):
        if self.timestamp == 0:
            self.timestamp = int(time.time())
