# blog serverless backend
正在从散乱的lambda函数迁移到API Gateway

## api converter

- openapi3.1 --> openapi3.0
1. 安装 `npm i -g @apiture/openapi-down-convert`
2. 运行 `openapi-down-convert --input openapi.json --output openapi3.0.json`

- openapi3.0 --> swagger2.0
1. 安装 `npm install -g api-spec-converter`
2. 运行 `api-spec-converter --from=openapi_3 --to=swagger_2 --syntax=json openapi3.0.json > swagger.json`

