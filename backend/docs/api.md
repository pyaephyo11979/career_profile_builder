# Career Profile Builder API

This document describes the REST API exposed by the Career Profile Builder backend. All endpoints are served from the same Django project and use JSON for request/response payloads unless otherwise noted.

Base URL examples:

- Local development: `http://127.0.0.1:8000`
- Cloud/staging: replace the host accordingly but keep the `/api/` prefix

---

## Authentication

The API uses JSON Web Tokens (JWT) provided by `rest_framework_simplejwt`. Most endpoints require a valid `Authorization: Bearer <access-token>` header. Tokens are obtained via the login endpoint and refreshed via the refresh endpoint. The Django REST Framework global permission is `IsAuthenticated`, so any endpoint not explicitly overriding permissions will require a token.

| Endpoint | Method | Description | Auth |
| --- | --- | --- | --- |
| `/api/auth/login/` | POST | Obtain `access` and `refresh` tokens. | No |
| `/api/auth/refresh/` | POST | Exchange a refresh token for a new access token. | No |

### Login (`/api/auth/login/`)

Request body:

```json
{
  "username": "demo",
  "password": "your-password"
}
```

Successful response:

```json
{
  "refresh": "<refresh-token>",
  "access": "<access-token>"
}
```

### Refresh (`/api/auth/refresh/`)

```json
{
  "refresh": "<refresh-token>"
}
```

Returns a new `access` token and, optionally, a rotated `refresh` token if configured.

---

## Registration

| Endpoint | Method | Description | Auth |
| --- | --- | --- | --- |
| `/api/register/` | POST | Create a new Django user account. | No |

Request body:

```json
{
  "username": "demo",
  "email": "demo@example.com",
  "password": "minimum-8-chars"
}
```

Response (`201 Created`):

```json
{
  "id": 7,
  "username": "demo"
}
```

Validation errors return `400 Bad Request` with field-level messages (e.g., username already taken, password too short).

---

## Resume Parsing Workflow

### Upload & Parse

| Endpoint | Method | Description | Auth |
| --- | --- | --- | --- |
| `/api/parse-resume/` | POST | Upload a resume file, run the parsing pipeline, and create a `Resume` record. | Yes |

- Content type: `multipart/form-data`
- Field: `file` (required). Supported extensions: `.pdf`, `.docx`. Files must be ≤ 5 MB.

Sample `curl`:

```bash
curl -X POST http://127.0.0.1:8000/api/parse-resume/ \
  -H "Authorization: Bearer <access-token>" \
  -F "file=@resume.pdf"
```

Successful response (`201 Created`):

```json
{
  "resume_id": 12,
  "raw_text": "Full extracted text...",
  "contact": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1 555 123 4567",
    "links": {
      "linkedin": "https://linkedin.com/in/janedoe",
      "github": "https://github.com/janedoe",
      "portfolio": null,
      "other": []
    }
  },
  "sections_found": ["contact", "skills", "experience"],
  "skills": {
    "categories": {
      "programming": ["Python", "JavaScript"],
      "cloud": ["AWS"],
      "databases": []
    },
    "confidence": 0.75
  },
  "projects": [
    {
      "name": "Smart Hiring Platform",
      "summary": "Internal ATS that ranks applicants via NLP scoring.",
      "highlights": ["Reduced screening time by 60%"],
      "tech_stack": ["Python", "React", "PostgreSQL"],
      "links": ["https://github.com/acme/ats"]
    }
  ],
  "education": [
    {
      "school": "ABC University",
      "degree": "BSc",
      "field": null,
      "start_year": "2015",
      "end_year": "2019"
    }
  ],
  "experience": [
    {
      "title": "Software Engineer",
      "company": "ACME Corp",
      "start_date": null,
      "end_date": null,
      "location": null,
      "highlights": [
        "Reduced build time by 40%",
        "Led migration to AWS"
      ]
    }
  ],
  "confidence": {
    "email": 0.99,
    "phone": 0.85,
    "links": 0.9,
    "name": 0.6
  },
  "resume_health": {
    "score": 70,
    "strengths": ["Email detected"],
    "warnings": ["Skills list is short"],
    "suggestions": ["Add more relevant skills (tools, frameworks, databases)."]
  },
  "profile_exports": {
    "github_readme": "# Jane Doe\n\n## About Me\n...",
    "linkedin_profile": {
      "name": "Jane Doe",
      "headline": "Software Engineer at ACME | Python | React | AWS",
      "about": "I am a Software Engineer focused on building high-quality products...",
      "experience": [],
      "projects": [],
      "education": [],
      "skills": ["Python", "React", "AWS"]
    }
  }
}
```

Failure scenarios:

- `400 Bad Request`: invalid file extension/size, empty file, parsing failures.
- `401 Unauthorized`: missing/invalid JWT.

### Full Output Sample

Use this as a quick contract reference when mocking the frontend or building client SDKs. It mirrors what `/api/parse-resume/` returns and what `/api/resumes/<id>/` subsequently serves.

