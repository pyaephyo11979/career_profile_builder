# Career Profile Builder

Full-stack app that parses resumes, scores their health, and generates profile-ready exports.

## Highlights
- Authenticated resume uploads (.pdf/.docx, ≤5 MB) with JWT via Django REST Framework SimpleJWT.
- Parsing pipeline: text extraction (pdfplumber/python-docx) → preprocess → structured entities (contact, skills, experience, projects, education) → resume health scoring.
- Exports: GitHub README-style Markdown and LinkedIn-style profile payloads; frontend can download Markdown/CSV and a lightweight PDF preview.
- Resume CRUD (list/detail/update/delete) scoped to the owner; exports can be regenerated on demand.
- React + Vite frontend with upload/preview, inline editing of parsed data, resume health visualization, and mock json-server script for UI-only prototyping.

## Tech Stack
- Backend: Django 6, Django REST Framework, SimpleJWT, sqlite3 (dev), optional django-cors-headers, pdfplumber, python-docx.
- Frontend: React 19, TypeScript, Vite 7, Tailwind CSS 4, React Router 7, lucide-react, Radix UI.
- Tooling: ESLint 9, TypeScript 5.9, json-server (mock API on port 3001).

## Project Structure
```text
backend/            # Django project and parser app
	cpb_api/          # settings, urls, WSGI/ASGI
	parser/           # models, serializers, services, API views
	docs/api.md       # REST contract and sample payloads
frontend/           # React + Vite client
	src/              # pages, components, hooks, contexts, router
	public/           # static assets
README.md
```

## Prerequisites
- Python 3.10+ (3.12+ recommended)
- Node.js 18+ and npm
- macOS/Linux shell commands below; adapt for Windows if needed

## Backend Setup
1) `cd backend`
2) Create a virtualenv and install dependencies:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
3) Apply migrations and start the API:
```bash
python manage.py migrate
python manage.py runserver
```
4) Optional: create an admin user for browsing data:
```bash
python manage.py createsuperuser
```
- API base: http://127.0.0.1:8000
- Dev CORS/CSRF origins already allow http://localhost:5173 and http://127.0.0.1:5173 (see [backend/cpb_api/settings.py](backend/cpb_api/settings.py)).
- Defaults to sqlite; update `DATABASES` in settings for another database.

## Frontend Setup
1) `cd frontend`
2) Point the client at your API (defaults empty). For local dev:
```bash
echo "VITE_API_BASE_URL=http://127.0.0.1:8000" > .env
```
3) Install and start Vite dev server:
```bash
npm install
npm run dev
```
4) Optional UI-only mock server:
```bash
npm run start   # json-server on http://localhost:3001 using src/data/db.json
```

## API Quickstart
Full contract and sample payloads live in [backend/docs/api.md](backend/docs/api.md). Common calls:

Register
```bash
curl -X POST http://127.0.0.1:8000/api/register/ \
	-H "Content-Type: application/json" \
	-d '{"username":"demo","email":"demo@example.com","password":"password123"}'
```

Login (JWT)
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
	-H "Content-Type: application/json" \
	-d '{"username":"demo","password":"password123"}'
```

Upload and parse
```bash
curl -X POST http://127.0.0.1:8000/api/parse-resume/ \
	-H "Authorization: Bearer <access-token>" \
	-F "file=@resume.pdf"
```

Resume CRUD and exports
- GET /api/resumes/
- GET /api/resumes/<id>/
- PATCH /api/resumes/<id>/edit/
- GET /api/resumes/<id>/exports/

Constraints: accepts .pdf/.docx up to 5 MB; all resume routes require JWT and are scoped to the authenticated user.

## Frontend Behavior (current)
- Auth context persists JWT in localStorage; token refresh handled in [frontend/src/lib/api.ts](frontend/src/lib/api.ts).
- Upload page validates size/type, previews PDFs, posts to `uploadResume`, and redirects to `/resumes/:id` on success.
- Result page fetches the resume, supports inline edits, saves via `PATCH /api/resumes/<id>/edit/`, regenerates exports via `GET /api/resumes/<id>/exports/`, and lets users copy/download Markdown, CSV skills, or a lightweight PDF.
- Home and hero content showcase the product; Login/Register forms are wired to the API base you configure; the mock server script remains available for UI-only demos.

## Scripts
- Backend: `python manage.py test` to run Django tests.
- Frontend: `npm run lint`, `npm run build`, `npm run preview`.

## Troubleshooting
- 401 responses: include `Authorization: Bearer <access-token>` and refresh via `/api/auth/refresh/` when needed.
- CORS/CSRF issues: ensure django-cors-headers is installed (it is) and origins in [backend/cpb_api/settings.py](backend/cpb_api/settings.py) cover your frontend host.
- Upload failures: only .pdf/.docx are supported and files must be ≤5 MB.
