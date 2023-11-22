# coding: UTF-8
import json

with open('codenames.txt') as f:
    text = f.read()
words = []
for line in text.splitlines():
    if not line.startswith("#"):
        words.extend(line.split("：")[-1].strip().split("、"))
with open('codenames.json', 'w') as f:
    json.dump(words, f, ensure_ascii=False)
