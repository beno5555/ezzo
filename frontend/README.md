# WebCity frontend

The Angular app for WebCity. The commands, the dev proxy and the CORS setting are described under **Frontend** in the repo's `CLAUDE.md`.

In short: start the backend first (`dotnet run --project aspnetproject` from `backend/`), then run `npm ci` once and `npm start` here, and open http://localhost:4200. The dev server forwards `/api` and `/hubs` to the backend's https port.