```json
{
  "resume_id": 42,
  "raw_text": "...full document text...",
  "contact": {
    "name": "Jordan Chen",
    "email": "jordan@example.com",
    "phone": "+1 555 222 1111",
    "links": {
      "linkedin": "https://www.linkedin.com/in/jordanchen",
      "github": "https://github.com/jordanchen",
      "portfolio": "https://jordanchen.dev",
      "other": ["https://medium.com/@jordanchen"]
    }
  },
  "sections_found": [
    "summary",
    "skills",
    "experience",
    "projects",
    "education",
    "certifications",
    "awards",
    "references"
  ],
  "skills": {
    "categories": {
      "programming_languages": ["Python", "Go", "TypeScript"],
      "frameworks": ["Django", "FastAPI", "React"],
      "cloud_platforms": ["AWS"],
      "devops_tools": ["Docker", "Terraform"],
      "databases": ["PostgreSQL", "MongoDB"],
      "data_science": [],
      "testing": ["PyTest", "Jest"],
      "tools": ["GitHub", "GraphQL", "Postman"],
      "basic_skills": ["HTML", "Responsive Design"],
      "soft_skills": ["Leadership", "Communication"],
      "product_skills": ["Agile", "Kanban"],
      "languages": ["English", "Japanese"]
    },
    "confidence": 0.81
  },
  "projects": [
    {
      "name": "Data Observability Hub",
      "summary": "Self-serve dashboards surfacing freshness SLAs across 120+ pipelines.",
      "highlights": [
        "Cut incident MTTR from 4h to 55m",
        "Drove stakeholder adoption across 7 teams"
      ],
      "tech_stack": ["Python", "TypeScript", "React", "PostgreSQL", "Docker"],
      "links": ["https://github.com/jordanchen/data-obs"]
    }
  ],
  "education": [
    {
      "school": "UC Berkeley",
      "degree": "BSc",
      "field": "Computer Science",
      "start_year": "2014",
      "end_year": "2018"
    }
  ],
  "experience": [
    {
      "title": "Lead Backend Engineer",
      "company": "RocketOps",
      "start_date": "Jan 2022",
      "end_date": "Present",
      "location": "Remote",
      "highlights": [
        "Scaled ingestion pipeline to 50M events/day",
        "Led 6-engineer squad across 3 timezones"
      ]
    }
  ],
  "confidence": {
    "email": 0.99,
    "phone": 0.82,
    "links": 0.92,
    "name": 0.65
  },
  "resume_health": {
    "score": 88,
    "strengths": [
      "Email detected",
      "Skills section looks strong",
      "Experience detected",
      "Includes quantified achievements"
    ],
    "warnings": ["No GitHub/LinkedIn detected"],
    "suggestions": ["Add GitHub and/or LinkedIn links to improve credibility."]
  }
}
```

### Resume CRUD

All resume operations are scoped to the authenticated user; attempts to access resumes belonging to other users return `404 Not Found`.

| Endpoint | Method | Description | Auth |
| --- | --- | --- | --- |
| `/api/resumes/` | GET | List the calling user's resumes ordered by `created_at` descending. | Yes |
| `/api/resumes/<id>/` | GET | Retrieve one resume. | Yes |
| `/api/resumes/<id>/edit/` | PATCH | Update editable fields (`parsed_data`, `resume_health`, `is_confirmed`). | Yes |
| `/api/resumes/<id>/exports/` | GET | Generate GitHub README and LinkedIn-ready profile content from the parsed resume. | Yes |

#### List (`GET /api/resumes/`)

Response (`200 OK`):

```json
[
  {
    "id": 12,
    "file_name": "resume.pdf",
    "raw_text": "...",
    "parsed_data": {"contact": {"email": "jane@example.com"}},
    "resume_health": {"score": 70},
    "profile_exports": {
      "github_readme": "# Jane Doe\n...",
      "linkedin_profile": {"headline": "Software Engineer | Python | React"}
    },
    "is_confirmed": false,
    "created_at": "2026-01-31T10:04:27Z",
    "updated_at": "2026-01-31T10:04:27Z"
  }
]
```

#### Detail (`GET /api/resumes/<id>/`)

Returns the same shape as list entries. Missing records or attempts to fetch another user's resume yield `404`.

#### Exports (`GET /api/resumes/<id>/exports/`)

Response (`200 OK`):

```json
{
  "resume_id": 12,
  "profile_exports": {
    "github_readme": "# Jane Doe\n...",
    "linkedin_profile": {
      "name": "Jane Doe",
      "headline": "Software Engineer at ACME | Python | React | AWS",
      "about": "I am a Software Engineer focused on building high-quality products...",
      "experience": [],
      "projects": [],
      "education": [],
      "skills": ["Python", "React", "AWS"]
    }
  }
}
```

#### Update (`PATCH /api/resumes/<id>/edit/`)

Request body (any subset of fields):

```json
{
  "parsed_data": {"contact": {"name": "Jane A. Doe"}},
  "resume_health": {"score": 85},
  "is_confirmed": true
}
```

Response mirrors the serializer fields (`200 OK`). Validation errors return `400 Bad Request`.

---

## Common Error Formats

Errors adhere to DRF's serializer style:

```json
{
  "file": ["Unsupported file type. Please upload a PDF or Word document."]
}
```

Authentication failures:

```json
{
  "detail": "Authentication credentials were not provided.",
  "code": "not_authenticated"
}
```

---

## Data Model Overview

`Resume` records (see `parser.models.Resume`) include:

- `user`: FK to `auth.User` (owner).
- `file_name`, `raw_text`: original metadata and plain text.
- `parsed_data`: JSON blob containing extractor output (contact, sections, skills, etc.).
- `resume_health`: JSON blob from the health scorer (`score`, `strengths`, `warnings`, `suggestions`).
- `is_confirmed`: boolean flag clients can toggle after manual review.
- Timestamps: `created_at`, `updated_at`.

---

## Testing the API Quickly

1. Create a superuser (`python manage.py createsuperuser`) or use the register endpoint.
2. Obtain JWT tokens via `/api/auth/login/`.
3. Upload a resume through `/api/parse-resume/`.
4. Fetch the parsed data with `/api/resumes/` or `/api/resumes/<id>/`.

Use tools like `curl`, Postman, or HTTPie to exercise the workflow.
