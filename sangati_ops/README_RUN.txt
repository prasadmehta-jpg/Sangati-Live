1) cp .env.example .env  (edit OPENAI_* if using LLM, else set LLM_PROVIDER=none)
2) docker compose up --build
3) POST knowledge:
   curl -X POST http://localhost:8080/v1/knowledge/ingest -H "Content-Type: application/json" \
   -d '{"venue_id":"demo_venue","title":"Expedite SOP","text":"When ticket times rise, assign runner to pass, batch similar items, pause seating 5 min if needed.","tags":["sop","kitchen"]}'
4) Run agents:
   curl -X POST http://localhost:8080/v1/agents/run -H "Content-Type: application/json" \
   -d '{"venue_id":"demo_venue","intent":"balanced","max_recs":5}'
