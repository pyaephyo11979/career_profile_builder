# Career Profile Builder

Career Profile Builder is a full-stack resume parsing app:

- `backend/`: Django + Django REST Framework API for resume upload, parsing, scoring, and profile exports.
- `frontend/`: React + TypeScript + Vite UI for authentication, upload, and result views.

## Features

- Upload resume files (`.pdf`, `.docx`, max 5 MB)
- Extract:
- Contact info
- Skills by category
- Experience
- Projects
- Education
- Compute resume health score with strengths/suggestions
- Save parsed resumes per authenticated user
- Export parsed resume into:
- GitHub README-ready Markdown
- LinkedIn-ready profile payload (headline/about/experience/projects/skills)

## Tech Stack

- Backend: Django, Django REST Framework, SimpleJWT
- Parsing: `pdfplumber`, `python-docx`
- Frontend: React 19, TypeScript, Vite, Tailwind CSS

## Project Structure

```text
career_profile_buider/
├── backend/
│   ├── cpb_api/              # Django project config
│   ├── parser/               # Resume parsing app
│   ├── docs/api.md           # API contract
│   └── manage.py
├── frontend/
│   ├── src/pages/            # App pages
│   ├── src/components/       # UI components
│   └── package.json
└── README.md
```

## Prerequisites

- Python 3.10+ (3.12+ recommended)
- Node.js 18+
- npm

## Backend Setup

From `/Users/pyaephyohlaing/Developer/WebProjects/career_profile_buider/backend`:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install django djangorestframework djangorestframework-simplejwt pdfplumber python-docx
python3 manage.py migrate
python3 manage.py runserver
```

Backend default URL: `http://127.0.0.1:8000`

## Frontend Setup

From `/Users/pyaephyohlaing/Developer/WebProjects/career_profile_buider/frontend`:

```bash
npm install
npm run dev
```

Frontend default URL: `http://127.0.0.1:5173`

## API Endpoints

Base URL: `http://127.0.0.1:8000`

- `POST /api/register/`
- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `POST /api/parse-resume/`
- `GET /api/resumes/`
- `GET /api/resumes/<id>/`
- `PATCH /api/resumes/<id>/edit/`
- `GET /api/resumes/<id>/exports/`

See full API details: `/Users/pyaephyohlaing/Developer/WebProjects/career_profile_buider/backend/docs/api.md`

## Quick API Flow

1. Register:

```bash
curl -X POST http://127.0.0.1:8000/api/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","email":"demo@example.com","password":"password123"}'
```

2. Login and get JWT:

```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"password123"}'
```

3. Parse resume:

```bash
curl -X POST http://127.0.0.1:8000/api/parse-resume/ \
  -H "Authorization: Bearer <access-token>" \
  -F "file=@resume.pdf"
```

## Current Frontend Integration Status

The backend is functional, but frontend API integration is still partial:

- Login/Register pages are currently placeholder UI only.
- Upload page currently does not post file to backend yet.
- Result page currently uses a hardcoded URL (`http://localhost:3001/...`) that should be replaced with backend `/api/...` routes.
- JWT token storage/authorization header wiring is still needed in frontend fetch calls.

## Notes

- Resume records are user-scoped (you can only access your own resumes).
- Most API routes require JWT auth.
- Supported resume formats are `.pdf` and `.docx`.
