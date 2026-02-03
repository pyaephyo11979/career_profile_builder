import React from 'react'
import useFetch from '../hooks/useFetch';
import { useParams } from 'react-router-dom';

export default function ResultPage() {
  let params = useParams();
  let url = "http://localhost:3001/resumes/" + params.id;
  let { data: resumes, loading, error } = useFetch(url);

  // Helper for score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500'; // Green
    if (score >= 60) return 'bg-amber-500'; // Orange
    return 'bg-red-500'; // Red
  };

  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (loading) return <div className="p-8 text-gray-500">Loading analysis...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
      
      {resumes && resumes.parsed_data && (
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          
          {/* Top Header */}
          <div className="p-8 border-b border-gray-200 flex justify-between items-start bg-white">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 m-0">{resumes.parsed_data.contact.name || resumes.file_name}</h2>
              <div className="mt-2 text-sm text-gray-500">
                ID: #{resumes.id} • Uploaded: {new Date(resumes.created_at).toLocaleDateString()}
              </div>
            </div>
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${resumes.is_confirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                {resumes.is_confirmed ? 'Confirmed Quote' : 'Analysis Pending'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_340px]">
            
            {/* LEFT COLUMN: MAIN CONTENT */}
            <div className="p-8">
              
              {/* Experience */}
              {resumes.parsed_data.experience && resumes.parsed_data.experience.length > 0 && (
                <div className="mb-10">
                  <div className="text-lg font-bold text-gray-700 mb-4 pb-2 border-b-2 border-gray-200 uppercase tracking-wide">Professional Experience</div>
                  {resumes.parsed_data.experience.map((exp: any, index: number) => (
                    <div key={index} className="mb-6 relative pl-4 border-l-4 border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">{exp.title}</h4>
                      <div className="text-sm text-gray-500 mb-2">
                        {exp.company} • {exp.start_date || 'N/A'} - {exp.end_date || 'Present'} • {exp.location || 'Remote'}
                      </div>
                      {exp.highlights && (
                        <ul className="text-gray-600 text-sm leading-relaxed mt-2 pl-2">
                          {exp.highlights.map((h: string, i: number) => <li key={i} className="mb-1">• {h}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Projects */}
              {resumes.parsed_data.projects && resumes.parsed_data.projects.length > 0 && (
                <div className="mb-10">
                  <div className="text-lg font-bold text-gray-700 mb-4 pb-2 border-b-2 border-gray-200 uppercase tracking-wide">Projects</div>
                  {resumes.parsed_data.projects.map((proj: any, index: number) => (
                    <div key={index} className="mb-6 relative pl-4 border-l-4 border-indigo-100">
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">{proj.name}</h4>
                      <div className="text-sm text-gray-500 mb-2">{proj.summary}</div>
                      {proj.tech_stack && (
                         <div className="text-xs text-gray-500 mb-2 font-medium">
                           <span className="font-bold text-gray-700">Stack:</span> {proj.tech_stack.join(", ")}
                         </div>
                      )}
                      {proj.highlights && (
                        <ul className="text-gray-600 text-sm leading-relaxed mt-2 pl-2">
                          {proj.highlights.map((h: string, i: number) => <li key={i} className="mb-1">• {h}</li>)}
                        </ul>
                      )}
                      {proj.links && proj.links.map((l: string, i: number) => (
                        <div key={i}><a href={l} className="text-xs text-blue-600 hover:underline block mt-1" target="_blank" rel="noreferrer">{l}</a></div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Education */}
              {resumes.parsed_data.education && resumes.parsed_data.education.length > 0 && (
                <div className="mb-10">
                  <div className="text-lg font-bold text-gray-700 mb-4 pb-2 border-b-2 border-gray-200 uppercase tracking-wide">Education</div>
                  {resumes.parsed_data.education.map((edu: any, index: number) => (
                    <div key={index} className="mb-6 relative pl-4 border-l-4 border-blue-300">
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">{edu.school}</h4>
                      <div className="text-sm text-gray-500">
                        {edu.degree} {edu.field && `in ${edu.field}`} • {edu.start_year} - {edu.end_year}
                      </div>
                    </div>
                  ))}
                </div>
              )}

               {/* Raw Text Toggle */}
              <div className="mb-10">
                <details className="border border-gray-200 rounded-md overflow-hidden">
                  <summary className="p-4 cursor-pointer bg-gray-50 font-semibold text-gray-700 hover:bg-gray-100 transition-colors">View Raw Extracted Text</summary>
                  <pre className="p-4 bg-white text-xs text-gray-500 overflow-x-auto whitespace-pre-wrap">{resumes.raw_text}</pre>
                </details>
              </div>
            </div>

            {/* RIGHT COLUMN: SIDEBAR */}
            <div className="bg-gray-50 border-l border-gray-200 p-8">
              
              {/* Resume Health */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8 text-center shadow-sm">
                 <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-extrabold text-white mx-auto mb-4 ${getScoreColor(resumes.resume_health.score)}`}>
                    {resumes.resume_health.score}
                 </div>
                 <h4 className="m-0 mb-3 font-bold text-gray-800">Resume Health</h4>
                 
                 <div className="text-left text-sm">
                    {resumes.resume_health.strengths?.length > 0 && (
                        <div className="mb-4">
                            <strong className="text-emerald-600 block mb-1">Strengths</strong>
                            <ul className="list-disc pl-4 text-gray-600 space-y-1">
                                {resumes.resume_health.strengths.slice(0, 3).map((s: string, i: number) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    )}
                     {resumes.resume_health.suggestions?.length > 0 && (
                        <div>
                            <strong className="text-amber-600 block mb-1">Improvements</strong>
                            <ul className="list-disc pl-4 text-gray-600 space-y-1">
                                {resumes.resume_health.suggestions.slice(0, 3).map((s: string, i: number) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    )}
                 </div>
              </div>

               {/* Contact Info */}
              <div className="mb-10">
                <div className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide border-b border-gray-200 pb-2">Contact Details</div>
                <div className="space-y-3">
                    <p className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-semibold text-gray-800 min-w-[60px]">Email:</span> 
                        <span className="truncate">{resumes.parsed_data.contact.email}</span>
                    </p>
                    <p className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-semibold text-gray-800 min-w-[60px]">Phone:</span> 
                        <span>{resumes.parsed_data.contact.phone || 'N/A'}</span>
                    </p>
                    
                    {resumes.parsed_data.contact.links && Object.entries(resumes.parsed_data.contact.links).map(([key, value]) => {
                         if (!value || (Array.isArray(value) && value.length === 0)) return null;
                         const linkUrl = Array.isArray(value) ? value[0] : value as string;
                         return (
                            <p key={key} className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="font-semibold text-gray-800 min-w-[60px] capitalize">{key}:</span> 
                                <a href={linkUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate max-w-[150px]">Link</a>
                            </p>
                         );
                    })}
                </div>
              </div>

              {/* Skills */}
              <div className="mb-10">
                <div className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide border-b border-gray-200 pb-2">Skills Detected</div>
                {resumes.parsed_data.skills?.categories && Object.entries(resumes.parsed_data.skills.categories).map(([category, skills]: [string, any]) => (
                    skills && skills.length > 0 && (
                        <div key={category} className="mb-4">
                            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">{category.replace('_', ' ')}</div>
                            <div className="flex flex-wrap gap-2">
                                {skills.map((skill: string, idx: number) => (
                                    <span key={idx} className="inline-block bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md text-xs font-medium border border-indigo-100">{skill}</span>
                                ))}
                            </div>
                        </div>
                    )
                ))}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}