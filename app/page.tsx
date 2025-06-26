'use client';

import { useState, useEffect, useRef  } from 'react';
import ReactMarkdown from "react-markdown";
import PdfFileList from './PdfFileList'; 
import ScoreRunHistory from './ScoreRunHistory';
import GeneralConsistencyFlag from './GeneralConsistencyFlag';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ScoreObj {
  [key: string]: {
    Score?: number | null;
    Color?: string;
    Justification?: string;
    [key: string]: any; 
  }
}

type FlatScoreRecord = {
  startup_id: number;
  evaluator_id: number;
  category: string;
  score: number | null;
};


type ScoreRun = {
  startup_id: number;
  evaluator_id: number;
  scores: Record<string, { Score?: number | null; Justification?: string }>;
  totalScore: number | null;
};


function getAvgScoresPerRun(historyArr: ScoreObj[]): number[] {
  return historyArr.map((scoresObj) => {
    const values = Object.values(scoresObj)
      .map((v) => typeof v.Score === 'number' ? v.Score : 0);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  });
}


const categorizedPrompts: Record<string, { category: string; prompt: string }[]> = {
  "Prompt Domain 1: Risk / Impact Analysis": [
    {
      "category": "Category 1.1 \u2013 Macro-Level Risk",
      "prompt": "What macro-level risks could impact this startup, including political, technical, social or societal, environmental, legal, or ESG factors? Consider regulatory instability, shifting tech standards, or ESG liabilities that influence long-term sustainability."
    },
    {
      "category": "Category 1.2 \u2013 Sector Valuation Comparison",
      "prompt": "How does the startup's valuation compare to peers in the same industry and stage? Use comparable market comps, stage benchmarks, and growth-adjusted multiples to contextualize valuation. Focus on both revenue and EBITDA multiples where it makes sense."
    },
    {
      "category": "Category 1.3 \u2013 Blind Spot Assessment",
      "prompt": "What questions should be asked to uncover blind spots or risks not visible in current disclosures? Probe potential biases in traction data, overlooked market dynamics, or leadership gaps. What other companies could potentially use its resources to build an adjacency to its current business and compete?"
    },
    {
      "category": "Category 1.4 \u2013 Score Optimization",
      "prompt": "Which specific areas should the startup focus on to improve its overall evaluation score? Evaluate leadership depth, traction strength, product defensibility, product platform expansion to adjacent markets, or GTM clarity."
    },
    {
      "category": "Category 1.5 \u2013 Success vs. Failure Predictors",
      "prompt": "What leading indicators suggest this company is more likely to succeed or fail? Use predictive patterns across funding history, founder experience, market timing,strength of patent if it can be determined, and early traction. If it is a new to the world product, does the team have the wherewithal to succeed in building a brand?"
    },
    {
      "category": "Category 1.6 \u2013 Angel Investor Risk",
      "prompt": "What risks do angel investors introduce (e.g., governance misalignment, unrealistic exit pressure)? Review early investor rights, influence on cap table dynamics, or risk of over-mentorship."
    }
  ],
  "Prompt Domain 2: Leadership & Team": [
    {
      "category": "Category 2.1 \u2013 Team Composition",
      "prompt": "What is the overall composition of the leadership team, and how balanced are roles and responsibilities? Look for the team to have complementary skills and backgrounds in technical, commercial, and operational experience."
    },
    {
      "category": "Category 2.2 \u2013 Board & Advisors",
      "prompt": "Who sits on the board or advisory committee, and what strategic value do they add? Highlight domain expertise, network access, or track records in scaling startups."
    },
    {
      "category": "Category 2.3 \u2013 KOL/Expert Involvement",
      "prompt": "Can credible KOLs or domain experts support the company\u2019s development strategy? Especially critical for medtech or biotech evaluations."
    },
    {
      "category": "Category 2.4 \u2013 Execution Alignment",
      "prompt": "How well is the leadership team aligned with execution milestones and KPIs? Cross-check OKRs, prior project delivery timelines, and founder-operational focus."
    },
    {
      "category": "Category 2.5 \u2013 Critical Hires",
      "prompt": "Which key roles are unfilled, and how might that affect the company's go-to-market or scale-up ability?"
    },
    {
      "category": "Category 2.6 \u2013 CEO Track Record",
      "prompt": "Has the CEO, founding, or key members of the operational team successfully exited companies? Prior exit experience often correlates with better strategic foresight."
    },
    {
      "category": "Category 2.7 \u2013 Team Cohesion",
      "prompt": "Has this team worked together before? What is the level of collaboration and trust? Look for early signals from investor calls, founder narratives, or organizational transparency."
    },
    {
      "category": "Category 2.8 \u2013 Board Dynamics",
      "prompt": "What governance structures and voting rights exist at the board level? Identify any control risks or founder-board tension signals. Do the board members offer skills to support the company\u2019s goals?"
    },
    {
      "category": "Category 2.9 \u2013 Medical Leadership (if relevant)",
      "prompt": "What clinical or trial experience does the medical leadership bring? For FDA-regulated startups, depth here is critical. Does the company have an FDA expert on the team, contracted with a company or have board skills in this category?"
    },
    {
      "category": "Category 2.10 \u2013 Leadership Red Flags",
      "prompt": "Are there observable leadership risks such as skill gaps, turnover trends, or cultural misalignment?"
    }
  ],
  "Prompt Domain 3: Product / Market Fit": [
    {
      "category": "Category 3.1 \u2013 Problem Definition",
      "prompt": "What core customer pain points or unmet needs is the startup trying to address? Consider urgency, scale, and clarity of the problem."
    },
    {
      "category": "Category 3.2 \u2013 Proposed Solution",
      "prompt": "What is the company\u2019s product or service, and how does it solve the identified problem? Is the solution compelling, feasible, and differentiated? Can the team sustain that differentiation long term?"
    },
    {
      "category": "Category 3.3 \u2013 Market Size (TAM/SAM/SOM)",
      "prompt": "What is the size of the addressable and serviceable market, and what share is realistically attainable? Use credible sources and segmentation logic."
    },
    {
      "category": "Category 3.4 \u2013 Target Customers (ICP)",
      "prompt": "Who are the ideal customers, and how are they segmented, prioritized, or reached? Look for clarity in the ICP definition and targeting mechanisms."
    },
    {
      "category": "Category 3.5 \u2013 Market Positioning",
      "prompt": "What is the startup\u2019s value proposition, and how is it positioned compared to competitors? Check if it resonates with buyer psychology."
    },
    {
      "category": "Category 3.6 \u2013 Competitive Advantage",
      "prompt": "What moats or unique features give this solution a durable edge? These could be UX, data assets, patents, or distribution power."
    },
    {
      "category": "Category 3.7 \u2013 Product Roadmap",
      "prompt": "What are the following development milestones? Track progress, dependencies, and scalability phases. Do the revenue streams on their pro forma correlate with the roadmap?"
    },
    {
      "category": "Category 3.8 \u2013 Market Extensibility",
      "prompt": "Can the product scale into adjacent markets or geographies? Assess applicability using the Ansoff Matrix."
    },
    {
      "category": "Category 3.9 \u2013 Fit Risks or Caveats",
      "prompt": "What risks exist regarding adoption, saturation, or misalignment with buyer needs? These could include a pricing model mismatch, weak onboarding, or timing issues."
    }
  ],
  "Prompt Domain 4: Competition": [
    {
      "category": "Category 4.1 \u2013 Competitor Landscape Overview",
      "prompt": "Who are the startup\u2019s main direct and indirect competitors? Include adjacent solutions competing for budget, attention, or usage."
    },
    {
      "category": "Category 4.2 \u2013 Competitive Positioning & Moat",
      "prompt": "What is the startup\u2019s unique competitive positioning and sustainable differentiation? Consider data assets, UX, patents, or distribution as moats."
    },
    {
      "category": "Category 4.3 \u2013 Barriers to Entry",
      "prompt": "How difficult is it for new entrants to compete in this space? Evaluate IP protections, capital intensity, switching costs, and regulatory barriers."
    },
    {
      "category": "Category 4.4 \u2013 SWOT-Based Risk Assessment",
      "prompt": "What are the startup\u2019s competitive strengths, weaknesses, opportunities, and threats (SWOT)? Include internal and external risk vectors."
    },
    {
      "category": "Category 4.5 \u2013 Competitive Scenario Planning",
      "prompt": "In what scenarios might the startup gain or lose traction vs. rivals? Simulate outcomes based on pricing, speed, brand equity, or talent."
    }
  ],
  "Prompt Domain 5: Technology / IP / Architecture": [
    {
      "category": "Category 5.1 \u2013 Technology Overview",
      "prompt": "What core technology powers the product, and how mature or innovative is it?"
    },
    {
      "category": "Category 5.2 \u2013 Patent & IP Inventory",
      "prompt": "What patents or IP protections does the company currently hold or plan to file?"
    },
    {
      "category": "Category 5.3 \u2013 IP Origin",
      "prompt": "Is the IP internally developed, licensed, or acquired?"
    },
    {
      "category": "Category 5.4 \u2013 IP Strategy",
      "prompt": "What is the long-term IP strategy, including jurisdictions, renewals, and exclusivity terms?"
    },
    {
      "category": "Category 5.5 \u2013 Tech Stack Review",
      "prompt": "What technology stack supports the product, and is it scalable and secure?"
    },
    {
      "category": "Category 5.6 \u2013 Strategic Control Points",
      "prompt": "Which technology parts create strategic leverage (e.g., proprietary models, partners, or supply chains)?"
    },
    {
      "category": "Category 5.7 \u2013 Scalability Architecture",
      "prompt": "How modular, redundant, and future-proof is the system design?"
    },
    {
      "category": "Category 5.8 \u2013 Sustainable Tech Advantage",
      "prompt": "What prevents competitors from replicating or leapfrogging the core tech?"
    },
    {
      "category": "Category 5.9 \u2013 Red Flags",
      "prompt": "Are there concerns about code quality, vendor lock-in, or performance?"
    }
  ],
  "Prompt Domain 6: Traction": [
    {
      "category": "Category 6.1 \u2013 Customer Metrics",
      "prompt": "What are the key metrics around customer usage, such as DAU, MAU, retention, churn, or user growth?"
    },
    {
      "category": "Category 6.2 \u2013 Revenue Traction",
      "prompt": "What are the current revenue levels and monetization strategies, and how consistent is revenue retention?"
    },
    {
      "category": "Category 6.3 \u2013 User Engagement",
      "prompt": "How engaged are users with the product?"
    },
    {
      "category": "Category 6.4 \u2013 Sales Pipeline",
      "prompt": "What is the sales pipeline status regarding leads and conversion?"
    },
    {
      "category": "Category 6.5 \u2013 Pre-Revenue Signals",
      "prompt": "What alternative traction signals exist (e.g., pilots, grants, LOIs)?"
    }
  ],
  "Prompt Domain 7: Business Model & Financials": [
    {
      "category": "Category 7.1 \u2013 Business Architecture & Model",
      "prompt": "What is the startup\u2019s revenue model and its market fit?"
    },
    {
      "category": "Category 7.2 \u2013 Revenue Strategy & Channels",
      "prompt": "What are the primary routes to revenue, including sales or integrations?"
    },
    {
      "category": "Category 7.3 \u2013 Financial Forecasts & Assumptions",
      "prompt": "How realistic are the company\u2019s financial projections?"
    },
    {
      "category": "Category 7.4 \u2013 Unit Economics & Scalability",
      "prompt": "What are CAC, LTV, gross margin, and how scalable is the model?"
    },
    {
      "category": "Category 7.5 \u2013 Financial Benchmarking",
      "prompt": "How do the metrics compare with sector benchmarks?"
    }
  ],
  "Prompt Domain 8: Go-To-Market (GTM) Strategy": [
    {
      "category": "Category 8.1 \u2013 GTM Strategy Overview",
      "prompt": "What is the company\u2019s overall GTM strategy and alignment with ICP?"
    },
    {
      "category": "Category 8.2 \u2013 Peer Comparison",
      "prompt": "How does the GTM strategy compare with peers?"
    },
    {
      "category": "Category 8.3 \u2013 Tactical Execution Plan",
      "prompt": "What are the detailed GTM plans, KPIs, and milestones?"
    }
  ],
  "Prompt Domain 9: Terms & Exit Strategy": [
    {
      "category": "Category 9.1 \u2013 Valuation Benchmark",
      "prompt": "How does the startup\u2019s valuation compare with peers?"
    },
    {
      "category": "Category 9.2 \u2013 Deal Terms",
      "prompt": "Are there any investor-unfavorable terms in the deal structure?"
    },
    {
      "category": "Category 9.3 \u2013 Exit Risk & Timing",
      "prompt": "What risks might prevent a successful exit?"
    }
  ],
  "Prompt Domain 10: FDA Process (If Applicable)": [
    {
      "category": "Category 10.1 \u2013 FDA Submission Pathway",
      "prompt": "What is the startup\u2019s intended regulatory pathway with the FDA?"
    },
    {
      "category": "Category 10.2 \u2013 FDA Process Risk",
      "prompt": "What risks could delay or derail FDA clearance or approval?"
    }
  ],
  "Prompt Domain 11: Terms & Valuation": [
    {
      "category": "Category 11.1 \u2013 Valuation Reasonableness",
      "prompt": "Is the valuation justified based on traction and market potential?"
    },
    {
      "category": "Category 11.2 \u2013 Convertible Notes / SAFE Review",
      "prompt": "Does the convertible note contain high-risk clauses?"
    }
  ],
  "Prompt Domain 12: Exit Strategy": [
    {
      "category": "Category 12.1 \u2013 Exit Viability & Return Potential",
      "prompt": "What is the projected return on exit (IRR, MOIC) based on current valuation, ownership, and market conditions?"
    },
    {
      "category": "Category 12.6 \u2013 Final Exit Planning Caveats",
      "prompt": "Are there unresolved concerns about exit terms, founder incentives, or buyer misfits needing monitoring?"
    }
  ]
};



