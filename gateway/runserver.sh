#!/bin/bash
bash -c "export ENDPOINT_URL='http://localhost:8000';cd gateway_api; uvicorn main:app --port 8010 --reload"
