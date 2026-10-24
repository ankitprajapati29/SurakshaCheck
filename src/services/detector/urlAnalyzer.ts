
export interface UrlAnalysis {
  urls: string[];
  suspiciousUrls: string[];
  reasonsEn: string[];
  reasonsHi: string[];
}

const SHORTENERS = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "is.gd",
  "cutt.ly",
  "rb.gy",
  "shorturl.at",
  "rebrand.ly",
  "ow.ly",
];

const SUSPICIOUS_TLDS = [
  ".xyz",
  ".top",
  ".click",
  ".work",
  ".buzz",
  ".rest",
  ".fit",
  ".gq",
  ".tk",
];

const BRAND_NAMES = [
  "google",
  "microsoft",
  "amazon",
  "paypal",
  "sbi",
  "hdfc",
  "icici",
  "paytm",
  "phonepe",
];

const TRUSTED_EXACT_HOSTS = [
  "google.com",
  "microsoft.com",
  "amazon.com",
  "paypal.com",
  "sbi.co.in",
  "onlinesbi.sbi",
  "hdfcbank.com",
  "icicibank.com",
  "paytm.com",
  "phonepe.com",
];

function isIpAddress(hostname: string): boolean {
  const parts = hostname.split(".");

  return (
    parts.length === 4 &&
    parts.every(
      (part) =>
        /^\d{1,3}$/.test(part) &&
        Number(part) >= 0 &&
        Number(part) <= 255,
    )
  );
}

function isTrustedExactHost(hostname: string): boolean {
  return TRUSTED_EXACT_HOSTS.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`),
  );
}

export function analyzeUrls(text: string): UrlAnalysis {
  const matches =
    text.match(/\b(?:https?:\/\/|www\.)[^\s<>"']+/gi) ?? [];

  const urls = [
    ...new Set(
      matches.map((url) =>
        url.replace(/[),.!?;:]+$/, ""),
      ),
    ),
  ];

  const suspiciousUrls: string[] = [];
  const reasonsEn: string[] = [];
  const reasonsHi: string[] = [];

  for (const rawUrl of urls) {
    let parsedUrl: URL;

    try {
      const normalized = rawUrl.toLowerCase().startsWith("www.")
        ? `https://${rawUrl}`
        : rawUrl;

      parsedUrl = new URL(normalized);
    } catch {
      suspiciousUrls.push(rawUrl);
      reasonsEn.push("A link could not be parsed reliably.");
      reasonsHi.push(
        "Ek link ko sahi tarah verify nahi kiya ja saka.",
      );
      continue;
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    const labels = hostname.split(".");
    const flagsEn: string[] = [];
    const flagsHi: string[] = [];

    const isShortened = SHORTENERS.includes(hostname);

    const hasSuspiciousTld = SUSPICIOUS_TLDS.some(
      (tld) => hostname.endsWith(tld),
    );

    const containsBrandName = BRAND_NAMES.some((brand) =>
      labels.some((label) => label.includes(brand)),
    );

    const hasBrandImpersonation =
      containsBrandName && !isTrustedExactHost(hostname);

    const hasAtSymbol = parsedUrl.username !== "" ||
      parsedUrl.password !== "";

    const usesIpAddress = isIpAddress(hostname);

    if (isShortened) {
      flagsEn.push("The URL uses a link-shortening service.");
      flagsHi.push("Link shortener use hua hai; asli destination check nahi hai.");
    }

    if (hasSuspiciousTld) {
      flagsEn.push(
        "The URL uses a top-level domain that deserves extra scrutiny.",
      );
      flagsHi.push(
        "Link ka domain extension extra verification ke layak hai.",
      );
    }

    if (hasBrandImpersonation) {
      flagsEn.push(
        "The URL contains a known brand name on a domain that may not belong to that brand.",
      );
      flagsHi.push(
        "Link mein known brand ka naam hai, lekin domain official na bhi ho sakta hai.",
      );
    }

    if (hasAtSymbol) {
      flagsEn.push(
        "The URL contains user-information syntax that can obscure its destination.",
      );
      flagsHi.push(
        "Link ka format asli destination ko chhupa sakta hai.",
      );
    }

    if (usesIpAddress) {
      flagsEn.push(
        "The link uses an IP address instead of a conventional domain name.",
      );
      flagsHi.push(
        "Link mein normal domain ke bajay IP address hai.",
      );
    }

    if (flagsEn.length > 0) {
      suspiciousUrls.push(rawUrl);
      reasonsEn.push(...flagsEn);
      reasonsHi.push(...flagsHi);
    }
  }

  return {
    urls,
    suspiciousUrls: [...new Set(suspiciousUrls)],
    reasonsEn: [...new Set(reasonsEn)],
    reasonsHi: [...new Set(reasonsHi)],
  };
}
