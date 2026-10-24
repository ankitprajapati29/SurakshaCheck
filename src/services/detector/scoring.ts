
export interface RiskResult {
  score: number;
  level: "LOW RISK" | "CAUTION" | "HIGH RISK";
}

export function calculateRiskScore(
  textScore: number,
  urlRisk: number,
): RiskResult {
  const score = Math.min(
    100,
    Math.max(0, Math.round(textScore * 0.7 + urlRisk * 0.3)),
  );

  const level =
    score >= 60 ? "HIGH RISK" : score >= 30 ? "CAUTION" : "LOW RISK";

  return { score, level };
}
