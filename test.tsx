'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from "react-markdown";


interface ScoreItem {
  Score?: number | null;
  score?: number | null;
  Color?: string;
  color?: string;
  Justification?: string;
  justification?: string;
}

interface ScoreObj {
  [key: string]: {
    Score?: number | null;
    Color?: string;
    Justification?: string;
    [key: string]: any; 
  }
}



function getAvgScoresPerRun(historyArr: ScoreObj[]): number[] {
  return historyArr.map((scoresObj) => {
    const values = Object.values(scoresObj)
      .map((v) => typeof v.Score === 'number' ? v.Score : 0);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  });
}


function countLowDomains(scoresObj: ScoreObj, threshold = 5): number {
  return Object.values(scoresObj)
    .filter((v) => typeof v.Score === 'number' && v.Score < threshold)
    .length;
}


function std(arr: number[]): number {
  if (!arr.length) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const sqDiff = arr.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(sqDiff.reduce((a, b) => a + b, 0) / arr.length);
}





export default function Home() {
  const [scoreRuns, setScoreRuns] = useState<number[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const [mode, setMode] = useState<'upload' | 'questions'>('upload');
      const questionPrompts = [
    "Are there unresolved concerns about exit terms, founder incentives, or buyer misfits needing monitoring?"
  ];

  const [selectedDomain, setSelectedDomain] = useState<string>(Object.keys(categorizedPrompts)[0]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const [aiReport, setAiReport] = useState<string>('');
  const [macroRiskAnalysis, setMacroRiskAnalysis] = useState('');
  const [macroRiskLoading, setMacroRiskLoading] = useState(false);

  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const [scoreHistory, setScoreHistory] = useState<ScoreObj[]>([]);


const renderConsistencyCard = () => (
  <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
    <h2 className="text-lg font-bold mb-2">📊 General Consistency</h2>
    <div className="mb-1 text-xl font-semibold">{consistencyFlag.flag}</div>
    <div className="text-gray-700">{consistencyFlag.reason}</div>
    {scoreHistory.length > 0 && (
      <div className="mt-2 text-sm text-gray-600">
        <div>Number of scoring runs: {scoreHistory.length}</div>
        <div>
          Latest scores: {getAvgScoresPerRun(scoreHistory).map(s => s.toFixed(1)).join(', ')}
        </div>
        <div>Std. Deviation: {std(getAvgScoresPerRun(scoreHistory)).toFixed(2)}</div>
      </div>
    )}
  </div>
);


  const handleAnswerChange = (category: string, value: string) => {
  setAnswers(prev => ({ ...prev, [category]: value }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    console.log('Submitted answers:', answers);
  };

  type CategoryReport = {
  category: string;
  score?: number | null;
  concerns?: string;
  strengths?: string;
  description?: string;
  [key: string]: any;
};

type FlagResult = {
  flag: string;
  reason: string;
};


      const combineQuestionsAndAnswersToText = (
        domain: string,
        prompts: { category: string; prompt: string }[],
        answers: Record<string, string>
      ): string => {
        return prompts
          .filter(({ category }) => answers[category]?.trim()) 
          .map(({ category, prompt }) => {
            const answer = answers[category].trim();
            return `${category}:\n${prompt}\nAnswer:\n${answer}`;
          })
          .join('\n\n');
      };



    const handleSubmitAnswersForScoring = async () => {
       const combinedText = combineQuestionsAndAnswersToText(selectedDomain, categorizedPrompts[selectedDomain], answers);

      if (!combinedText.trim()) {
        alert("Please fill some answers before submitting.");
        return;
      }

      setLoading(true);
      setResult(null);

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: combinedText }),
        });
        const data = await res.json();
        console.log("API response data:", data);
        if (data.scores) setScoreHistory(prev => [...prev, data.scores]);

        if (data.error) {
          alert(`Error: ${data.error}`);
        } else {
          setResult(data);
        }
      } catch (error) {
        alert("Failed to submit answers for scoring.");
      } finally {
        setLoading(false);
      }
    };



  const [files, setFiles] = useState<File[]>([]);

  const renderScoreHistory = () => (
  <div className="w-full max-w-3xl mt-10">
    <h2 className="text-lg font-bold mb-3 text-gray-700">📖 Score History</h2>
    {scoreHistory.length === 0 ? (
      <div className="text-gray-500">No historical scores yet.</div>
    ) : (
      scoreHistory.map((scoreObj, idx) => (
        <div key={idx} className="mb-6 border rounded-xl shadow bg-white p-4">
          <div className="font-semibold text-indigo-600 mb-1">
            Attempt #{idx + 1}
            <span className="text-gray-500 text-xs ml-2">Avg: {getAvgScoresPerRun([scoreObj])[0].toFixed(1)}</span>
          </div>
          <table className="w-full border rounded bg-gray-50">
            <thead>
              <tr>
                <th className="py-1 px-2">Factor</th>
                <th className="py-1 px-2">Score</th>
                <th className="py-1 px-2">Justification</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(scoreObj).map(([factor, value]: any) =>
                value && typeof value === 'object' ? (
                  <tr key={factor}>
                    <td className="py-1 px-2">{factor}</td>
                    <td className="py-1 px-2 font-bold">{typeof value.Score === 'number' ? value.Score : 'N/A'}</td>
                    <td className="py-1 px-2">{value.Justification || 'No justification'}</td>
                  </tr>
                ) : null
              )}
            </tbody>
          </table>
        </div>
      ))
    )}
  </div>
);


  const handleUpload = async () => {
    if (!files.length) return alert('Please select PDF files');
    setLoading(true);
    setResult(null);
    setShowFullText(false);

    const formData = new FormData();
    files.forEach(file => formData.append('files', file)); 

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/score`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert('Failed to upload files');
    } finally {
      setLoading(false);
    }
  };


 const calculateTotalScore = () => {
  if (!result?.scores) return null;
  const scores = Object.values(result.scores)
    .map((v) => {
      const val = v as { Score?: number };
      return typeof val.Score === 'number' ? val.Score : 0;
    });
  if (scores.length === 0) return null;
  const total = scores.reduce((a, b) => a + b, 0) ;
  const avg = total / scores.length;
  return avg.toFixed(1);
};

const getFinalWeightedScore = () => {
  if (!reportData || !reportData.categories) return null;
  const total = (reportData.categories as CategoryReport[])
    .map(cat => typeof cat.weightedScore === "number" ? cat.weightedScore : 0)
    .reduce((a, b) => a + b, 0);
  const finalScore = total / 10;
  return finalScore.toFixed(2); 
};

  const renderScoreRow = (factor: string, value: any) => {
    if (!value || typeof value !== 'object') return null; 
    return (
      <tr key={factor} className="hover:bg-indigo-50 transition">
        <td className="py-2 px-3 font-medium">{factor}</td>
        <td
          className={`py-2 px-3 font-bold ${
            value.Color === 'Green'
              ? 'text-green-600'
              : value.Color === 'Yellow'
              ? 'text-yellow-600'
              : value.Color === 'Red'
              ? 'text-red-600'
              : 'text-gray-600'
          }`}
        >
          {typeof value.Score === 'number' ? value.Score : 'N/A'}
        </td>
        <td className="py-2 px-3">{value.Justification || 'No justification provided'}</td>
      </tr>
    );
  };

  const renderScoreTable = () => (
    <div className="w-full max-w-3xl mt-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-700">TCA Factor Scoring</h2>
        <div className="text-indigo-700 font-bold text-xl">Total Score: {calculateTotalScore() ?? '--'}</div>
      </div>
      <table className="w-full border rounded-lg bg-white shadow">
        <thead>
          <tr className="bg-indigo-100">
            <th className="py-2 px-3 border-b text-left">Factor</th>
            <th className="py-2 px-3 border-b text-left">Score</th>
            <th className="py-2 px-3 border-b text-left">Justification</th>
          </tr>
        </thead>
        <tbody>
          {result && result.scores && typeof result.scores === 'object' ? (
            Object.entries(result.scores).map(([factor, value]: any) => {
              if (!value || typeof value !== 'object') return null;
              return (
                <tr key={factor} className="hover:bg-indigo-50 transition">
                  <td className="py-2 px-3 font-medium">{factor}</td>
                  <td
                    className={`py-2 px-3 font-bold ${
                      value.Color === 'Green'
                        ? 'text-green-600'
                        : value.Color === 'Yellow'
                        ? 'text-yellow-600'
                        : value.Color === 'Red'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {typeof value.Score === 'number' ? value.Score : 'N/A'}
                  </td>
                  <td className="py-2 px-3">{value.Justification || 'No justification provided'}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={3} className="text-center py-4 text-gray-500">
                No scores available yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {(() => {
        const total = Number(calculateTotalScore());
        let risk = '';
        if (total >= 80) risk = 'Low';
        else if (total >= 60) risk = 'Medium';
        else risk = 'High';
        return (
          <p className="mt-4 text-center font-semibold text-red-700">
            Overall Risk Level: <span className="uppercase">{risk}</span>
          </p>
        );
      })()}
    </div>
  );


  const handleGenerateReport = async () => {
  if (!result?.scores) {
    alert("Please submit scoring results first.");
    return;
  }

  setReportLoading(true);
  try {
    const projectText = "project description";
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/generate_analysis_report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scores: result.scores,
        project_text: projectText,
      }),
    });

    const data = await res.json();
    if (data.error) {
      alert(`Error: ${data.error}`);
    } else {
      setReportData(data);  
      setShowReport(true);
    }
  } catch (error) {
    alert("Failed to generate AI analysis report.");
  } finally {
    setReportLoading(false);
  }
};


