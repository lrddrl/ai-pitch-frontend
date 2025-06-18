'use client';

import { useState } from 'react';
import ReactMarkdown from "react-markdown";

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

export default function Home() {
  const [mode, setMode] = useState<'upload' | 'questions'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [selectedQuestion, setSelectedQuestion] = useState(questionPrompts[0]);
  const [aiReport, setAiReport] = useState<string>('');
  const [reportLoading, setReportLoading] = useState(false);

  const fakeReport = `
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
| Market Size & Fit         | Parking near events/beaches/ski/urban        | Massive latent market               | Regionalized adoption needed           | 7     | 25%    | 1.75           | 🟢 Low     |
| Technology & IP           | Marketplace, no proprietary tech             | Simple mobile-first product         | No IP protection                       | 4     | 10%    | 0.4            | 🔴 High    |

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
`;

  const handleGenerateAnswer = () => {
    setReportLoading(true);
    setTimeout(() => {
      setAiReport(fakeReport);
      setReportLoading(false);
    }, 500);
  };

  const handleUpload = async () => {
    if (!file) return alert('Please select a PDF file');
    setLoading(true);
    setResult(null);
    setAiReport('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/score`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch {
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

  const renderScoreRow = (factor: string, value: any) => {
    return (
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
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 gap-4 font-sans bg-gradient-to-br from-gray-50 to-indigo-100">
      <h1 className="text-2xl font-bold mb-4">AI Pitch Deck Reader</h1>

      <div className="flex space-x-4 mb-6">
        <button
          className={`px-6 py-2 rounded ${mode === 'upload' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
          onClick={() => {
            setMode('upload');
            setAiReport('');
            setResult(null);
          }}
        >
          Upload PDF
        </button>
        <button
          className={`px-6 py-2 rounded ${mode === 'questions' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
          onClick={() => {
            setMode('questions');
            setResult(null);
            setFile(null);
          }}
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
                {result.preview_text_full && !result.showFullText
                  ? result.preview_text
                  : result.preview_text_full || result.preview_text}
              </p>
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
        </>
      )}

      {mode === 'questions' && (
        <div className="max-w-xl w-full flex flex-col gap-4">
          <label className="font-semibold text-gray-700">Select a question to ask:</label>
          <select
            className="p-3 border rounded"
            value={selectedQuestion}
            onChange={(e) => setSelectedQuestion(e.target.value)}
          >
            {questionPrompts.map((q, i) => (
              <option key={i} value={q}>{q}</option>
            ))}
          </select>

          <button
            onClick={handleGenerateAnswer}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-6 py-3 rounded-xl hover:scale-105 transition-transform duration-200"
            disabled={reportLoading}
          >
            {reportLoading ? 'Generating Answer...' : 'Get Answer'}
          </button>

          {aiReport && (
            <div className="bg-white p-6 rounded shadow mt-4 prose prose-indigo max-h-[500px] overflow-auto">
              <ReactMarkdown>{aiReport}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
