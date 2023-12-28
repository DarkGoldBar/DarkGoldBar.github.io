# DarkGoldBar-Backend
把散乱的lambda函数构建一个API，迁移到API Gateway

## 部署

1. 下载 `aws-sam-cli` https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html#install-sam-cli-instructions
2. 验证 `sam validate`
3. 构建 `sam build -u`  
4. 部署 `sam deploy --guided`

## 其他工具

- openapi3.1 --> openapi3.0
1. 安装 `npm i -g @apiture/openapi-down-convert`
2. 运行 `openapi-down-convert --input openapi.json --output openapi3.0.json`

- openapi3.0 --> swagger2.0
1. 安装 `npm install -g api-spec-converter`
2. 运行 `api-spec-converter --from=openapi_3 --to=swagger_2 --syntax=json openapi3.0.json > swagger.json`
   
