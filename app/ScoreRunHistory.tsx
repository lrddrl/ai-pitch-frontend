//ScoreRunHistory.tsx

import React from "react"; 

type ScoreRun = {
  startup_id: number;
  evaluator_id: number;
  scores: Record<string, { Score?: number | null }>;
  totalScore: number | null;
};

interface ScoreRunHistoryProps {
  scoreRuns: ScoreRun[];
}

const ScoreRunHistory: React.FC<ScoreRunHistoryProps> = ({ scoreRuns }) => {
  if (!scoreRuns.length) {
    return (
      <div className="w-full max-w-xl mt-10">
        <h2 className="text-lg font-bold mb-3 text-gray-700">📖 Total Score History</h2>
        <div className="text-gray-500">No score history yet.</div>
      </div>
    );
  }

  console.log('scoreRuns:', scoreRuns);

  return (
    <div className="w-full max-w-xl mt-10">
      <h2 className="text-lg font-bold mb-3 text-gray-700">📖 Total Score History</h2>
      {scoreRuns.map((run,idx) => (
        <div  key={idx} className="mb-4 border rounded-xl shadow bg-white p-4">
          <div>
            <strong>Startup ID:</strong> {run.startup_id} &nbsp;
            <strong>Evaluator ID:</strong> {run.evaluator_id} &nbsp;
            <strong>Total Score:</strong>
            <span className="text-indigo-700 font-bold"> {run.totalScore ?? "--"}</span>
          </div>
          <table className="w-full border mt-2 bg-gray-50 rounded">
            <thead>
              <tr>
                <th className="py-1 px-2">Category</th>
                <th className="py-1 px-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(run.scores).map(([cat, val]) => (
                <tr key={cat}>
                  <td className="py-1 px-2">{cat}</td>
                  <td className="py-1 px-2">{val?.Score ?? "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default ScoreRunHistory;
