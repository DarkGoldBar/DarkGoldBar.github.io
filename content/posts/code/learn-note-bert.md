---
title: "Bert学习笔记"
subtitle: ""
date: 2023-05-16T16:53:00+08:00
lastmod: 2023-05-16T16:53:00+08:00
draft: true
author: ""
authorLink: ""
description: ""
license: ""
images: []

tags: ['Python']
categories: ['代码笔记']
---

从未系统学习过神经网络，直接从Bert开始上手学习，因此写的内容会尽可能的详细

<!--more-->

## 模型架构

### Bert

先从一个已经完成的问答模型开始，这里是一个使用`BertForQuestionAnswering`类构建的模型。
就是在 `BertModel` 模块后面加了一个 `Linear` 模块。
使用时，BertModel部分的参数直接读取`bert-base-cased`，然后再使用问答数据fine-tune，对所有参数进行微调，就可以达到比较好的效果。
这种方式就是BERT模型的推荐使用方式，即在预训练的模型后面添加一个全链接层，然后微调模型完成不同类型的任务。


```
BertForQuestionAnswering(
  (bert): BertModel(
    (embeddings): BertEmbeddings(
      (word_embeddings): Embedding(28996, 768, padding_idx=0)
      (position_embeddings): Embedding(512, 768)
      (token_type_embeddings): Embedding(2, 768)
      (LayerNorm): LayerNorm((768,), eps=1e-12, elementwise_affine=True)
      (dropout): Dropout(p=0.1, inplace=False)
    )
    (encoder): BertEncoder(
      (layer): ModuleList(
        (0-11): 12 x BertLayer(
          (attention): BertAttention(
            (self): BertSelfAttention(
              (query): Linear(in_features=768, out_features=768, bias=True)
              (key): Linear(in_features=768, out_features=768, bias=True)
              (value): Linear(in_features=768, out_features=768, bias=True)
              (dropout): Dropout(p=0.1, inplace=False)
            )
            (output): BertSelfOutput(
              (dense): Linear(in_features=768, out_features=768, bias=True)
              (LayerNorm): LayerNorm((768,), eps=1e-12, elementwise_affine=True)
              (dropout): Dropout(p=0.1, inplace=False)
            )
          )
          (intermediate): BertIntermediate(
            (dense): Linear(in_features=768, out_features=3072, bias=True)
            (intermediate_act_fn): GELUActivation()
          )
          (output): BertOutput(
            (dense): Linear(in_features=3072, out_features=768, bias=True)
            (LayerNorm): LayerNorm((768,), eps=1e-12, elementwise_affine=True)
            (dropout): Dropout(p=0.1, inplace=False)
          )
        )
      )
    )
  )
  (qa_outputs): Linear(in_features=768, out_features=2, bias=True)
)
```

完整的pipeline测试
```
context = "My name is Foo"
question = "Who?"
question_answerer(question=question, context=context, device=torch.device('cpu'))
>>> {'score': 0.9219040870666504, 'start': 11, 'end': 14, 'answer': 'Foo'}
```


仅bert测试
```
input_ids=tensor([[ 101, 2627,  136,  102, 1422, 1271, 1110,  143, 5658,  102]],dtype=torch.int32)
token_type_ids=tensor([[0, 0, 0, 0, 1, 1, 1, 1, 1, 1]], dtype=torch.int32)
position_ids=tensor([[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]], dtype=torch.int32)
attention_mask=tensor([[1, 1, 1, 1, 1, 1, 1, 1, 1, 1]], dtype=torch.int32)

bert_output = model.bert(
    input_ids=input_ids,
    token_type_ids=token_type_ids,
    position_ids=position_ids,
    attention_mask=attention_mask
)
bert_output.last_hidden_state.size()

>>> torch.Size([1, 10, 768])
```


### BertEmbeddings

```
    (embeddings): BertEmbeddings(
      (word_embeddings): Embedding(28996, 768, padding_idx=0)
      (position_embeddings): Embedding(512, 768)
      (token_type_embeddings): Embedding(2, 768)
      (LayerNorm): LayerNorm((768,), eps=1e-12, elementwise_affine=True)
      (dropout): Dropout(p=0.1, inplace=False)
    )
```


``` python
def forward(self,
    input_ids: Optional[torch.LongTensor] = None,
    token_type_ids: Optional[torch.LongTensor] = None,
    position_ids: Optional[torch.LongTensor] = None,
    inputs_embeds: Optional[torch.FloatTensor] = None,
) -> torch.Tensor:
    embeddings = inputs_embeds + token_type_embeddings + position_embeddings
    embeddings = self.LayerNorm(embeddings)
    embeddings = self.dropout(embeddings)
    return embeddings
```

embeddings 测试
```
embeddings = model.bert.embeddings(
    input_ids=input_ids,
    token_type_ids=token_type_ids,
    position_ids=position_ids
)
embeddings.size()

>>> torch.Size([1, 10, 768])
```

