#!/bin/bash
bash -c "cd gateway_api; uvicorn api:app --port 8010 --reload"
