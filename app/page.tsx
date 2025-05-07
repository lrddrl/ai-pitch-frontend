'use client';

import { useState } from 'react';

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [inputPwd, setInputPwd] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const PASSWORD = 'cap611'; // 设置你的密码

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

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/extract', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setText(data.text);
    } catch (err) {
      alert('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
        <h2 className="text-xl font-bold">Enter Access Password</h2>
        <input
          type="password"
          className="border px-4 py-2 rounded"
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
    <div className="min-h-screen flex flex-col items-center justify-center p-10 gap-4 font-sans">
      <h1 className="text-2xl font-bold">AI Pitch Deck Reader</h1>
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button
        onClick={handleUpload}
        className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
      >
        {loading ? 'Uploading...' : 'Extract Text'}
      </button>
      <pre className="mt-6 p-4 w-full max-w-3xl border rounded bg-gray-100 text-sm whitespace-pre-wrap">
        {text}
      </pre>
    </div>
  );
}
