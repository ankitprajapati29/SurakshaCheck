
export interface ScamKeywordRule {
  id: string;
  patterns: string[];
  reasonEn: string;
  reasonHi: string;
  weight: number;
}

export const keywordsEn: ScamKeywordRule[] = [
  {
    id: "credential_request",
    patterns: [
      "share otp",
      "send otp",
      "enter otp",
      "verify otp",
      "otp",
      "password",
      "passcode",
      "pin",
      "cvv",
      "bank details",
      "card details",
      "internet banking details",
      "login credentials",
    ],
    reasonEn:
      "The message mentions OTPs, credentials, or sensitive financial information.",
    reasonHi:
      "Message mein OTP, password, PIN ya financial details ka zikr hai.",
    weight: 30,
  },
  {
    id: "account_threat",
    patterns: [
      "bank account is blocked",
      "your account is blocked",
      "account has been blocked",
      "account blocked",
      "bank account blocked",
      "account is suspended",
      "account suspended",
      "account will be closed",
      "account will be blocked",
      "account will be suspended",
      "account deactivated",
      "bank account deactivated",
      "verify your bank account",
      "verify account",
      "verify your account immediately",
      "kyc expired",
      "kyc update required",
      "update your kyc",
      "complete your kyc",
      "pan card blocked",
      "debit card blocked",
      "credit card blocked",
    ],
    reasonEn:
      "The message threatens account suspension or requests urgent account/KYC verification.",
    reasonHi:
      "Message account block, suspension ya KYC verification ka pressure bana raha hai.",
    weight: 25,
  },
  {
    id: "urgency",
    patterns: [
      "immediately",
      "urgent",
      "act now",
      "within 24 hours",
      "last warning",
      "limited time",
      "right now",
      "without delay",
      "final warning",
      "expires today",
      "today only",
      "immediate action required",
    ],
    reasonEn:
      "The message creates urgency or pressures the recipient to act quickly.",
    reasonHi:
      "Message jaldi action lene ka pressure bana raha hai.",
    weight: 15,
  },
  {
    id: "prize_scam",
    patterns: [
      "you have won",
      "you won",
      "winner",
      "lottery",
      "claim your prize",
      "free gift",
      "claim now",
      "cash prize",
      "lucky draw",
      "congratulations you have won",
      "reward pending",
    ],
    reasonEn:
      "The message contains a prize or reward claim that may be used in scams.",
    reasonHi:
      "Message mein suspicious prize, lottery ya reward claim hai.",
    weight: 25,
  },
  {
    id: "payment_pressure",
    patterns: [
      "send money",
      "pay processing fee",
      "pay the processing fee",
      "processing fee",
      "fee now",
      "to receive your cash prize",
      "transfer money",
      "refund fee",
      "payment required",
      "pay now",
      "pay immediately",
      "send payment",
      "deposit money",
      "upi payment",
      "pay to receive",
      "account verification fee",
    ],
    reasonEn:
      "The message requests payment or pressures the recipient to transfer money.",
    reasonHi:
      "Message payment ya money transfer karne ka pressure bana raha hai.",
    weight: 25,
  },
  {
    id: "suspicious_link",
    patterns: [
      "click here",
      "click this link",
      "open this link",
      "verify using this link",
      "verify through this link",
      "click the link",
      "visit this link",
      "login here",
      "update details here",
      "verify now at",
    ],
    reasonEn:
      "The message encourages the recipient to open a link or submit information through it.",
    reasonHi:
      "Message link kholne ya uske through information dene ke liye keh raha hai.",
    weight: 15,
  },
];
