# coding: UTF-8
import json
import random
import pprint
from collections import namedtuple
from dataclasses import asdict, dataclass
from pathlib import Path
from enum import IntEnum

__all__ = ['Splendor', 'Player', 'Gems', 'Card', 'DATABASE']

CM = {'R':0, 'G':1, 'B':2, 'W':3, 'D':4}

SPLENDOR_JSON = Path(__file__).parent / 'splendor.json'
def _load_splendor_json(fp=SPLENDOR_JSON):
    with open(fp) as f:
        data = json.load(f)
    return data
DATABASE = _load_splendor_json()


@dataclass
class Player:
    name: str
    coins: list
    card_own: list
    card_keep: list

    @classmethod
    def new(cls, name):
        return cls(name, [0]*6, [], [])

    @property
    def mines(self) -> 'Gems':
        m = [0] * 5
        for cid in self.card_own:
            card = Card(cid)
            if card.color in CM:
                m[CM[card.color]] += 1
        return Gems(*m)

    @property
    def gems(self) -> 'Gems':
        return Gems(*self.coins[:5])

    @property
    def gold(self) -> int:
        return self.coins[-1]

    @property
    def nkeeps(self) -> int:
        return len(self.card_keep)

    @property
    def score(self) -> int:
        return sum(Card(cid).value for cid in self.card_own)

    def asdict(self):
        return asdict(self)


_Gems = namedtuple('Gems', list('rgbwd'), defaults=[0, 0, 0, 0, 0])


class Gems(_Gems):
    def __add__(self, other):
        return self.__class__(*(x+y for x, y in zip(self, other)))

    def __sub__(self, other):
        return self.__class__(*(x-y for x, y in zip(self, other)))

    @property
    def gtz(self) -> 'Gems':
        """greater than zero"""
        return self.__class__(*(max(0, x) for x in self))

    @property
    def ltz(self) -> 'Gems':
        """lower than zero"""
        return self.__class__(*(max(0, -x) for x in self))

class _Card:
    def __init__(self, *args):
        self._data = {}
        self.ID = 0

    def __repr__(self) -> str:
        return f'<Card.{self._name_}: {self.cost} -> {self.value} @ {self.color}>'

    @property
    def lv(self) -> int:
        return self.ID // 100

    @property
    def is_lord(self) -> bool:
        return self.ID >= 400
    
    @property
    def cost(self) -> 'Gems':
        return Gems(*self._data['cost'])

    @property
    def value(self) -> int:
        return self._data['val']

    @property
    def color(self) -> 'str | None':
        return self._data.get('color')


class CardEnum(_Card, IntEnum):
    def __init__(self, *args):
        super().__init__(*args)
        self._data = DATABASE[self._name_]
        self.ID = self._value_
        self.__doc__ = CardEnum.__doc__

    @classmethod
    def shuffle(cls, nplayers=4, seed:int=0) -> list:
        clist = list(Card.__members__.values())
        if seed:
            random.seed(seed)
        random.shuffle(clist)
        ret = [[], [], [], []]
        for c in clist:
            ret[c.lv-1].append(c)
        ret[-1] = sorted(ret[-1][:nplayers+1])
        return ret


Card = CardEnum('Card', {k: int(k) for k in DATABASE})



