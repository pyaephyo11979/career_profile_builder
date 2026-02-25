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

function downloadFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadTextFile(content: string, fileName: string, mimeType = "text/plain;charset=utf-8") {
  downloadFile(new Blob([content], { type: mimeType }), fileName);
}

function normalizeUrl(url: string): string {
  const trimmed = (url ?? "").trim();
  if (!trimmed) return "";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function toLines(text: string): string[] {
  return text
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toLineText(items: string[] | undefined): string {
  if (!items || items.length === 0) return "";
  return items.join("\n");
}

function toCsvText(items: string[] | undefined): string {
  if (!items || items.length === 0) return "";
  return items.join(", ");
}

function fromCsvText(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function cloneParsedData(data: ParsedResumeData): ParsedResumeData {
  return JSON.parse(JSON.stringify(data ?? {})) as ParsedResumeData;
}

function setPdfLine(line: string): string {
  const escaped = line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  return `(${escaped}) Tj`;
}

function buildPdfFromText(text: string): Blob {
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 50;
  const fontSize = 10;
  const lineHeight = 14;
  const maxLinesPerPage = Math.max(1, Math.floor((pageHeight - margin * 2) / lineHeight));
  const allLines = text.replace(/\r/g, "").split("\n");
  const pages: string[][] = [];

  for (let i = 0; i < allLines.length; i += maxLinesPerPage) {
    pages.push(allLines.slice(i, i + maxLinesPerPage));
  }
  if (pages.length === 0) pages.push([""]);

  type PdfObj = { id: number; body: string };
  const objects: PdfObj[] = [];
  let idCounter = 1;

  const catalogId = idCounter++;
  const pagesId = idCounter++;
  const pageIds: number[] = [];
  const contentIds: number[] = [];

  pages.forEach(() => {
    const contentId = idCounter++;
    const pageId = idCounter++;
    contentIds.push(contentId);
    pageIds.push(pageId);
  });

  const fontId = idCounter++;

  objects.push({ id: catalogId, body: `<< /Type /Catalog /Pages ${pagesId} 0 R >>` });
  objects.push({ id: pagesId, body: `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>` });

  pages.forEach((lines, index) => {
    const textOps: string[] = [];
    textOps.push("BT");
    textOps.push(`/F1 ${fontSize} Tf`);
    textOps.push(`${lineHeight} TL`);
    textOps.push(`${margin} ${pageHeight - margin} Td`);

    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) textOps.push("T*");
      if (line.length > 0) textOps.push(setPdfLine(line));
    });

    textOps.push("ET");
    const stream = textOps.join("\n");

    objects.push({
      id: contentIds[index],
      body: `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    });

    objects.push({
      id: pageIds[index],
      body: `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`,
    });
  });

  objects.push({ id: fontId, body: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>" });
  objects.sort((a, b) => a.id - b.id);

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  objects.forEach((obj) => {
    offsets.push(pdf.length);
    pdf += `${obj.id} 0 obj\n${obj.body}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
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
  const [editDraft, setEditDraft] = useState<ParsedResumeData>({});

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
          setEditDraft(cloneParsedData(data.parsed_data ?? {}));
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
  const renderData = isEditing ? editDraft : parsedData;
  const contact = renderData.contact ?? {};
  const experience = renderData.experience ?? [];
  const projects = renderData.projects ?? [];
  const education = renderData.education ?? [];
  const skillsByCategory = renderData.skills?.categories ?? {};
  const score = resume.resume_health?.score ?? 0;
  const cvMarkdown = exports?.cv_markdown ?? "";
  const githubReadme = exports?.github_readme ?? "";

  const contactLinks = (contact.links ?? {}) as Record<string, string | string[] | null>;

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
    setEditDraft(cloneParsedData(parsedData));
    setEditError(null);
    setEditStatus(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditDraft(cloneParsedData(parsedData));
    setEditError(null);
    setEditStatus(null);
    setIsEditing(false);
  };

  const handleSaveEdits = async () => {
    if (!resumeId) return;

    setIsSaving(true);
    setEditError(null);
    setEditStatus(null);

    try {
      const updatedResume = await updateResume(resumeId, { parsed_data: editDraft });
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

  const handleDownloadCvPdf = () => {
    if (!cvMarkdown) return;
    downloadFile(buildPdfFromText(cvMarkdown), "CV.pdf");
  };

  const updateContactField = (field: "name" | "email" | "phone", value: string) => {
    setEditDraft((prev) => ({
      ...prev,
      contact: {
        ...(prev.contact ?? {}),
        [field]: value,
      },
    }));
  };

  const updateContactLinks = (key: string, value: string | string[]) => {
    setEditDraft((prev) => ({
      ...prev,
      contact: {
        ...(prev.contact ?? {}),
        links: {
          ...((prev.contact?.links ?? {}) as Record<string, string | string[] | null>),
          [key]: value,
        },
      },
    }));
  };

  const updateExperience = (index: number, field: keyof ParsedExperience, value: string | string[]) => {
    setEditDraft((prev) => {
      const nextExperience = [...(prev.experience ?? [])];
      nextExperience[index] = {
        ...(nextExperience[index] ?? {}),
        [field]: value,
      };
      return {
        ...prev,
        experience: nextExperience,
      };
    });
  };

  const addExperience = () => {
    setEditDraft((prev) => ({
      ...prev,
      experience: [
        ...(prev.experience ?? []),
        { title: "", company: "", start_date: "", end_date: "", location: "", highlights: [] },
      ],
    }));
  };

  const removeExperience = (index: number) => {
    setEditDraft((prev) => ({
      ...prev,
      experience: (prev.experience ?? []).filter((_, i) => i !== index),
    }));
  };

  const updateProject = (index: number, field: keyof ParsedProject, value: string | string[]) => {
    setEditDraft((prev) => {
      const nextProjects = [...(prev.projects ?? [])];
      nextProjects[index] = {
        ...(nextProjects[index] ?? {}),
        [field]: value,
      };
      return {
        ...prev,
        projects: nextProjects,
      };
    });
  };

  const addProject = () => {
    setEditDraft((prev) => ({
      ...prev,
      projects: [
        ...(prev.projects ?? []),
        { name: "", summary: "", highlights: [], tech_stack: [], links: [] },
      ],
    }));
  };

  const removeProject = (index: number) => {
    setEditDraft((prev) => ({
      ...prev,
      projects: (prev.projects ?? []).filter((_, i) => i !== index),
    }));
  };

  const updateEducation = (index: number, field: keyof ParsedEducation, value: string) => {
    setEditDraft((prev) => {
      const nextEducation = [...(prev.education ?? [])];
      nextEducation[index] = {
        ...(nextEducation[index] ?? {}),
        [field]: value,
      };
      return {
        ...prev,
        education: nextEducation,
      };
    });
  };

  const addEducation = () => {
    setEditDraft((prev) => ({
      ...prev,
      education: [
        ...(prev.education ?? []),
        { school: "", degree: "", field: "", start_year: "", end_year: "" },
      ],
    }));
  };

  const removeEducation = (index: number) => {
    setEditDraft((prev) => ({
      ...prev,
      education: (prev.education ?? []).filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-gray-800 sm:p-6 md:p-8">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-300 bg-white p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6 md:p-8">
          <div>
            <h2 className="m-0 text-2xl font-bold text-gray-900">{contact.name || resume.file_name}</h2>
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
            <div className="mb-10 rounded-lg border border-gray-300 bg-white">
              <div className="flex flex-col gap-3 border-b border-gray-300 p-4 sm:flex-row sm:items-center sm:justify-between">
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
                    Edit your extracted details directly in the web form, then save to regenerate updated exports.
                  </p>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h4 className="mb-3 text-sm font-semibold text-gray-800">Contact</h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          value={contact.name ?? ""}
                          onChange={(event) => updateContactField("name", event.target.value)}
                          placeholder="Full name"
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                        <input
                          value={contact.email ?? ""}
                          onChange={(event) => updateContactField("email", event.target.value)}
                          placeholder="Email"
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                        <input
                          value={contact.phone ?? ""}
                          onChange={(event) => updateContactField("phone", event.target.value)}
                          placeholder="Phone"
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                        <input
                          value={typeof contactLinks.github === "string" ? contactLinks.github : ""}
                          onChange={(event) => updateContactLinks("github", event.target.value)}
                          placeholder="GitHub URL"
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                        <input
                          value={typeof contactLinks.linkedin === "string" ? contactLinks.linkedin : ""}
                          onChange={(event) => updateContactLinks("linkedin", event.target.value)}
                          placeholder="LinkedIn URL"
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                        <textarea
                          value={toLineText(Array.isArray(contactLinks.other) ? contactLinks.other : [])}
                          onChange={(event) => updateContactLinks("other", toLines(event.target.value))}
                          placeholder="Other links (one per line)"
                          className="h-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-800">Experience</h4>
                        <button type="button" onClick={addExperience} className="text-xs font-semibold text-[#032b2b]">
                          + Add Experience
                        </button>
                      </div>
                      <div className="space-y-4">
                        {experience.map((exp, index) => (
                          <div key={`exp-${index}`} className="rounded-lg border border-gray-300 p-3">
                            <div className="mb-3 grid gap-2 sm:grid-cols-2">
                              <input
                                value={exp.title ?? ""}
                                onChange={(event) => updateExperience(index, "title", event.target.value)}
                                placeholder="Title"
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                              <input
                                value={exp.company ?? ""}
                                onChange={(event) => updateExperience(index, "company", event.target.value)}
                                placeholder="Company"
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                              <input
                                value={exp.start_date ?? ""}
                                onChange={(event) => updateExperience(index, "start_date", event.target.value)}
                                placeholder="Start date"
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                              <input
                                value={exp.end_date ?? ""}
                                onChange={(event) => updateExperience(index, "end_date", event.target.value)}
                                placeholder="End date"
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                              <input
                                value={exp.location ?? ""}
                                onChange={(event) => updateExperience(index, "location", event.target.value)}
                                placeholder="Location"
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2"
                              />
                            </div>
                            <textarea
                              value={toLineText(exp.highlights)}
                              onChange={(event) => updateExperience(index, "highlights", toLines(event.target.value))}
                              placeholder="Highlights (one per line)"
                              className="h-20 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => removeExperience(index)}
                              className="mt-2 text-xs font-semibold text-red-600"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-800">Projects</h4>
                        <button type="button" onClick={addProject} className="text-xs font-semibold text-[#032b2b]">
                          + Add Project
                        </button>
                      </div>
                      <div className="space-y-4">
                        {projects.map((project, index) => (
                          <div key={`project-${index}`} className="rounded-lg border border-gray-300 p-3">
                            <div className="grid gap-2 sm:grid-cols-2">
                              <input
                                value={project.name ?? ""}
                                onChange={(event) => updateProject(index, "name", event.target.value)}
                                placeholder="Project name"
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2"
                              />
                              <textarea
                                value={project.summary ?? ""}
                                onChange={(event) => updateProject(index, "summary", event.target.value)}
                                placeholder="Summary"
                                className="h-20 rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2"
                              />
                              <textarea
                                value={toLineText(project.highlights)}
                                onChange={(event) => updateProject(index, "highlights", toLines(event.target.value))}
                                placeholder="Highlights (one per line)"
                                className="h-20 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                              <textarea
                                value={toLineText(project.links)}
                                onChange={(event) => updateProject(index, "links", toLines(event.target.value))}
                                placeholder="Links (one per line)"
                                className="h-20 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                              <input
                                value={toCsvText(project.tech_stack)}
                                onChange={(event) => updateProject(index, "tech_stack", fromCsvText(event.target.value))}
                                placeholder="Tech stack (comma separated)"
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeProject(index)}
                              className="mt-2 text-xs font-semibold text-red-600"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-800">Education</h4>
                        <button type="button" onClick={addEducation} className="text-xs font-semibold text-[#032b2b]">
                          + Add Education
                        </button>
                      </div>
                      <div className="space-y-3">
                        {education.map((edu, index) => (
                          <div key={`edu-${index}`} className="rounded-lg border border-gray-300 p-3">
                            <div className="grid gap-2 sm:grid-cols-2">
                              <input
                                value={edu.school ?? ""}
                                onChange={(event) => updateEducation(index, "school", event.target.value)}
                                placeholder="School"
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                              <input
                                value={edu.degree ?? ""}
                                onChange={(event) => updateEducation(index, "degree", event.target.value)}
                                placeholder="Degree"
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                              <input
                                value={edu.field ?? ""}
                                onChange={(event) => updateEducation(index, "field", event.target.value)}
                                placeholder="Field"
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                              <input
                                value={edu.start_year ?? ""}
                                onChange={(event) => updateEducation(index, "start_year", event.target.value)}
                                placeholder="Start year"
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                              <input
                                value={edu.end_year ?? ""}
                                onChange={(event) => updateEducation(index, "end_year", event.target.value)}
                                placeholder="End year"
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeEducation(index)}
                              className="mt-2 text-xs font-semibold text-red-600"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {experience.length > 0 && (
              <div className="mb-10 rounded-lg border border-gray-300 bg-white p-4">
                <div className="mb-4 border-b-2 border-gray-300 pb-2 text-lg font-bold uppercase tracking-wide text-gray-700">
                  Professional Experience
                </div>
                {experience.map((exp: ParsedExperience, index) => (
                  <div
                    key={`${exp.company ?? "company"}-${index}`}
                    className="mb-4 rounded-lg border border-gray-300 bg-gray-50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="break-words text-base font-semibold text-gray-900">
                          {exp.title || "(Untitled role)"}
                        </h4>
                        <div className="mt-1 text-sm text-gray-600">
                          <span className="font-medium text-gray-800">{exp.company || "(Company)"}</span>
                          {exp.location ? <span className="text-gray-500"> • {exp.location}</span> : null}
                        </div>
                      </div>
                      <div className="shrink-0 text-xs font-medium text-gray-500">
                        {(exp.start_date || "N/A") + " - " + (exp.end_date || "Present")}
                      </div>
                    </div>
                    {exp.highlights && exp.highlights.length > 0 && (
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-gray-700">
                        {exp.highlights.map((highlight, i) => (
                          <li key={`${highlight}-${i}`}>{highlight}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {projects.length > 0 && (
              <div className="mb-10 rounded-lg border border-gray-300 bg-white p-4">
                <div className="mb-4 border-b-2 border-gray-300 pb-2 text-lg font-bold uppercase tracking-wide text-gray-700">
                  Projects
                </div>
                {projects.map((project: ParsedProject, index) => (
                  <div
                    key={`${project.name ?? "project"}-${index}`}
                    className="relative mb-6 border-l-4 border-indigo-100 pl-4"
                  >
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
                    {project.links?.map((link, i) => {
                      const href = normalizeUrl(link ?? "");
                      if (!href) return null;

                      return (
                        <div key={`${link}-${i}`}>
                          <a
                            href={href}
                            className="mt-1 block text-xs text-blue-600 hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {link}
                          </a>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {education.length > 0 && (
              <div className="mb-10 rounded-lg border border-gray-300 bg-white p-4">
                <div className="mb-4 border-b-2 border-gray-300 pb-2 text-lg font-bold uppercase tracking-wide text-gray-700">
                  Education
                </div>
                {education.map((edu: ParsedEducation, index) => (
                  <div
                    key={`${edu.school ?? "school"}-${index}`}
                    className="relative mb-6 border-l-4 border-blue-300 pl-4"
                  >
                    <h4 className="mb-1 text-lg font-semibold text-gray-900">{edu.school}</h4>
                    <div className="text-sm text-gray-500">
                      {edu.degree} {edu.field && `in ${edu.field}`} • {edu.start_year} - {edu.end_year}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-10">
              <details className="overflow-hidden rounded-md border border-gray-300">
                <summary className="cursor-pointer bg-gray-50 p-4 font-semibold text-gray-700 hover:bg-gray-100">
                  View Raw Extracted Text
                </summary>
                <pre className="overflow-x-auto whitespace-pre-wrap bg-white p-4 text-xs text-gray-500">
                  {resume.raw_text}
                </pre>
              </details>
            </div>

            <div className="mb-10 rounded-lg border border-gray-300 bg-white">
              <div className="flex flex-col gap-3 border-b border-gray-300 p-4 sm:flex-row sm:items-center sm:justify-between">
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
                <div className="rounded-lg border border-gray-300">
                  <div className="flex flex-col gap-2 border-b border-gray-300 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-gray-800">Generated CV (PDF)</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(cvMarkdown, "CV")}
                        disabled={!cvMarkdown}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Copy Text
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadCvPdf}
                        disabled={!cvMarkdown}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap p-3 text-xs text-gray-700">
                    {cvMarkdown || "No CV export yet. Click \"Generate Exports\"."}
                  </pre>
                </div>

                <div className="rounded-lg border border-gray-300">
                  <div className="flex flex-col gap-2 border-b border-gray-300 p-3 sm:flex-row sm:items-center sm:justify-between">
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
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300 bg-gray-50 p-5 sm:p-6 md:border-l md:border-t-0 md:p-8">
            <div className="mb-8 rounded-lg border border-gray-300 bg-white p-6 text-center shadow-sm">
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
              <div className="mb-4 border-b border-gray-300 pb-2 text-sm font-bold uppercase tracking-wide text-gray-700">
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

                {Object.entries(contactLinks).map(([key, value]) => {
                  if (!value || (Array.isArray(value) && value.length === 0)) return null;
                  const links = Array.isArray(value) ? value : [value];

                  return links.map((linkUrl, index) => {
                    const href = normalizeUrl(linkUrl);
                    if (!href) return null;

                    return (
                      <p key={`${key}-${index}`} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="min-w-[60px] capitalize font-semibold text-gray-800">{key}:</span>
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="max-w-[150px] truncate text-blue-600 hover:underline"
                        >
                          {linkUrl}
                        </a>
                      </p>
                    );
                  });
                })}
              </div>
            </div>

            <div className="mb-10">
              <div className="mb-4 border-b border-gray-300 pb-2 text-sm font-bold uppercase tracking-wide text-gray-700">
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
