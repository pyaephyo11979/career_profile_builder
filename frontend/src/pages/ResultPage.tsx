import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getResumeById,
  getResumeExports,
  updateResume,
  type ParsedEducation,
  type ParsedExperience,
  type ParsedProject,
  type ParsedResumeData,
  type ResumeProfileExports,
  type ResumeRecord,
} from "../lib/api";

function getScoreColor(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function downloadTextFile(content: string, fileName: string, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();

  const [resume, setResume] = useState<ResumeRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exports, setExports] = useState<ResumeProfileExports | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string | null>(null);
  const [parsedJsonDraft, setParsedJsonDraft] = useState("");

  const resumeId = useMemo(() => {
    if (!id) return null;
    const asNumber = Number(id);
    return Number.isFinite(asNumber) ? asNumber : null;
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!resumeId) {
        setError("Invalid resume id.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getResumeById(resumeId);
        if (!cancelled) {
          setResume(data);
          setExports((data.profile_exports as ResumeProfileExports | undefined) ?? null);
          setParsedJsonDraft(JSON.stringify(data.parsed_data ?? {}, null, 2));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load resume.";

        if (!cancelled) {
          setError(message);
          if (message.includes("Session expired") || message.includes("Not authenticated")) {
            auth.logout();
            navigate("/login", { replace: true });
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [auth, navigate, resumeId]);

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }
  if (loading) {
    return <div className="p-8 text-gray-500">Loading analysis...</div>;
  }
  if (!resume) {
    return <div className="p-8 text-gray-500">No resume found.</div>;
  }

  const parsedData = resume.parsed_data ?? {};
  const contact = parsedData.contact ?? {};
  const experience = parsedData.experience ?? [];
  const projects = parsedData.projects ?? [];
  const education = parsedData.education ?? [];
  const skillsByCategory = parsedData.skills?.categories ?? {};
  const score = resume.resume_health?.score ?? 0;
  const cvMarkdown = exports?.cv_markdown ?? "";
  const githubReadme = exports?.github_readme ?? "";
  const linkedinProfile = exports?.linkedin_profile;

  const handleGenerateExports = async () => {
    if (!resumeId) return;

    setIsExporting(true);
    setExportError(null);
    setCopyStatus(null);

    try {
      const payload = await getResumeExports(resumeId);
      setExports(payload.profile_exports);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate exports.";
      setExportError(message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleStartEdit = () => {
    setParsedJsonDraft(JSON.stringify(parsedData, null, 2));
    setEditError(null);
    setEditStatus(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setParsedJsonDraft(JSON.stringify(parsedData, null, 2));
    setEditError(null);
    setEditStatus(null);
    setIsEditing(false);
  };

  const handleSaveEdits = async () => {
    if (!resumeId) return;

    let parsedDraft: ParsedResumeData;
    try {
      parsedDraft = JSON.parse(parsedJsonDraft) as ParsedResumeData;
    } catch {
      setEditError("Invalid JSON format. Please fix parsing errors before saving.");
      return;
    }

    setIsSaving(true);
    setEditError(null);
    setEditStatus(null);

    try {
      const updatedResume = await updateResume(resumeId, { parsed_data: parsedDraft });
      setResume(updatedResume);
      const payload = await getResumeExports(resumeId);
      setExports(payload.profile_exports);
      setEditStatus("Resume information updated and CV exports regenerated.");
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save resume updates.";
      setEditError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(`${label} copied.`);
    } catch {
      setCopyStatus(`Unable to copy ${label.toLowerCase()}.`);
    }
  };

  const handleDownloadReadme = () => {
    if (!githubReadme) return;
    downloadTextFile(githubReadme, "README.md", "text/markdown;charset=utf-8");
  };

  const handleDownloadCv = () => {
    if (!cvMarkdown) return;
    downloadTextFile(cvMarkdown, "CV.md", "text/markdown;charset=utf-8");
  };

  const handleDownloadLinkedinJson = () => {
    if (!linkedinProfile) return;
    downloadTextFile(
      JSON.stringify(linkedinProfile, null, 2),
      "linkedin_profile.json",
      "application/json;charset=utf-8"
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-gray-800 sm:p-6 md:p-8">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 bg-white p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6 md:p-8">
          <div>
            <h2 className="m-0 text-2xl font-bold text-gray-900">
              {contact.name || resume.file_name}
            </h2>
            <div className="mt-2 text-sm text-gray-500">
              ID: #{resume.id} • Uploaded:{" "}
              {resume.created_at ? new Date(resume.created_at).toLocaleDateString() : "N/A"}
            </div>
          </div>
          <span
            className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
              resume.is_confirmed ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"
            }`}
          >
            {resume.is_confirmed ? "Confirmed Quote" : "Analysis Pending"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_340px]">
          <div className="p-5 sm:p-6 md:p-8">
            <div className="mb-10 rounded-lg border border-gray-200 bg-white">
              <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-base font-semibold text-gray-900">Edit Current Information</h3>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-[#032b2b] px-4 text-sm font-semibold text-white hover:bg-[#043d3d]"
                  >
                    Edit Details
                  </button>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleSaveEdits}
                      disabled={isSaving}
                      className="inline-flex h-10 items-center justify-center rounded-lg bg-[#032b2b] px-4 text-sm font-semibold text-white hover:bg-[#043d3d] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaving ? "Saving..." : "Save & Regenerate"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {(editError || editStatus) && (
                <div
                  className={`mx-4 mt-4 rounded-lg border px-3 py-2 text-sm ${
                    editError
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {editError ?? editStatus}
                </div>
              )}

              <div className="p-4">
                {!isEditing ? (
                  <p className="text-sm text-gray-600">
                    Update your extracted details, save them, and regenerate a fresh CV export from the edited data.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">
                      Edit JSON below (`parsed_data`) and save. Resume score and exports will be regenerated.
                    </p>
                    <textarea
                      value={parsedJsonDraft}
                      onChange={(event) => setParsedJsonDraft(event.target.value)}
                      className="h-80 w-full rounded-lg border border-gray-300 p-3 font-mono text-xs text-gray-800 focus:border-[#032b2b] focus:outline-none focus:ring-1 focus:ring-[#032b2b]"
                    />
                  </div>
                )}
              </div>
            </div>

            {experience.length > 0 && (
              <div className="mb-10">
                <div className="mb-4 border-b-2 border-gray-200 pb-2 text-lg font-bold uppercase tracking-wide text-gray-700">
                  Professional Experience
                </div>
                {experience.map((exp: ParsedExperience, index) => (
                  <div key={`${exp.company ?? "company"}-${index}`} className="relative mb-6 border-l-4 border-gray-200 pl-4">
                    <h4 className="mb-1 text-lg font-semibold text-gray-900">{exp.title}</h4>
                    <div className="mb-2 text-sm text-gray-500">
                      {exp.company} • {exp.start_date || "N/A"} - {exp.end_date || "Present"} •{" "}
                      {exp.location || "Remote"}
                    </div>
                    {exp.highlights && exp.highlights.length > 0 && (
                      <ul className="mt-2 pl-2 text-sm leading-relaxed text-gray-600">
                        {exp.highlights.map((highlight, i) => (
                          <li key={`${highlight}-${i}`} className="mb-1">
                            • {highlight}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {projects.length > 0 && (
              <div className="mb-10">
                <div className="mb-4 border-b-2 border-gray-200 pb-2 text-lg font-bold uppercase tracking-wide text-gray-700">
                  Projects
                </div>
                {projects.map((project: ParsedProject, index) => (
                  <div key={`${project.name ?? "project"}-${index}`} className="relative mb-6 border-l-4 border-indigo-100 pl-4">
                    <h4 className="mb-1 text-lg font-semibold text-gray-900">{project.name}</h4>
                    <div className="mb-2 text-sm text-gray-500">{project.summary}</div>
                    {project.tech_stack && project.tech_stack.length > 0 && (
                      <div className="mb-2 text-xs font-medium text-gray-500">
                        <span className="font-bold text-gray-700">Stack:</span>{" "}
                        {project.tech_stack.join(", ")}
                      </div>
                    )}
                    {project.highlights && project.highlights.length > 0 && (
                      <ul className="mt-2 pl-2 text-sm leading-relaxed text-gray-600">
                        {project.highlights.map((highlight, i) => (
                          <li key={`${highlight}-${i}`} className="mb-1">
                            • {highlight}
                          </li>
                        ))}
                      </ul>
                    )}
                    {project.links?.map((link, i) => (
                      <div key={`${link}-${i}`}>
                        <a
                          href={link}
                          className="mt-1 block text-xs text-blue-600 hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {link}
                        </a>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {education.length > 0 && (
              <div className="mb-10">
                <div className="mb-4 border-b-2 border-gray-200 pb-2 text-lg font-bold uppercase tracking-wide text-gray-700">
                  Education
                </div>
                {education.map((edu: ParsedEducation, index) => (
                  <div key={`${edu.school ?? "school"}-${index}`} className="relative mb-6 border-l-4 border-blue-300 pl-4">
                    <h4 className="mb-1 text-lg font-semibold text-gray-900">{edu.school}</h4>
                    <div className="text-sm text-gray-500">
                      {edu.degree} {edu.field && `in ${edu.field}`} • {edu.start_year} - {edu.end_year}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-10">
              <details className="overflow-hidden rounded-md border border-gray-200">
                <summary className="cursor-pointer bg-gray-50 p-4 font-semibold text-gray-700 hover:bg-gray-100">
                  View Raw Extracted Text
                </summary>
                <pre className="overflow-x-auto whitespace-pre-wrap bg-white p-4 text-xs text-gray-500">
                  {resume.raw_text}
                </pre>
              </details>
            </div>

            <div className="mb-10 rounded-lg border border-gray-200 bg-white">
              <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-base font-semibold text-gray-900">Profile Exports</h3>
                <button
                  type="button"
                  onClick={handleGenerateExports}
                  disabled={isExporting}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-[#032b2b] px-4 text-sm font-semibold text-white hover:bg-[#043d3d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isExporting ? "Generating..." : "Generate Exports"}
                </button>
              </div>

              {(exportError || copyStatus) && (
                <div
                  className={`mx-4 mt-4 rounded-lg border px-3 py-2 text-sm ${
                    exportError
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {exportError ?? copyStatus}
                </div>
              )}

              <div className="space-y-4 p-4">
                <div className="rounded-lg border border-gray-200">
                  <div className="flex flex-col gap-2 border-b border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-gray-800">Generated CV (Markdown)</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(cvMarkdown, "CV")}
                        disabled={!cvMarkdown}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadCv}
                        disabled={!cvMarkdown}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap p-3 text-xs text-gray-700">
                    {cvMarkdown || "No CV export yet. Click \"Generate Exports\"."}
                  </pre>
                </div>

                <div className="rounded-lg border border-gray-200">
                  <div className="flex flex-col gap-2 border-b border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-gray-800">GitHub README Export</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(githubReadme, "README")}
                        disabled={!githubReadme}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadReadme}
                        disabled={!githubReadme}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap p-3 text-xs text-gray-700">
                    {githubReadme || "No README export yet. Click \"Generate Exports\"."}
                  </pre>
                </div>

                <div className="rounded-lg border border-gray-200">
                  <div className="flex flex-col gap-2 border-b border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-gray-800">LinkedIn Profile Export</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            JSON.stringify(linkedinProfile ?? {}, null, 2),
                            "LinkedIn profile JSON"
                          )
                        }
                        disabled={!linkedinProfile}
                        className="w-fit rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Copy JSON
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadLinkedinJson}
                        disabled={!linkedinProfile}
                        className="w-fit rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Download JSON
                      </button>
                    </div>
                  </div>
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap p-3 text-xs text-gray-700">
                    {linkedinProfile
                      ? JSON.stringify(linkedinProfile, null, 2)
                      : "No LinkedIn export yet. Click \"Generate Exports\"."}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 bg-gray-50 p-5 sm:p-6 md:border-l md:border-t-0 md:p-8">
            <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
              <div
                className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full text-2xl font-extrabold text-white ${getScoreColor(
                  score
                )}`}
              >
                {score}
              </div>
              <h4 className="m-0 mb-3 font-bold text-gray-800">Resume Health</h4>

              <div className="text-left text-sm">
                {(resume.resume_health?.strengths?.length ?? 0) > 0 && (
                  <div className="mb-4">
                    <strong className="mb-1 block text-emerald-600">Strengths</strong>
                    <ul className="list-disc space-y-1 pl-4 text-gray-600">
                      {resume.resume_health.strengths?.slice(0, 3).map((strength, i) => (
                        <li key={`${strength}-${i}`}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(resume.resume_health?.suggestions?.length ?? 0) > 0 && (
                  <div>
                    <strong className="mb-1 block text-amber-600">Improvements</strong>
                    <ul className="list-disc space-y-1 pl-4 text-gray-600">
                      {resume.resume_health.suggestions?.slice(0, 3).map((suggestion, i) => (
                        <li key={`${suggestion}-${i}`}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-10">
              <div className="mb-4 border-b border-gray-200 pb-2 text-sm font-bold uppercase tracking-wide text-gray-700">
                Contact Details
              </div>
              <div className="space-y-3">
                <p className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="min-w-[60px] font-semibold text-gray-800">Email:</span>
                  <span className="truncate">{contact.email ?? "N/A"}</span>
                </p>
                <p className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="min-w-[60px] font-semibold text-gray-800">Phone:</span>
                  <span>{contact.phone || "N/A"}</span>
                </p>

                {Object.entries(contact.links ?? {}).map(([key, value]) => {
                  if (!value || (Array.isArray(value) && value.length === 0)) return null;
                  const linkUrl = Array.isArray(value) ? value[0] : value;

                  return (
                    <p key={key} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="min-w-[60px] capitalize font-semibold text-gray-800">{key}:</span>
                      <a
                        href={linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="max-w-[150px] truncate text-blue-600 hover:underline"
                      >
                        Link
                      </a>
                    </p>
                  );
                })}
              </div>
            </div>

            <div className="mb-10">
              <div className="mb-4 border-b border-gray-200 pb-2 text-sm font-bold uppercase tracking-wide text-gray-700">
                Skills Detected
              </div>
              {Object.entries(skillsByCategory).map(([category, categorySkills]) =>
                categorySkills.length > 0 ? (
                  <div key={category} className="mb-4">
                    <div className="mb-2 text-xs font-semibold uppercase text-gray-500">
                      {category.replace("_", " ")}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {categorySkills.map((skill, index) => (
                        <span
                          key={`${skill}-${index}`}
                          className="inline-block rounded-md border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
