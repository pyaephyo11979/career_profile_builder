import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getAccessTokenUsername, getResumes, type ResumeRecord } from "../lib/api";

export default function ProfilePage() {
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const navigate = useNavigate();

  const username = useMemo(() => getAccessTokenUsername(), [auth.accessToken]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const data = await getResumes();
        if (!cancelled) setResumes(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load profile.";
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
  }, [auth, navigate]);

  return (
    <div className="min-h-[calc(100vh-96px)] bg-slate-50 px-4 py-6 sm:px-6 md:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Profile</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                {username ? `Welcome, ${username}` : "Welcome"}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Manage your resumes and continue your parsing workflow.
              </p>
            </div>
            <Link
              to="/upload"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#032b2b] px-5 text-sm font-semibold text-white hover:bg-[#043d3d]"
            >
              Upload New Resume
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Resumes</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {resumes.length} total
            </span>
          </div>

          {loading && <p className="text-sm text-slate-500">Loading your resumes...</p>}
          {error && <p className="text-sm text-red-600">Error: {error}</p>}

          {!loading && !error && resumes.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-700">No resumes yet.</p>
              <Link to="/upload" className="mt-3 inline-block text-sm font-semibold text-[#032b2b] hover:underline">
                Upload your first resume
              </Link>
            </div>
          )}

          {!loading && !error && resumes.length > 0 && (
            <div className="space-y-3">
              {resumes.map((resume) => (
                <Link
                  key={resume.id}
                  to={`/resumes/${resume.id}`}
                  className="block rounded-xl border border-slate-200 p-4 transition-colors hover:border-slate-300 hover:bg-slate-200"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="truncate text-sm font-semibold text-slate-900">{resume.file_name}</p>
                      <p className="text-xs text-slate-500">
                        Uploaded {new Date(resume.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-slate-600">
                      Score: {resume.resume_health?.score ?? 0}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
