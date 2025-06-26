// GeneralConsistencyFlag.tsx
import React from "react";

type ScoreRun = {
  startup_id: number;
  evaluator_id: number;
  scores: Record<string, { Score?: number | null }>;
  totalScore: number | null;
};

interface GeneralConsistencyFlagProps {
  scoreRuns: ScoreRun[];
}

const GeneralConsistencyFlag: React.FC<GeneralConsistencyFlagProps> = ({ scoreRuns }) => {
  if (!scoreRuns.length) {
    return (
      <div className="mt-8 p-6 rounded-xl bg-white shadow-lg">
        <h2 className="text-lg font-bold mb-2 text-indigo-700">General Consistency</h2>
        <div>No scores yet.</div>
      </div>
    );
  }

  const validScores = scoreRuns
    .map(run => typeof run.totalScore === 'number' ? run.totalScore : null)
    .filter(v => v !== null) as number[];

  const mean = validScores.reduce((a, b) => a + b, 0) / validScores.length;
  const sqDiff = validScores.map(v => Math.pow(v - mean, 2));
  const std = Math.sqrt(sqDiff.reduce((a, b) => a + b, 0) / validScores.length);

  let flag = "", reason = "";

  if (scoreRuns.length === 1) {
    const domains = Object.values(scoreRuns[0].scores).map(val => typeof val.Score === 'number' ? val.Score : 0);
    if (domains.every(v => v >= 8)) {
      flag = "✅ Green Flag";
      reason = "Only one score, all domains ≥ 8";
    } else if (domains.some(v => v < 5)) {
      flag = "⚠️ Yellow Flag";
      reason = "Only one score, at least one domain < 5";
    } else {
      flag = "✅ Green Flag";
      reason = "Only one score, standard deviation = 0";
    }
  } else {
    let low5 = 0, low7 = 0;
    scoreRuns.forEach(run => {
      Object.values(run.scores).forEach(val => {
        if (typeof val.Score === 'number') {
          if (val.Score < 5) low5++;
          if (val.Score < 7) low7++;
        }
      });
    });
    if (std > 2.5 || low5 >= 2) {
      flag = "🚩 Red Flag";
      reason = "Score std. deviation > 2.5 OR 2+ domains < 5";
    } else if (std > 1.5 || low7 >= 1) {
      flag = "⚠️ Yellow Flag";
      reason = "Std. dev > 1.5 OR 1 domain < 7";
    } else if (std < 1.5 && validScores.every(v => v >= 8)) {
      flag = "✅ Green Flag";
      reason = "Balanced scores, std dev < 1.5 and all scores >8";
    } else {
      flag = "✅ Green Flag";
      reason = "Balanced scores, std dev < 1.5";
    }
  }

  return (
    <div className="mt-8 p-6 rounded-xl bg-white shadow-lg">
      <h2 className="text-lg font-bold mb-2 text-indigo-700">General Consistency</h2>
      <div>
        <div className="text-base mb-1">
          <span className="font-semibold">Historical Score Standard Deviation: </span>
          <span className="text-indigo-700 font-bold">{std.toFixed(2)}</span>
        </div>
        <div className="text-lg mb-1">
          <span className="font-semibold">Flag: </span>
          <span>{flag}</span>
        </div>
        <div className="text-sm text-gray-700">{reason}</div>
      </div>
    </div>
  );
};

export default GeneralConsistencyFlag;
