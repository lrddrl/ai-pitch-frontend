'use client';

import { useState } from 'react';
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const [mode, setMode] = useState<'upload' | 'questions'>('upload');
  const questionPrompts = [
    "Provide a detailed review of the risks and impact of the business including political, technical, regulatory, legal, economic and social risks.",
    "Provide a summary of other startups in the same space and analyze how this valuation compares with other similarly situated companies.",
    "What questions should we ask the CEO and their team to avoid blind spots?",
    "How can the company improve its score?",
    "What factors should be accounted for to ensure the company’s success? What factors, if ignored, would be problematic and cause the plan to not come true?",
    "In general, how big a risk is this company from an angel investment perspective?",
    "Provide a detailed review of the people on the operational team and the advisory board.",
    "How many exits did the CEO have?",
    "Has the team worked together in the past?",
    "Who is on the Board of Directors?",
    "Are they missing any executive position that would be helpful in their success?",
    "What is the overall analysis of the team?",
    "What key hires do they need?",
    "For medical companies: comment on the KOLs and other evidence that they have the right people involved.",
    "What is your assessment of the ability of the leadership team executing the business plan?",
    "Are there any other caveats and concerns regarding leadership?",
  ];

  const [answers, setAnswers] = useState<string[]>(Array(questionPrompts.length).fill(''));
  const [aiReport, setAiReport] = useState<string>('');
  const [reportLoading, setReportLoading] = useState(false);
  const [macroRiskAnalysis, setMacroRiskAnalysis] = useState('');
  const [macroRiskLoading, setMacroRiskLoading] = useState(false);


  const reportData = {
    summary: {
      companyName: "PRK’n",
      website: "www.prk-n.com",
      ceo: "Blake Spencer",
      founded: "2024",
      businessModel: "P2P Parking Marketplace (25% platform fee)",
      dealStructure: "Not specified in deck",
      askValuation: "Not disclosed; implied via financials",
      revenueStreams: "Booking Fees (25% of transaction)"
    },
    categories: [
      {
        category: "Leadership",
        description: "Founder-led with technical + creative strategy team",
        strengths: "Boots-on-ground validation, iterative feedback, operational insight",
        concerns: "No disclosed track record of exits or relevant industry experience",
        score: 6,
        weight: "30%",
        weightedScore: 1.8,
      },
      {
        category: "Market Size & Fit",
        description: "Parking near events/beaches/ski/urban is a growing pain point",
        strengths: "Massive latent market; events-based use cases; local monetization",
        concerns: "Highly fragmented, regionalized adoption needed",
        score: 7,
        weight: "25%",
        weightedScore: 1.75,
      },
      {
        category: "Technology & IP",
        description: "Marketplace platform; no proprietary tech or patent mention",
        strengths: "Simple mobile-first product, real-time availability integration",
        concerns: "No IP, unclear if defensible against competitors",
        score: 4,
        weight: "10%",
        weightedScore: 0.4,
      },
    ],
    totalWeightedScore: 5.8,
    competitiveLandscape: [
      {
        competitor: "SpotHero",
        description: "Aggregates parking garages/lots across U.S.",
        differentiator: "PRK’n focuses on private homeowners near events"
      },
      {
        competitor: "ParkMobile",
        description: "City/metropolitan lot parking",
        differentiator: "PRK’n is peer-to-peer and event/venue specific"
      },
    ],
    riskNote: "No patent/IP or defensibility. Easy for competitors to replicate the business model.",
    recommendations: [
      {
        title: "Leadership Score (Currently 6/10)",
        items: [
          "Bring on a co-founder or exec with marketplace scaling or mobility background.",
          "Show investor that CEO can lead to scale (e.g., accelerators, board advisors)."
        ]
      },
      {
        title: "Technology/IP (Currently 4/10)",
        items: [
          "File provisional patent on unique routing, parking monetization algorithms.",
          "Build barriers via partnerships (exclusive rights with venues, schools, etc.)."
        ]
      },
      {
        title: "Competition/Moat (Currently 4/10)",
        items: [
          "Lock in exclusive supply with local governments or events.",
          "Focus on customer trust/community features to deter churn to larger platforms."
        ]
      },
      {
        title: "Traction",
        items: [
          "Show month-over-month growth, bookings per market, and LTV/CAC analysis.",
          "Highlight repeat usage behavior in beta tests."
        ]
      },
      {
        title: "Exit Strategy",
        items: [
          "Identify specific acquisition targets and articulate synergy (Airbnb, Waze, Live Nation)."
        ]
      }
    ],
    keyQuestions: {
      marketStrategy: [
        "How do you plan to grow supply and demand in new geographies simultaneously?",
        "What are your key acquisition channels, and how much does it cost to acquire a user?"
      ],
      defensibility: [
        "What are you doing to protect against replication from SpotHero, ParkMobile, etc.?",
        "Do you have any exclusivity agreements or patents filed?"
      ],
      financials: [
        "Can you provide a pro forma P&L and cash flow forecast for next 2 years?",
        "What’s the expected CAC vs. average transaction value and LTV?"
      ],
      productDevelopment: [
        "Is PRK’n building routing or AI capabilities that add stickiness?",
        "How will you handle liability issues if a user damages a homeowner’s property?"
      ],
      exitStrategy: [
        "Who do you see as the most likely acquirer, and when do you think the business will be attractive to them?"
      ]
    },
    conclusion: "PRK’n offers a unique niche focus in a fragmented and underutilized market segment: local private parking near events and destinations. The value proposition is real, and the team has demonstrated on-the-ground iteration and understanding of user pain. However, it faces high competitive and replicability risk, unclear defensibility, and unvalidated scale economics. A weighted score of 5.8/10 places it in the “watch and validate further” category.",
    recommendation: "Proceed to prescreen with conditions: Provide more data on user growth, unit economics, and scalability strategy. Explore pilot partnerships with events, schools, or towns to lock in first-mover position."
  };

  const getRiskIcon = (score: number) => {
    if(score < 4) return <>🚩 Red Flag</>;
    if(score < 6) return <>⚠️ Yellow Flag</>;
    return <>✅ Green Flag</>;
  };

  const handleUpload = async () => {
    if (!file) return alert('Please select a PDF file');
    setLoading(true);
    setResult(null);
    setShowFullText(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/score`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalScore = () => {
    if (!result?.scores) return null;
    const scores = Object.values(result.scores)
      .map((v: any) => (typeof v.Score === 'number' ? v.Score : 0));
    if (scores.length === 0) return null;
    const total = scores.reduce((a, b) => a + b, 0);
    return total.toFixed(1);
  };

  const renderScoreRow = (factor: string, value: any) => (
    <tr key={factor} className="hover:bg-indigo-50 transition">
      <td className="py-2 px-3 font-medium">{factor}</td>
      <td
        className={`py-2 px-3 font-bold ${
          value.Color === 'Green' ? 'text-green-600' : value.Color === 'Yellow' ? 'text-yellow-600' : 'text-red-600'
        }`}
      >
        {value.Score}
      </td>
      <td className="py-2 px-3">{value.Justification}</td>
    </tr>
  );

  const handleChangeAnswer = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmitAnswers = () => {
    setReportLoading(true);
    setAiReport('');
    setTimeout(() => {
      setAiReport(`
Here is the Comprehensive Investment Report for PRK’n...

🔍 **Quick Summary**

| Element          | Details                                       |
|------------------|-----------------------------------------------|
| Company Name     | PRK’n                                         |
| Website          | www.prk-n.com                                 |
| CEO              | Blake Spencer                                 |
| Founded          | 2024                                          |
| Business Model   | P2P Parking Marketplace (25% platform fee)    |
| Deal Structure   | Not specified in deck                         |
| Ask / Valuation  | Not disclosed; implied via financials         |
| Revenue Streams  | Booking Fees (25% of transaction)             |

📊 **Category Evaluation Table (with Weighting)**

| Category                  | Description                                  | Strengths                           | Concerns                               | Score | Weight | Weighted Score | Risk Level |
|---------------------------|----------------------------------------------|-------------------------------------|----------------------------------------|-------|--------|----------------|------------|
| Leadership                | Founder-led with technical + creative team   | Operational insight                 | No industry exits experience           | 6     | 30%    | 1.8            | 🟡 Medium  |
| Market Size & Fit         | Parking near events/beaches/ski/urban        | Massive latent market               | Regionalized adoption needed           | 7     | 25%    | 1.75           | 🟢 Low |
| Technology & IP           | Marketplace, no proprietary tech             | Simple mobile-first product         | No IP protection                       | 4     | 10%    | 0.4            | 🔴 High  |

🎯 **Total Weighted Score: 5.8 / 10**

🔴 **Risk:** No patent/IP or defensibility.

🛠 **Recommendations to Improve Score**

- **Leadership (6/10)**: Bring on exec with marketplace experience.
- **Technology/IP (4/10)**: File provisional patent.

❓ **Key Questions for the CEO**

- **Market Strategy**: How do you plan to grow supply and demand?

📘 **Conclusion**

PRK’n offers niche focus with high potential but needs validation.

🔦 **Recommendation**:
Proceed with conditions: Provide more data on growth and economics.

---

After 10 runs of the evaluation, the General Consistency result is:

✅ Green Flag — Balanced scores observed with a standard deviation of 1.3.  
This indicates stable and reliable evaluation across all domains.
      `);
      setReportLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 gap-4 font-sans bg-gradient-to-br from-gray-50 to-indigo-100">
      <h1 className="text-2xl font-bold mb-4">AI Pitch Deck Reader</h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => {
            setMode('upload');
            setAiReport('');
            setAnswers(Array(questionPrompts.length).fill(''));
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
              onChange={(e) => {
                const selectedFile = e.target.files?.[0] || null;
                setFile(selectedFile);
              }}
              className="hidden"
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

          {result && !result.error && (
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
                <tbody>{Object.entries(result.scores).map(([factor, value]: any) => renderScoreRow(factor, value))}</tbody>
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
          )}

          {result && result.error && <div className="mt-6 text-red-600 font-semibold">Error: {result.error}</div>} 

          {result && 
          (
            <div className="mt-8">
                <button
                  className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600"
                  onClick={async () => {
                    // 显示loading
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

      {mode === 'questions' && (
        <>
          <div className="max-h-[600px] overflow-auto bg-white rounded-lg p-6 shadow space-y-6 max-w-3xl w-full">
            {questionPrompts.map((q, i) => (
              <div key={i} className="flex flex-col">
                <label className="font-semibold mb-1">{q}</label>
                <textarea
                  rows={3}
                  className="border rounded p-2 resize-none focus:outline-indigo-500"
                  value={answers[i]}
                  onChange={e => handleChangeAnswer(i, e.target.value)}
                  placeholder="Type your answer here..."
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmitAnswers}
            disabled={reportLoading}
            className="bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-800 disabled:opacity-50 transition mt-4"
          >
            {reportLoading ? 'Submitting...' : 'Submit Answers'}
          </button>

          {aiReport && (
            <div className="max-w-3xl w-full bg-white p-6 rounded shadow mt-6 prose prose-indigo">
              <ReactMarkdown>{aiReport}</ReactMarkdown>
            </div>
          )}
        </>
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
          onClick={() => setShowReport(true)}
          className="bg-orange-600 text-white px-6 py-3 rounded-lg text-lg mb-8 shadow hover:bg-orange-700"
        >
          Generate AI Analysis Report
        </button>

        {showReport && (
          <div className="w-full max-w-4xl space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">🔍 Quick Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-semibold">Company Name:</span> {reportData.summary.companyName}</div>
                <div><span className="font-semibold">Website:</span> {reportData.summary.website}</div>
                <div><span className="font-semibold">CEO:</span> {reportData.summary.ceo}</div>
                <div><span className="font-semibold">Founded:</span> {reportData.summary.founded}</div>
                <div><span className="font-semibold">Business Model:</span> {reportData.summary.businessModel}</div>
                <div><span className="font-semibold">Deal Structure:</span> {reportData.summary.dealStructure}</div>
                <div><span className="font-semibold">Ask / Valuation:</span> {reportData.summary.askValuation}</div>
                <div><span className="font-semibold">Revenue Streams:</span> {reportData.summary.revenueStreams}</div>
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
                🎯 Total Weighted Score: {reportData.totalWeightedScore} / 10
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
                {reportData.recommendations.map((group, idx) => (
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
                {Object.entries(reportData.keyQuestions).map(([section, qs]) => (
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
              <div className="mb-2">{reportData.conclusion}</div>
              <div className="font-bold text-indigo-700">{reportData.recommendation}</div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold mb-2">📊 General Consistency</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>🚩 Red Flag: Score std. deviation &gt; 2.5 OR 2+ domains &lt; 4</li>
                <li>⚠️ Yellow Flag: Std. dev &gt; 1.5 OR 1 domain &lt; 5</li>
                <li>✅ Green Flag: Balanced scores, std dev &lt; 1.5</li>
              </ul>
              <div className="mt-4 text-gray-700">
                After 10 runs of the evaluation, the General Consistency result is:<br />
                <strong>✅ Green Flag</strong> — Balanced scores observed with a standard deviation of 1.3.<br />
                This indicates stable and reliable evaluation across all domains.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