export default function Home() {
  const [scoreRuns, setScoreRuns] = useState<ScoreRun[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

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

  const [consistencyResult, setConsistencyResult] = useState<any>(null);
  const [consistencyLoading, setConsistencyLoading] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const triggerInput = () => {
    inputRef.current?.click();
  };


  const handleRemoveFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };


const handleExportPdf = async () => {
  if (!reportRef.current) return;

  const canvas = await html2canvas(reportRef.current, {
    scale: 2,
    useCORS: true
  });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pdfWidth = 210; 
  const pageHeight = 297; 
  const imgProps = pdf.getImageProperties(imgData);
  const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save("report.pdf");
};





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

const getFlagAndReason = (
  category: string,
  score?: number | null,
  value?: CategoryReport
): FlagResult => {
  const c = category.toLowerCase();
  const justification =
    value?.concerns || value?.description || value?.strengths || "";

  // Leadership
  if (/leadership|team/.test(c)) {
    if (
      (score ?? 0) < 4 ||
      /solo founder|no relevant background|missing major executives/i.test(justification)
    ) {
      return { flag: "🚩 Red", reason: "Score < 4 or major leadership risk" };
    } else if (
      (score ?? 0) < 7 ||
      /unclear founder|unclear operational roles/i.test(justification)
    ) {
      return { flag: "⚠️ Yellow", reason: "Score < 7 or unclear roles" };
    } else if ((score ?? 0) >= 8) {
      return { flag: "✅ Green", reason: "Score ≥ 8 with strong team" };
    }
  }
  // Product / IP
  if (/product|ip/.test(c)) {
    if (
      (score ?? 0) < 4 ||
      /no ip|no innovation|no logic/i.test(justification)
    ) {
      return { flag: "🚩 Red", reason: "Score < 4 or no IP/innovation" };
    } else if (
      (score ?? 0) < 7 ||
      /claim.*without validation/i.test(justification)
    ) {
      return { flag: "⚠️ Yellow", reason: "Score < 7 or unvalidated claims" };
    } else if ((score ?? 0) >= 8) {
      return { flag: "✅ Green", reason: "Clear sustainable advantage/IP" };
    }
  }
  // Traction
  if (/traction|revenue|user|sales/.test(c)) {
    if (
      (score ?? 0) < 4 ||
      /no user activity|arr ?< ?\$?1k/i.test(justification)
    ) {
      return { flag: "🚩 Red", reason: "Score < 4 or no traction" };
    } else if (
      (score ?? 0) < 7 ||
      /no testimonials|pre-revenue/i.test(justification)
    ) {
      return { flag: "⚠️ Yellow", reason: "Score < 7 or early stage" };
    } else if ((score ?? 0) >= 8) {
      return { flag: "✅ Green", reason: "Strong traction/ARR" };
    }
  }
  // GTM
  if (/go-?to-?market|gtm/.test(c)) {
    if (
      (score ?? 0) < 5 ||
      /no gtm/i.test(justification)
    ) {
      return { flag: "🚩 Red", reason: "Score < 5 or no GTM plan" };
    } else if ((score ?? 0) < 7) {
      return { flag: "⚠️ Yellow", reason: "Score < 7 or incomplete GTM" };
    } else if ((score ?? 0) >= 8) {
      return { flag: "✅ Green", reason: "Score ≥ 8, clear GTM" };
    }
  }
  // Risk / ESG
  if (/risk|esg/.test(c)) {
    if (
      (score ?? 0) < 5 ||
      /regulatory|legal|env.*risk.*not addressed/i.test(justification)
    ) {
      return { flag: "🚩 Red", reason: "Score < 5 or risk not addressed" };
    } else if ((score ?? 0) < 7) {
      return { flag: "⚠️ Yellow", reason: "Score < 7 or partial risk controls" };
    } else if ((score ?? 0) >= 7) {
      return { flag: "✅ Green", reason: "Good risk control/ESG" };
    }
  }
  // Financials & Business Model
  if (/financial|business model/.test(c)) {
    if (
      (score ?? 0) < 5 ||
      /unsustainable|no revenue/i.test(justification)
    ) {
      return { flag: "🚩 Red", reason: "Score < 5 or no financial plan" };
    } else if ((score ?? 0) < 7) {
      return { flag: "⚠️ Yellow", reason: "Score < 7 or weak assumptions" };
    } else if ((score ?? 0) >= 8) {
      return { flag: "✅ Green", reason: "Strong business model/plan" };
    }
  }
  // Exit
  if (/exit/.test(c)) {
    if (
      (score ?? 0) < 5 ||
      /no exit/i.test(justification)
    ) {
      return { flag: "🚩 Red", reason: "Score < 5 or no exit plan" };
    } else if ((score ?? 0) < 7) {
      return { flag: "⚠️ Yellow", reason: "Score < 7 or unclear exit" };
    } else if ((score ?? 0) >= 7) {
      return { flag: "✅ Green", reason: "Clear exit options" };
    }
  }
  // Technology / Infra
  if (/technology|infrastructure|tech stack/.test(c)) {
    if (
      (score ?? 0) < 5 ||
      /not scalable|unverified/i.test(justification)
    ) {
      return { flag: "🚩 Red", reason: "Score < 5 or tech not scalable" };
    } else if ((score ?? 0) < 7) {
      return { flag: "⚠️ Yellow", reason: "Score < 7 or unclear stack" };
    } else if ((score ?? 0) >= 8) {
      return { flag: "✅ Green", reason: "Scalable & robust tech" };
    }
  }
  // Market & Competition
  if (/market|competition|t[a]?m/.test(c)) {
    if (
      (score ?? 0) < 5 ||
      /high saturation|no moat/i.test(justification)
    ) {
      return { flag: "🚩 Red", reason: "Score < 5 or no market" };
    } else if ((score ?? 0) < 7) {
      return { flag: "⚠️ Yellow", reason: "Score < 7 or limited competition" };
    } else if ((score ?? 0) >= 8) {
      return { flag: "✅ Green", reason: "Strong market & moat" };
    }
  }
  // FDA / Regulatory
  if (/fda|regulatory/.test(c)) {
    if (
      (score ?? 0) < 5 ||
      /no regulatory|no irb/i.test(justification)
    ) {
      return { flag: "🚩 Red", reason: "Score < 5 or no regulatory plan" };
    } else if ((score ?? 0) < 7) {
      return { flag: "⚠️ Yellow", reason: "Score < 7 or unclear pathway" };
    } else if ((score ?? 0) >= 8) {
      return { flag: "✅ Green", reason: "Clear regulatory plan" };
    }
  }
  // Terms & Valuation
  if (/terms|valuation/.test(c)) {
    if (
      (score ?? 0) < 5 ||
      /restrictive|extreme cap/i.test(justification)
    ) {
      return { flag: "🚩 Red", reason: "Score < 5 or risky terms" };
    } else if ((score ?? 0) < 7) {
      return { flag: "⚠️ Yellow", reason: "Score < 7 or unclear strategy" };
    } else if ((score ?? 0) >= 8) {
      return { flag: "✅ Green", reason: "Healthy terms/valuation" };
    }
  }
  // fallback
  if ((score ?? 0) >= 8) return { flag: "✅ Green", reason: "Strong score" };
  if ((score ?? 0) >= 5) return { flag: "⚠️ Yellow", reason: "Moderate score" };
  if (score !== null && score !== undefined) return { flag: "🚩 Red", reason: "Low score" };
  return { flag: "N/A", reason: "No score" };
};


const getHistoricalAverageScore = () => {
  if (!scoreRuns.length) return null;
  const validScores = scoreRuns.map(run => typeof run.totalScore === 'number' ? run.totalScore : null).filter(v => v !== null);
  if (!validScores.length) return null;
  const avg = validScores.reduce((a, b) => a! + b!, 0) / validScores.length;
  return avg.toFixed(1);
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

      if (data?.scores) {
      const totalScore = calculateTotalScore({ scores: data.scores });
      setScoreRuns(prev => [
        ...prev,
        {
          startup_id: 1,
          evaluator_id: prev.length + 1,
          scores: data.scores,
          totalScore: totalScore,
        } as ScoreRun
      ]);
    }

    } catch (err) {
      alert('Failed to upload files');
    } finally {
      setLoading(false);
    }
  };


 const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (files && files.length > 0) {
    setFiles(prev => [...prev, ...Array.from(files)]);
  }
};


  const handleBatchScore = async () => {
  setBatchLoading(true);
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/batch_score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: result?.preview_text_full || "" }),
    });
    const data = await res.json();
    if (data.score_records && Array.isArray(data.score_records)) {
      const runsMap = new Map();
      for (const record of data.score_records) {
        const { startup_id, evaluator_id, category, score } = record;
        if (!runsMap.has(evaluator_id)) {
          runsMap.set(evaluator_id, {
            startup_id,
            evaluator_id,
            scores: {},
            totalScore: null
          });
        }
        const run = runsMap.get(evaluator_id);
        run.scores[category] = { Score: typeof score === 'number' ? score : null };
      }

      for (const run of runsMap.values()) {
        const scoreArr = Object.values(run.scores).map(v => {
          const val = v as { Score?: number };
          return typeof val.Score === 'number' ? val.Score : 0;
        });
        run.totalScore = scoreArr.length ? Number((scoreArr.reduce((a, b) => a + b, 0) / scoreArr.length).toFixed(2)) : null;
      }
      setScoreRuns(prev => {
        const next = [...prev, ...Array.from(runsMap.values())];
        console.log('setScoreRuns after batch:', next); // Debug
        return next;
      });
    }
  } catch (e) {
    alert("Batch scoring failed");
  } finally {
    setBatchLoading(false);
  }
};