@dataclass
class Splendor:
    """
    supported action:
        pick_coin
        keep_card
        purchase_lord
        purchase_mine
        purchase_keep
    """
    players: list
    m1: list
    m2: list
    m3: list
    lords: list
    coins: list
    step: int = 0
    status: str = 'R'  # R -> L -> G

    @classmethod
    def new(cls, player_names: list, seed=0):
        CoinsMap = {
            5: [8, 6],
            4: [7, 5],
            3: [5, 4],
            2: [4, 3]
        }
        nplayers = len(player_names)
        players = [Player.new(name) for name in player_names]
        clist = Card.shuffle(nplayers, seed=seed)
        gems, gold = CoinsMap[nplayers]
        coins = [gems] * 5 + [gold]
        return cls(players, *clist, coins=coins)

    def asdict(self):
        return {
            'players': [p.asdict() for p in self.players],
            'm1': [c.ID for c in self.m1],
            'm2': [c.ID for c in self.m2],
            'm3': [c.ID for c in self.m3],
            'lords': [c.ID for c in self.lords],
            'coins': self.coins,
            'step': self.step,
            'status': self.status
        }
    
    @classmethod
    def fromdict(cls, _dict):
        kwargs = _dict.copy()
        kwargs['players'] = [Player(**p) for p in kwargs['players']]
        for k in ('m1', 'm2', 'm3', 'lords'):
            kwargs[k] = [Card(n) for n in kwargs[k]]
        return cls(**kwargs)

    def __repr__(self) -> str:
        pp = pprint.PrettyPrinter(indent=4)
        return (
            "Splendor(\n"
            f"  .step={self.step}\n"
            f"  .status={self.status}\n"
            f"  .coins={self.coins}\n"
            f"  .players=[ <length={len(self.players)}>\n"
            f"  {pp.pformat(self.players)[2:]}\n"
            f"  .m1=[ <length={len(self.m1)}>\n"
            f"  {pp.pformat(self.m1[:4])[2:]}\n"
            f"  .m2=[ <length={len(self.m2)}>\n"
            f"  {pp.pformat(self.m2[:4])[2:]}\n"
            f"  .m3=[ <length={len(self.m3)}>\n"
            f"  {pp.pformat(self.m3[:4])[2:]}\n"
            f"  .lords=[ <length={len(self.lords)}>\n"
            f"  {pp.pformat(self.lords)[2:]}\n"
            ")"
        )

    @property
    def gems(self) -> 'Gems':
        return Gems(*self.coins[:5])

    @property
    def current(self) -> 'Player':
        return self.players[self.step % len(self.players)]

    def _transfer(self, coins: list, way='out') -> bool:
        while len(coins) < 6:
            coins.append(0)
        if way == 'out':
            src = self
            dst = self.current
        elif way == 'in':
            src = self.current
            dst = self
        else:
            msg = f'Invalid way: {way}'
            raise ValueError(msg)
        af1 = [x-d for x, d in zip(src.coins, coins)]
        af2 = [x+d for x, d in zip(dst.coins, coins)]
        if any(x < 0 for x in af1):
            return False
        src.coins = af1
        dst.coins = af2
        return True

    def _get_deck(self, card: 'Card'):
        dmap = {1: self.m1, 2: self.m2, 3:self.m3, 4:self.lords}
        return dmap[card.lv]

    def valid_player(self, iplayer: int) -> bool:
        return (self.status != 'G') and (iplayer == self.step % len(self.players))

    def next_player(self):
        if self.current.score >= 15:
            self.status = 'L'
        if (self.status == 'L') and (self.step % len(self.players) == len(self.players) - 1):
            self.status = 'G'
        self.step += 1

    def pick_coin(self, coins: list) -> bool:
        if (max(coins) == 2) and (sum(coins)==2):
            i = coins.index(2)
            if self.coins[i] < 4:
                return False
            return self._transfer(coins, 'out')
        elif (max(coins) == 1) and (sum(coins)<=3):
            return self._transfer(coins, 'out')
        else:
            return False

    def keep_card(self, card_id: int) -> bool:
        if self.coins[-1] <= 0:
            return False
        if self.current.nkeeps > 2:
            return False
        card = Card(card_id)
        deck = self._get_deck(card)
        if card not in deck:
            return False
        i = deck.index(card)
        if i > 3:
            return False
        self.coins[-1] -= 1
        self.current.coins[-1] += 1
        self.current.card_keep.append(card.ID)
        deck.remove(card)
        return True

    def purchase_lord(self, card_id: int) -> bool:
        card = Card(card_id)
        deck = self.lords
        if card not in deck:
            return False
        if sum((self.current.mines - card.cost).ltz) > 0:
            return False
        self.current.card_own.append(card.ID)
        self.lords.remove(card)
        return True

    def purchase_mine(self, card_id: int) -> bool:
        card = Card(card_id)
        deck = self._get_deck(card)
        if card not in deck:
            return False
        i = deck.index(card)
        if i > 3:
            return False
        gems_cost = (card.cost - self.current.mines).gtz
        need_gems = gems_cost - (self.current.gems - gems_cost).ltz
        need_golds = sum((self.current.gems - gems_cost).ltz)
        coins = list(need_gems) + [need_golds]
        can_transfer = self._transfer(coins, 'in')
        if can_transfer:
            self.current.card_own.append(card.ID)
            deck.remove(card)
            return True
        return False

    def purchase_keep(self, card_id: int) -> bool:
        card = Card(card_id)
        deck = self.current.card_keep
        gems_cost = (card.cost - self.current.mines).gtz
        need_gems = gems_cost - (self.current.gems - gems_cost).ltz
        need_golds = sum((self.current.gems - gems_cost).ltz)
        coins = list(need_gems) + [need_golds]
        can_transfer = self._transfer(coins, 'in')
        if can_transfer:
            self.current.card_own.append(card.ID)
            deck.remove(card)
            return True
        return False
