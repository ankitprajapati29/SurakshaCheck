
import { keywordsEn } from "../../data/entities/keywordsEn";
import { keywordsHi } from "../../data/entities/keywordsHi";

export interface TextAnalysis {
  matchedRuleIds: string[];
  score: number;
  reasonsEn: string[];
  reasonsHi: string[];
}

export function analyzeText(text: string): TextAnalysis {
  const normalized = text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  const rules = [...keywordsEn, ...keywordsHi];

  const matchedRules = rules.filter((rule) =>
    rule.patterns.some((pattern) =>
      normalized.includes(
        pattern.normalize("NFKC").toLowerCase().trim(),
      ),
    ),
  );

  // Count each rule only once, even if multiple patterns match.
  const uniqueRules = [
    ...new Map(matchedRules.map((rule) => [rule.id, rule])).values(),
  ];

  const rawScore = uniqueRules.reduce(
    (total, rule) => total + rule.weight,
    0,
  );

  return {
    matchedRuleIds: uniqueRules.map((rule) => rule.id),
    score: Math.min(100, rawScore),
    reasonsEn: uniqueRules.map((rule) => rule.reasonEn),
    reasonsHi: uniqueRules.map((rule) => rule.reasonHi),
  };
}