const calculateTotalScore = (input?: any): number | null => {
  const scoresObj = input?.scores ?? result?.scores;
  if (!scoresObj) return null;
  const scores = Object.values(scoresObj)
    .map((v) => {
      const val = v as { Score?: number };
      return typeof val.Score === 'number' ? val.Score : 0;
    });
  if (scores.length === 0) return null;
  const total = scores.reduce((a, b) => a + b, 0);
  const avg = total / scores.length;
  return Number(avg.toFixed(1));
};


const getFinalWeightedScore = () => {
  if (!reportData || !reportData.categories) return null;
  const total = (reportData.categories as CategoryReport[])
    .map(cat => typeof cat.weightedScore === "number" ? cat.weightedScore : 0)
    .reduce((a, b) => a + b, 0);
  const finalScore = total / 10;
  return finalScore.toFixed(2); 
};

  const renderScoreTable = () => (
    <div className="w-full max-w-3xl mt-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-700">TCA Factor Scoring</h2>
        <div className="text-indigo-700 font-bold text-xl">
        Score: {calculateTotalScore() ?? '--'}
        </div>
        <div className="text-gray-600 font-semibold text-base mt-1">
          Historical Avg Score: {getHistoricalAverageScore() ?? '--'}
        </div>
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

const handleAnalyzeConsistency = async () => {
  if (!scoreRuns.length) {
    alert('No score runs yet!');
    return;
  }
  setConsistencyLoading(true);
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/consistency_analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scoreRuns }),
    });
    const data = await res.json();
    setConsistencyResult(data); 
  } finally {
    setConsistencyLoading(false);
  }
};


