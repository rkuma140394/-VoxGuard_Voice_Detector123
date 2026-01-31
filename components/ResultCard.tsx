
import React from 'react';
import { AnalysisResult, Classification } from '../types';

interface Props {
  result: AnalysisResult;
}

// Fixed: Define Badge as a standalone component with React.FC to resolve the 'key' prop TypeScript error
const Badge: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
    {children}
  </span>
);

export const ResultCard: React.FC<Props> = ({ result }) => {
  const isAI = result.classification === Classification.AI;
  const isInconclusive = result.classification === Classification.INCONCLUSIVE;

  const colorClass = isAI 
    ? 'bg-red-50 border-red-200 text-red-800' 
    : isInconclusive 
      ? 'bg-amber-50 border-amber-200 text-amber-800'
      : 'bg-emerald-50 border-emerald-200 text-emerald-800';

  return (
    <div className={`mt-8 p-6 rounded-2xl border-2 animate-in fade-in slide-in-from-bottom-4 duration-500 ${colorClass}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          {isAI ? '🚨 AI Generated Detected' : isInconclusive ? '❓ Inconclusive' : '✅ Human Voice Verified'}
        </h3>
        <div className="text-right">
          <p className="text-sm opacity-80 uppercase tracking-wider font-semibold">Confidence</p>
          <p className="text-2xl font-black">{(result.confidenceScore * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold uppercase opacity-60 mb-1">Language Detected</h4>
          <p className="font-medium">{result.detectedLanguage}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase opacity-60 mb-1">Technical Explanation</h4>
          <p className="text-sm leading-relaxed">{result.explanation}</p>
        </div>

        {result.artifacts && result.artifacts.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold uppercase opacity-60 mb-2">Anomalies Detected</h4>
            <div className="flex flex-wrap gap-2">
              {result.artifacts.map((art, idx) => (
                <Badge key={idx} color={isAI ? 'bg-red-200 text-red-900' : 'bg-slate-200 text-slate-900'}>
                  {art}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
