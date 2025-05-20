'use client';

import { useState } from 'react';

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [inputPwd, setInputPwd] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
        <button
          className="bg-black text-white px-4 py-2 rounded"
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 gap-4 font-sans bg-gradient-to-br from-gray-50 to-indigo-100">
      <h1 className="text-2xl font-bold mb-4">AI Pitch Deck Reader</h1>
      <label className="cursor-pointer bg-white border border-gray-300 rounded-lg px-6 py-3 shadow-md hover:bg-gray-100 transition">
        <span className="text-gray-800 font-medium">
          {file ? `📄 ${file.name}` : '📄 Choose PDF File'}
        </span>
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

      {/* Show result table */}
      {result && !result.error && (
        <div className="w-full max-w-2xl mt-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-700 text-center">
            CFA Factor Scoring
          </h2>
          <table className="w-full border rounded-lg bg-white shadow">
            <thead>
              <tr className="bg-indigo-100">
                <th className="py-2 px-3 border-b text-left">Factor</th>
                <th className="py-2 px-3 border-b text-left">Grade</th>
                <th className="py-2 px-3 border-b text-left">Justification</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(result).map(([factor, value]: any) => (
                <tr key={factor} className="hover:bg-indigo-50 transition">
                  <td className="py-2 px-3 font-medium">{factor}</td>
                  <td className="py-2 px-3 text-indigo-600 font-bold">{value.Grade}</td>
                  <td className="py-2 px-3">{value.Justification}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Show error if backend returns error */}
      {result && result.error && (
        <div className="mt-6 text-red-600 font-semibold">
          Error: {result.error}
        </div>
      )}
    </div>
  );
}
