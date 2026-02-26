import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadResume } from "../lib/api";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function hasValidExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith(".pdf") || lower.endsWith(".doc") || lower.endsWith(".docx");
}

function getValidationError(candidate: File | null): string | null {
  if (!candidate) return "Please choose a resume file first.";
  if (!hasValidExtension(candidate.name)) {
    return "Unsupported file type. Please upload a PDF or Word document.";
  }
  if (candidate.size > MAX_FILE_SIZE) return "File size exceeds the 5 MB limit.";
  return null;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const navigate = useNavigate();

  const fileHint = useMemo(() => {
    if (!file) return "PDF or DOCX only. Max 5MB.";
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return `${file.name} • ${sizeMb} MB`;
  }, [file]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setStatus(null);
    setFile(e.target.files?.[0] ?? null);
  };

  const handleClear = () => {
    setFile(null);
    setError(null);
    setStatus(null);
  };

  const handleUpload = async () => {
    const selectedFile = file;
    const validationError = getValidationError(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!selectedFile) {
      setError("Please choose a resume file first.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setStatus("Uploading and parsing your resume...");

    try {
      const payload = await uploadResume(selectedFile);
      setStatus("Resume parsed successfully. Opening results...");
      navigate(`/resumes/${payload.resume_id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Resume parsing failed.";
      setError(message);
      setStatus(null);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 md:py-10">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Upload your resume
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Choose a file to upload. We’ll parse it and show structured results.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left: Upload Card */}
          <section className="lg:col-span-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-[0_18px_30px_rgba(0,0,0,0.35)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-medium text-white">
                    Resume file
                  </h2>
                  <p className="mt-1 text-xs text-white/60">{fileHint}</p>
                </div>

                <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70">
                  ≤ 5MB
                </span>
              </div>

              {/* Dropzone-like input */}
              <label className="mt-5 block">
                <span className="sr-only">Choose resume file</span>

                <div className="rounded-2xl border-2 border-dashed border-white/15 bg-white/5 p-6 transition hover:border-white/25">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-6 w-6 text-white/80"
                        aria-hidden="true"
                      >
                        <path
                          d="M12 16V8m0 0 3 3m-3-3-3 3"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M20 16.5a4.5 4.5 0 0 0-4.5-4.5c-.16 0-.31.01-.46.03A6 6 0 0 0 3 12.5 4.5 4.5 0 0 0 7.5 17H16"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">
                        Drag & drop your resume here
                      </p>
                      <p className="mt-1 text-xs text-white/70">
                        Or click to browse your files
                      </p>
                    </div>
                  </div>

                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="mt-4 block w-full cursor-pointer rounded-xl border border-white/15 bg-white/5 text-sm text-white/80
                               file:mr-4 file:rounded-lg file:border-0 file:bg-[#3B5BFF] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white
                               hover:file:bg-[#2F4CF5] focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
              </label>

              {(error || status) && (
                <div
                  className={`mt-5 rounded-lg border px-4 py-3 text-sm ${
                    error
                      ? "border-red-500/30 bg-red-500/10 text-red-200"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  }`}
                >
                  {error ?? status}
                </div>
              )}

              {/* Primary actions */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[#3B5BFF] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2F4CF5] disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleUpload}
                  disabled={isUploading || !file}
                >
                  {isUploading ? "Parsing..." : "Upload & Parse"}
                </button>

                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10"
                  onClick={handleClear}
                  disabled={isUploading}
                >
                  Clear
                </button>
              </div>

              {/* Helper panel */}
              <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
                <p className="font-medium text-white">Supported formats</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>PDF (.pdf)</li>
                  <li>Word (.docx)</li>
                  <li>Maximum size: 5MB</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Right: Preview + Placeholder Results */}
          <section className="lg:col-span-7">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-[0_18px_30px_rgba(0,0,0,0.35)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-medium text-white">
                    Preview
                  </h2>
                </div>

                <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-medium text-white/80">
                  Demo
                </span>
              </div>

              {preview && (
                  <iframe
                  src={preview}
                  className="mt-6 h-105 w-full rounded-xl border border-white/10 bg-white/5 sm:h-130 md:h-150"
                  title="Resume Preview"
                >
                  This browser does not support PDFs. Please download the PDF to
                  view it: <a href={preview} download="resume.pdf">Download PDF</a>
                </iframe>
              )}

              {!file ? (
                <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-6 w-6 text-white/70"
                      aria-hidden="true"
                    >
                      <path
                        d="M8 7h8M8 11h8M8 15h5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M7 3h7l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <p className="mt-4 text-sm font-medium text-white">
                    No file selected
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    Choose a resume to see its name, size, and a sample “parsed
                    result” layout.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  {/* File summary */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-white/60">Selected file</p>
                        <p className="mt-1 truncate text-sm font-medium text-white">
                          {file.name}
                        </p>
                        <p className="mt-1 text-xs text-white/70">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>

                      <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-200 border border-emerald-500/30">
                        Ready
                      </span>
                    </div>
                  </div>
                  {!preview && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
                      Preview is available for PDF files only. DOC/DOCX uploads will still parse correctly.
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
