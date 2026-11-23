# WebCity frontend

The Angular app for WebCity. The commands and the dev proxy are in `frontend/CLAUDE.md`; the CORS setting is under **Allowed origins** in the root `CLAUDE.md`.

In short: start the backend first (`dotnet run --project aspnetproject` from `backend/`), then run `npm ci` once and `npm start` here, and open http://localhost:4200. The dev server forwards `/api` and `/hubs` to the backend's https port.
