import { useState } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import './index.css';

function App() {
  const [jdText, setJdText] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setResumeFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  const handleProcess = async () => {
    if (!jdText || !resumeFile) {
      setError("Please provide both a Job Description and a Resume PDF.");
      return;
    }
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append("jdText", jdText);
    formData.append("resume", resumeFile);

    try {
      const response = await axios.post("http://localhost:5000/api/parse-and-match", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError("An error occurred during processing. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <nav className="navbar glass-panel">
        <div className="nav-brand">CodeEra Product</div>
        <div className="nav-title">Intelligent ATS Extractor Engine</div>
      </nav>

      <div className="app-container">
        <header className="hero">
          <h1 className="gradient-text">Resume NLP Matcher</h1>
          <p>Rule-based Parsing completely independent of Generalized AI models.</p>
        </header>

        <main className="content">
          <div className="input-section">
            <div className="card glass-panel">
              <h2>1. Target Job Description</h2>
              <textarea
                className="jd-textarea"
                placeholder="Paste the target job description here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
              />
            </div>

            <div className="card glass-panel">
              <h2>2. Candidate Resume Profile</h2>
              <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                {resumeFile ? (
                  <p className="file-selected">📄 {resumeFile.name}</p>
                ) : (
                  <div className="dropzone-placeholder">
                    <div className="upload-icon">⬆️</div>
                    <p>Drag & drop a PDF resume here, or click to browse</p>
                  </div>
                )}
              </div>
            </div>

            <button className="process-btn" onClick={handleProcess} disabled={loading}>
              {loading ? <span className="spinner">Analysing...</span> : "Run Dual Extraction Engine"}
            </button>
            {error && <p className="error-text">⚠️ {error}</p>}
          </div>

          {result && result.matchingJobs && result.matchingJobs.length > 0 && (
            <div className="results-wrapper slide-up">

              {/* TWO PANEL COMPARATIVE UI (RAW EXTRACTIONS ONLY) */}
              <div className="comparative-grid" style={{ marginBottom: '2rem' }}>

                {/* PANEL A: JD EXTRACTION */}
                <div className="data-card panel-jd">
                  <h3>Extracted from Job Description</h3>
                  <div className="kpi-box">
                    <p><strong>Required Experience:</strong> {result.yearOfExperience !== null ? `${result.yearOfExperience} Years` : 'Not Specified'}</p>
                    <p><strong>Target Salary:</strong> {result.salary}</p>
                  </div>

                  <h4>Mathematically Extracted JD Skills</h4>
                  <div className="skills-container">
                    {result.matchingJobs[0].skillsAnalysis.map((s, idx) => (
                      <span key={`jd-${idx}`} className="skill-tag raw-jd">
                        {s.skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* PANEL B: RESUME EXTRACTION */}
                <div className="data-card panel-resume">
                  <h3>Extracted from Candidate Resume</h3>
                  <div className="kpi-box">
                    <p><strong>Candidate Name:</strong> {result.name}</p>
                    <p><strong>Current/Mentioned Experience:</strong> {result.candidateExperience !== null ? `${result.candidateExperience} Years` : 'Not Specified'}</p>
                    <p><strong>Current/Mentioned Salary:</strong> {result.candidateSalary}</p>
                  </div>

                  <h4>Discovered Candidate Skills</h4>
                  <div className="skills-container">
                    {result.resumeSkills && result.resumeSkills.length > 0 ? (
                      result.resumeSkills.map((s, idx) => (
                        <span key={`res-${idx}`} className="skill-tag raw-resume">{s}</span>
                      ))
                    ) : (
                      <p className="subtext">No relevant skills detected in PDF.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 3RD SECTION: MATCH ANALYSIS & VERDICT */}
              <div className="results-panel glass-panel">
                <div className="result-header">
                  <div>
                    <h2 className="gradient-text">Match Analysis & Verdict</h2>
                    <h3 className="candidate-name" style={{ lineHeight: '1.6', marginTop: '0.5rem', maxWidth: '600px' }}>
                      The system systematically cross-referenced the Candidate's discovered portfolio against the Job Description requirements. Below is the overlapping verdict algorithm analysis.
                    </h3>
                  </div>
                  
                  {/* SCORE & BADGE CONTAINER */}
                  <div className="score-container" style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                    {result.isEligible ? (
                        <span className="eligibility-badge eligible">Eligible Match</span>
                    ) : (
                        <span className="eligibility-badge not-eligible">Not Eligible</span>
                    )}
                    
                    <div className="score-ring">
                      <CircularProgressbar
                        value={result.matchingJobs[0].matchingScore}
                        text={`${result.matchingJobs[0].matchingScore}%`}
                        styles={buildStyles({
                          pathColor: result.isEligible ? '#10b981' : '#ef4444',
                          textColor: result.isEligible ? '#10b981' : '#ef4444',
                          trailColor: 'rgba(0,0,0,0.05)'
                        })}
                      />
                    </div>
                  </div>

                </div>

                <div className="data-card analysis-card">
                  <h3>Requirements Fulfillment Check</h3>
                  <div className="skills-container">
                    {result.matchingJobs[0].skillsAnalysis.map((s, idx) => (
                      <span key={`ana-${idx}`} className={`skill-tag ${s.presentInResume ? 'matched' : 'missing'}`}>
                        {s.skill} {s.presentInResume ? '✓' : '✕'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>

      <footer className="footer glass-panel">
        <p>Copyright © 2026 | made by <span className="love-text">LOVE</span>| shubham yadav : CodeEra Product</p>
      </footer>
    </>
  );
}

export default App;
