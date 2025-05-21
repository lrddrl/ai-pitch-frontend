'use client';

import { useState } from 'react';

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [inputPwd, setInputPwd] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  const PASSWORD = '611';

  const handleLogin = () => {
    if (inputPwd === PASSWORD) {
      setAuthenticated(true);
    } else {
      alert('Wrong password');
    }
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
    .map((v: any) => (typeof v.Score === 'number' ? v.Score : 0))
  if (scores.length === 0) return null;
  const total = scores.reduce((a, b) => a + b, 0);
  return total.toFixed(1);
};

function generateReportText(scores: any) {
  if (!scores) return '';
  let text = '📘 Investment Analysis Report\n\n';
  for (const [factor, data] of Object.entries(scores)) {
    text += `🧩 ${factor} – Score: ${data.Score}/10\n${data.Justification}\n\n`;
  }
  text += `📈 Total Score: ${calculateTotalScore()}\n`;
  return text;
}


  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
        <h2 className="text-xl font-bold mb-2">Access Required</h2>
        <p className="text-sm text-gray-600">What is our cap number?</p>
        <input
          type="password"
          placeholder="Enter your answer..."
          className="border px-4 py-2 rounded mt-1"
          onChange={(e) => setInputPwd(e.target.value)}
        />
        <button className="bg-black text-white px-4 py-2 rounded" onClick={handleLogin}>
          Login
        </button>
      </div>
    );
  }

  const renderScoreRow = (factor: string, value: any) => {
    if (factor === 'Risk' || factor === 'OverallRisk') return null;
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
          {result.Risk && (
            <p className="mt-4 text-center font-semibold text-red-700">
              Overall Risk Level: <span className="uppercase">{result.Risk}</span>
            </p>
          )}
        </div>
      )}

      {result && result.error && <div className="mt-6 text-red-600 font-semibold">Error: {result.error}</div>}

      <pre>{generateReportText(result.scores)}</pre>
    </div>
  );
}
