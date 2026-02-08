import React, { useEffect, useMemo, useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const fileHint = useMemo(() => {
    if (!file) return "PDF or DOCX only. Max 5MB.";
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return `${file.name} • ${sizeMb} MB`;
  }, [file]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  useEffect(() => {
    if (file) {
      handlePreviewFile(file);
    }else{
      setPreview("");
    }
  }, [file]);

  let handlePreviewFile = (file) => {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setPreview(reader.result);
    };
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Upload your resume
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Choose a file to upload. We’ll parse it and show structured results.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left: Upload Card */}
          <section className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-medium text-slate-900">
                    Resume file
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">{fileHint}</p>
                </div>

                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                  ≤ 5MB
                </span>
              </div>

              {/* Dropzone-like input */}
              <label className="mt-5 block">
                <span className="sr-only">Choose resume file</span>

                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 transition hover:border-slate-300">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-6 w-6 text-slate-700"
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
                      <p className="text-sm font-medium text-slate-900">
                        Drag & drop your resume here
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Or click to browse your files
                      </p>
                    </div>
                  </div>

                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="mt-4 block w-full cursor-pointer rounded-xl border border-slate-200 bg-white text-sm text-slate-700
                               file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white
                               hover:file:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </label>

              {/* Primary actions (UI only) */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Upload & Parse
                </button>

                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
                  onClick={() => setFile(null)}
                >
                  Clear
                </button>
              </div>

              {/* Helper panel */}
              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
                <p className="font-medium text-slate-800">Supported formats</p>
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
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-medium text-slate-900">
                    Preview
                  </h2>
                </div>

                <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                  Demo
                </span>
              </div>

              {preview && (
                <iframe
                  src={preview}
                  className="mt-6 h-[600px] w-full rounded-xl border border-slate-200 bg-slate-50"
                  title="Resume Preview"
                >
                  This browser does not support PDFs. Please download the PDF to
                  view it: <a href={preview} download="resume.pdf">Download PDF</a>
                </iframe>
              )}

              {!file ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-6 w-6 text-slate-600"
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

                  <p className="mt-4 text-sm font-medium text-slate-900">
                    No file selected
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Choose a resume to see its name, size, and a sample “parsed
                    result” layout.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  {/* File summary */}
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500">Selected file</p>
                        <p className="mt-1 truncate text-sm font-medium text-slate-900">
                          {file.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>

                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                        Ready
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