const renderFlagSummary = () => {
  if (!reportData || !reportData.categories) return null;
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
      <h2 className="text-xl font-bold mb-2">🟩 Flag Summary by Category</h2>
      <div className="space-y-5">
        {(reportData.categories as CategoryReport[]).map((cat, idx) => {
          const { flag, reason } = getFlagAndReason(cat.category, cat.score, cat);
          let details = cat.concerns || cat.strengths || cat.description || "";
          return (
            <div key={idx} className="border-l-4 pl-4 py-2" style={{
              borderColor: flag.includes('Red') ? "#dc2626" : flag.includes('Yellow') ? "#eab308" : "#16a34a"
            }}>
              <div className="font-bold mb-1">
                {cat.category} — <span>{flag}</span>
              </div>
              <div className="text-gray-700">
                <span className="font-semibold">{flag}：</span>
                {reason}（scores: <strong>{cat.score ?? "--"}</strong>）
                <br />
                <span>{details}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


useEffect(() => {
  console.log('Current scoreHistory:', scoreHistory);
}, [scoreHistory]);


  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 gap-4 font-sans bg-gradient-to-br from-gray-50 to-indigo-100">
      <h1 className="text-2xl font-bold mb-4">AI Pitch Deck Reader</h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => {
            setMode('upload');
            setAiReport('');
            setResult(null);
          }}
          className={`px-4 py-2 rounded ${mode === 'upload' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
        >
          Upload PDF
        </button>
        <button
          onClick={() => {
            setMode('questions');
            setResult(null);
            setFile(null);
            setAiReport('');
          }}
          className={`px-4 py-2 rounded ${mode === 'questions' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
        >
          Answer Questions
        </button>
      </div>

      {mode === 'upload' && (
        <>
          <label className="cursor-pointer bg-white border border-gray-300 rounded-lg px-6 py-3 shadow-md hover:bg-gray-100 transition">
            <span className="text-gray-800 font-medium">{file ? `📄 ${file.name}` : '📄 Choose PDF File'}</span>
            <input
      type="file"
      accept=".pdf"
      multiple
      onChange={e => setFiles(Array.from(e.target.files || []))}
    />
          </label>
          <button
            onClick={handleUpload}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-semibold px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform duration-200"
            disabled={loading}
          >
            {loading ? 'Uploading & Scoring...' : 'Extract & Score'}
          </button>

          {result?.preview_text && (
            <div className="max-w-2xl bg-white p-4 rounded shadow mt-6">
              <h2 className="font-semibold mb-2 text-gray-700">Extracted Text Preview</h2>
              <p className="whitespace-pre-wrap text-gray-800">
                {showFullText ? result.preview_text_full || result.preview_text : result.preview_text}
              </p>
              {result.preview_text_full && result.preview_text_full.length > result.preview_text.length && (
                <button onClick={() => setShowFullText(!showFullText)} className="mt-2 text-indigo-600 underline">
                  {showFullText ? 'Hide Text' : 'Show More'}
                </button>
              )}
            </div>
          )}

         {result && !result.error && renderScoreTable()}

          {result && result.error && <div className="mt-6 text-red-600 font-semibold">Error: {result.error}</div>} 

          {result && 
          (
            <div className="mt-8">
                <button
                  className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600"
                  onClick={async () => {
                    setMacroRiskLoading(true);
                    setMacroRiskAnalysis('');
                    try {
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/macro_risk_analysis`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          startup_text: result.preview_text_full,
                        }),
                      });
                      const data = await res.json();
                      setMacroRiskAnalysis(data.analysis || data.error || 'No analysis returned.');
                    } catch (err) {
                      setMacroRiskAnalysis('Failed to fetch macro-level risk analysis.');
                    } finally {
                      setMacroRiskLoading(false);
                    }
                  }}
                  disabled={macroRiskLoading}
                >
                  {macroRiskLoading ? 'Analyzing...' : 'Macro-Level Risk AI Analysis'}
                </button>
                {macroRiskAnalysis && (
                  <div className="bg-white p-4 mt-4 rounded shadow">
                    <h3 className="font-semibold mb-2">Macro-Level Risk Analysis</h3>
                    <ReactMarkdown>{macroRiskAnalysis}</ReactMarkdown>
                  </div>
                )}
              </div>
          )
          
          }
        </>
      )}

      {mode === 'questions' && !result && (
  <div className="min-h-screen flex flex-row bg-gray-50 p-6">
    <aside className="w-1/4 pr-4 border-r border-gray-300">
      <h2 className="text-lg font-bold mb-4">Prompt Domains</h2>
      <ul className="space-y-2">
        {Object.keys(categorizedPrompts).map(domain => (
          <li key={domain}>
            <button
              className={`text-left w-full px-3 py-2 rounded ${
                domain === selectedDomain ? 'bg-indigo-600 text-white' : 'hover:bg-gray-200'
              }`}
              onClick={() => setSelectedDomain(domain)}
            >
              {domain}
            </button>
          </li>
        ))}
      </ul>
    </aside>

    <main className="flex-1 pl-6">
            <h2 className="text-xl font-bold mb-6 text-indigo-700">{selectedDomain}</h2>
            <form
            onSubmit={e => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-6"
          >
            {categorizedPrompts[selectedDomain].map(({ category, prompt }) => (
              <div key={category}>
                <label className="block font-semibold mb-1">{category}</label>
                <p className="text-sm text-gray-700 mb-2">{prompt}</p>
                <textarea
                  className="w-full border p-2 rounded resize-none focus:outline-indigo-500"
                  rows={3}
                  value={answers[category] || ''}
                  onChange={e => handleAnswerChange(category, e.target.value)}
                />
              </div>
            ))}

            {/* ✅ Submit button placed OUTSIDE the map loop */}
            <button
              type="button"
              onClick={handleSubmitAnswersForScoring}
              className="bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700"
            >
              Submit All Answers
            </button>

            <button
              onClick={() => {
                setAnswers({});
                setResult(null);
              }}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
            >
              Clear Answers
            </button>

          </form>

          

          </main>
        </div>
      )}


     {mode === 'questions' && result && (
        <div>
          <p>Questions mode content here...</p>
          {result && !result.error && renderScoreTable()}
        </div>
      )}


      <div className="flex gap-4 mt-4">
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          // onClick={() => { /* exportCsv handler */ }}
        >
          Export Scores CSV
        </button>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          // onClick={exportPdf}
        >
          Export Report PDF
        </button>
      </div>

      <div className="p-6 bg-gray-50 min-h-screen flex flex-col items-center">
        <button
          onClick={handleGenerateReport}
          className="bg-orange-600 text-white px-6 py-3 rounded-lg text-lg mb-8 shadow hover:bg-orange-700"
          disabled={reportLoading}
        >
          {reportLoading ? "Generating Report..." : "Generate AI Analysis Report"}
        </button>

         {renderConsistencyCard()}

         {renderScoreHistory()}

        {showReport && reportData && (
          <div className="w-full max-w-4xl space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">🔍 Quick Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-semibold">Company Name:</span> {reportData?.summary?.companyName}</div>
                <div><span className="font-semibold">Website:</span> {reportData?.summary?.website}</div>
                <div><span className="font-semibold">CEO:</span> {reportData.summary?.ceo}</div>
                <div><span className="font-semibold">Founded:</span> {reportData.summary.founded}</div>
                <div><span className="font-semibold">Business Model:</span> {reportData.summary?.businessModel}</div>
                <div><span className="font-semibold">Deal Structure:</span> {reportData.summary?.dealStructure}</div>
                <div><span className="font-semibold">Ask / Valuation:</span> {reportData.summary?.askValuation}</div>
                <div><span className="font-semibold">Revenue Streams:</span> {reportData.summary?.revenueStreams}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">📊 Category Evaluation Table (with Weighting)</h2>
              <div className="overflow-x-auto">
                <table className="w-full border rounded-xl">
                  <thead className="bg-indigo-100">
                    <tr>
                      <th className="p-2">Category</th>
                      <th className="p-2">Description</th>
                      <th className="p-2">Strengths</th>
                      <th className="p-2">Concerns</th>
                      <th className="p-2">Score</th>
                      <th className="p-2">Weight</th>
                      <th className="p-2">Weighted Score</th>
                      <th className="p-2">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.categories.map((cat, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50">
                        <td className="p-2">{cat.category}</td>
                        <td className="p-2">{cat.description}</td>
                        <td className="p-2">{cat.strengths}</td>
                        <td className="p-2">{cat.concerns}</td>
                        <td className="p-2">{cat.score}</td>
                        <td className="p-2">{cat.weight}</td>
                        <td className="p-2">{cat.weightedScore}</td>
                        <td className="p-2">
                          {cat.score < 4 ? '🔴 High ' : cat.score < 6 ? '🟡 Medium ' : '🟢 Low'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="font-bold text-lg mt-4 text-right">
                🎯 Total Weighted Score: {getFinalWeightedScore()} / 10
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">🧠 Competitive Landscape & Substitutes</h2>
              <div className="overflow-x-auto">
                <table className="w-full border rounded-xl">
                  <thead className="bg-indigo-100">
                    <tr>
                      <th className="p-2">Competitor</th>
                      <th className="p-2">Description</th>
                      <th className="p-2">PRK’n Differentiator</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.competitiveLandscape.map((c, idx) => (
                      <tr key={idx}>
                        <td className="p-2">{c.competitor}</td>
                        <td className="p-2">{c.description}</td>
                        <td className="p-2">{c.differentiator}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-red-50 rounded-xl p-4 shadow">
              <span className="font-bold text-red-700">Risk:</span> {reportData.riskNote}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold mb-2">🛠 Recommendations to Improve Score</h2>
              <div className="space-y-4">
                {reportData?.recommendations?.map((group, idx) => (
                  <div key={idx}>
                    <div className="font-semibold text-indigo-700 mb-1">{group.title}</div>
                    <ul className="list-disc pl-6 space-y-1">
                      {group.items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold mb-2">❓ Key Questions for the CEO</h2>
              <div className="space-y-2">
                {Object.entries(reportData?.keyQuestions).map(([section, qs]) => (
                  <div key={section}>
                    <span className="font-semibold capitalize">{section.replace(/([A-Z])/g, " $1")}: </span>
                    <ul className="list-disc pl-6">
                      {(qs as string[]).map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold mb-2">📘 Conclusion</h2>
              <div className="mb-2">{reportData?.conclusion}</div>
              <div className="font-bold text-indigo-700">{reportData?.recommendation}</div>
            </div>

            {renderFlagSummary()} 
           

            
          </div>
        )}
      </div>
    </div>
  );
}
