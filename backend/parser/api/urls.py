from django.urls import path

from .views import ParseResumeView
from .auth_views import RegisterView
from .resume_views import ResumeListView, ResumeDetailView
from .view_resume_edit import ResumeUpdateView

urlpatterns = [
    path("parse-resume/", ParseResumeView.as_view(), name="parse-resume"),
    path("resumes/", ResumeListView.as_view(), name="resume-list"),
    path("resumes/<int:pk>/", ResumeDetailView.as_view(), name="resume-detail"),
    path("resumes/<int:pk>/edit/", ResumeUpdateView.as_view(), name="resume-update"),
    path("register/", RegisterView.as_view(), name="register"),
]