const renderSubjectivityTable = (subjectivity:any) => {
  const categories = Object.keys(subjectivity || {});
  if (categories.length === 0) return <div>No subjectivity data.</div>;
  const allEvaluators = Object.keys(subjectivity[categories[0]] || {});
  return (
    <div className="overflow-x-auto mt-4">
      <table className="min-w-full border rounded bg-white shadow">
        <thead>
          <tr>
            <th className="py-2 px-3 border-b bg-indigo-100 text-left">Category</th>
            {allEvaluators.map(eid => (
              <th key={eid} className="py-2 px-3 border-b text-xs">E{eid}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <tr key={cat} className="hover:bg-indigo-50">
              <td className="py-2 px-3 font-semibold text-indigo-800">{cat}</td>
              {allEvaluators.map(eid => {
                const v = subjectivity[cat][eid];
                return (
                  <td
                    key={eid}
                    className={`py-2 px-3 text-center font-mono ${v > 0 ? 'text-orange-600 font-bold' : 'text-gray-500'}`}
                  >
                    {typeof v === "number" ? v.toFixed(2) : '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-sm text-gray-500 mt-2">
        <span className="font-bold text-orange-600">Orange numbers</span> indicate standard deviation &gt; 0 (higher subjectivity).
      </p>
    </div>
  );
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
                <span className="font-semibold">{flag}:</span>
                {reason}(scores: <strong>{cat.score ?? "--"}</strong>)
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
             <div className="flex gap-4 mb-6">
              <button
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl text-lg font-bold"
                onClick={triggerInput}
              >
                <span className="mr-2 text-xl">+</span> Add PDF
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                multiple
                onChange={handleAddFiles}
                style={{ display: "none" }}
              />
              <button
                onClick={handleUpload}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-semibold px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform duration-200"
                disabled={loading}
              >
                {loading ? 'Uploading & Scoring...' : 'Extract & Score'}
              </button>
            </div>

          <PdfFileList files={files} onRemove={handleRemoveFile} />

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
     
      </div>

      <div className="p-6 bg-gray-50 min-h-screen flex flex-col items-center">
        <button
          onClick={handleGenerateReport}
          className="bg-orange-600 text-white px-6 py-3 rounded-lg text-lg mb-8 shadow hover:bg-orange-700"
          disabled={reportLoading}
        >
          {reportLoading ? "Generating Report..." : "Generate AI Analysis Report"}
        </button>

         {/* {renderScoreHistory()} */}

         <button
          disabled={batchLoading}
          onClick={handleBatchScore}
          className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600 mb-4"
        >
          {batchLoading ? "Scoring 30 times..." : "Run 30 Scores"}
        </button>


         <ScoreRunHistory scoreRuns={scoreRuns} />

         

        <button
          className="bg-indigo-700 text-white px-4 py-2 rounded"
          disabled={consistencyLoading || !scoreRuns.length}
          onClick={handleAnalyzeConsistency}
        >
          {consistencyLoading ? "Analyzing..." : "Analyze Consistency"}
        </button>

        <h3 className="font-bold mb-2 text-indigo-700">Subjectivity (Standard Deviation, higher means more subjective)</h3>
{consistencyResult?.subjectivity && renderSubjectivityTable(consistencyResult.subjectivity)}


        {consistencyResult && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-4">
            <h3 className="font-bold mb-2 text-indigo-700">Subjectivity (Standard Deviation, higher means more subjective)</h3>
            <pre className="text-xs bg-gray-50 p-2 rounded">
              {JSON.stringify(consistencyResult.subjectivity, null, 2)}
            </pre>
            <h3 className="font-bold mt-4 mb-2 text-indigo-700">Subjectivity Summary (Average Subjectivity)</h3>
            <pre className="text-xs bg-gray-50 p-2 rounded">
              {JSON.stringify(consistencyResult.subjectivity_summary, null, 2)}
            </pre>
            <h3 className="font-bold mt-4 mb-2 text-indigo-700">Rubric Drift (Deviation from group mean by person and category)</h3>
            <pre className="text-xs bg-gray-50 p-2 rounded">
              {JSON.stringify(consistencyResult.rubric_drift, null, 2)}
            </pre>
            <h3 className="font-bold mt-4 mb-2 text-indigo-700">Rubric Drift Avg (Average Deviation)</h3>
            <pre className="text-xs bg-gray-50 p-2 rounded">
              {JSON.stringify(consistencyResult.rubric_drift_avg, null, 2)}
            </pre>
          </div>
        )}


           

        {showReport && reportData && (
          <>
          <button
            onClick={handleExportPdf}
            className="mb-4 bg-blue-600 text-white px-4 py-2 rounded shadow"
          >
            Export Report PDF
          </button>
            <div ref={reportRef} 
             className="w-full max-w-4xl space-y-8 pdf-export" 
            >
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

            <GeneralConsistencyFlag scoreRuns={scoreRuns} />
            
            </div>
            {/* <div ref={reportRef} style={{background:'#fff', color:'#000'}}>
            Test Content
          </div> */}
          </>
          
        )}
      </div>
    </div>
  );
}
