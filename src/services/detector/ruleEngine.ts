
import { analyzeText } from "./textAnalyzer";
import { analyzeUrls } from "./urlAnalyzer";
import { calculateRiskScore } from "./scoring";

export interface DetectionResult {
  score: number;
  level: "LOW RISK" | "CAUTION" | "HIGH RISK";
  reasonsEn: string[];
  reasonsHi: string[];
  detectedUrls: string[];
  suspiciousUrls: string[];
}

export function analyzeMessage(text: string): DetectionResult {
  const textResult = analyzeText(text);
  const urlResult = analyzeUrls(text);

  const matchedRules = new Set(textResult.matchedRuleIds);

  const hasUrl = urlResult.urls.length > 0;
  const hasAccountThreat = matchedRules.has("account_threat");
  const hasUrgency = matchedRules.has("urgency");
  const hasPrizeClaim = matchedRules.has("prize_scam");
  const hasPaymentPressure = matchedRules.has("payment_pressure");
  const hasCredentialRequest = matchedRules.has("credential_request");

  const hasCredentialRule = matchedRules.has("credential_request");
  const hasCredentialRuleHi = matchedRules.has("credential_request_hi");
  const hasAccountThreatHi = matchedRules.has("account_threat_hi");
  const hasUrgencyHi = matchedRules.has("urgency_hi");

  const credentialDetected = hasCredentialRequest || hasCredentialRuleHi;
  const accountThreatDetected = hasAccountThreat || hasAccountThreatHi;
  const urgencyDetected = hasUrgency || hasUrgencyHi;

  const urlRisk =
    urlResult.suspiciousUrls.length > 0
      ? Math.min(100, urlResult.suspiciousUrls.length * 50)
      : hasUrl
        ? 20
        : 0;

  let contextBonus = 0;

  const reasonsEn = [
    ...textResult.reasonsEn,
    ...urlResult.reasonsEn,
  ];

  const reasonsHi = [
    ...textResult.reasonsHi,
    ...urlResult.reasonsHi,
  ];

  if (accountThreatDetected && urgencyDetected && credentialDetected) {
    contextBonus += 30;
    reasonsEn.push(
      "An account threat, urgency, and a request for sensitive credentials appear together. Never share OTPs or passwords.",
    );
    reasonsHi.push(
      "Account block ki warning, jaldi action ka pressure aur OTP/password ki demand ek saath hain. OTP ya password share na karein.",
    );
  }

  if (accountThreatDetected && urgencyDetected && hasUrl) {
    contextBonus += 25;
    reasonsEn.push(
      "An account threat, urgency, and a link appear together. Verify through the bank's official channel.",
    );
    reasonsHi.push(
      "Account block ki warning, jaldi action ka pressure aur link ek saath hain. Bank ke official channel se verify karein.",
    );
  } else if (accountThreatDetected && hasUrl) {
    contextBonus += 15;
    reasonsEn.push(
      "An account-related warning includes a link. Verify it independently before opening.",
    );
    reasonsHi.push(
      "Account se judi warning ke saath link hai. Khole bina official channel se verify karein.",
    );
  }

  if (hasPrizeClaim && hasPaymentPressure) {
    contextBonus += 20;
    reasonsEn.push(
      "A prize or reward claim is combined with a payment request, a common scam warning sign.",
    );
    reasonsHi.push(
      "Prize ya reward ke claim ke saath payment maangi ja rahi hai. Ye scam ka warning sign ho sakta hai.",
    );
  }

  if (hasPrizeClaim && hasPaymentPressure && hasUrgency && hasUrl) {
    contextBonus += 15;
    reasonsEn.push(
      "Prize, payment pressure, urgency, and a link appear together. Do not pay before independently verifying the claim.",
    );
    reasonsHi.push(
      "Prize, payment ka pressure, urgency aur link ek saath hain. Claim verify kiye bina paise na bhejein.",
    );
  }

  if (credentialDetected && hasUrl) {
    contextBonus += 15;
    reasonsEn.push(
      "A message mentioning sensitive credentials also contains a link. Never share OTPs, PINs, or passwords through it.",
    );
    reasonsHi.push(
      "Sensitive details se judi message mein link bhi hai. OTP, PIN ya password share na karein.",
    );
  }

  const adjustedTextScore = Math.min(
    100,
    textResult.score + contextBonus,
  );

  const risk = calculateRiskScore(adjustedTextScore, urlRisk);

  if (reasonsEn.length === 0) {
    reasonsEn.push(
      "No configured suspicious pattern was found. This does not guarantee the message is safe.",
    );
    reasonsHi.push(
      "Koi configured suspicious pattern nahi mila. Iska matlab message guaranteed safe nahi hai.",
    );
  }

  return {
    score: risk.score,
    level: risk.level,
    reasonsEn: [...new Set(reasonsEn)],
    reasonsHi: [...new Set(reasonsHi)],
    detectedUrls: urlResult.urls,
    suspiciousUrls: urlResult.suspiciousUrls,
  };
}
