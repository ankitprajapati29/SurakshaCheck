
import { useState } from "react";
import "./App.css";
import { analyzeMessage as runDetection } from "./services/detector/ruleEngine";
import { analyzeWithBackend } from "./services/backendClient";
import ImageUpload from "./components/ImageUpload";
import VoiceInputButton from "./components/VoiceInputButton";
import { speakText, stopSpeaking } from "./services/output/textToSpeech";

type Language = "en" | "hi";

function getRecommendedActions(
  level: string,
  score: number,
  hasSuspiciousUrl: boolean,
  isHindi: boolean,
): string[] {
  const normalizedLevel = level.toLowerCase();
  const isHigh = normalizedLevel.includes("high") || score >= 70;
  const isMedium =
    normalizedLevel.includes("medium") || score >= 35;

  const actions: string[] = [];

  if (isHigh) {
    actions.push(
      isHindi
        ? "इस मैसेज पर भरोसा न करें और भेजने वाले की स्वतंत्र रूप से पुष्टि करें।"
        : "Do not trust this message immediately. Independently verify the sender.",
      isHindi
        ? "लिंक पर क्लिक न करें और भुगतान करने से पहले जाँच करें।"
        : "Avoid clicking message links and verify before making any payment.",
    );
  } else if (isMedium) {
    actions.push(
      isHindi
        ? "भेजने वाले की पहचान और मैसेज के दावों की पुष्टि करें।"
        : "Verify the sender's identity and the claims in the message.",
      isHindi
        ? "भुगतान या निजी जानकारी साझा करने से पहले रुकें।"
        : "Pause before making payments or sharing personal information.",
    );
  } else {
    actions.push(
      isHindi
        ? "कम स्कोर सुरक्षा की गारंटी नहीं है; भेजने वाले की पुष्टि करें।"
        : "A low score does not guarantee safety; verify the sender.",
      isHindi
        ? "अनजान मैसेज के लिंक सावधानी से जाँचें।"
        : "Carefully review links in unfamiliar messages.",
    );
  }

  if (hasSuspiciousUrl) {
    actions.push(
      isHindi
        ? "संदिग्ध लिंक न खोलें। वेबसाइट का पता आधिकारिक स्रोत से जाँचें।"
        : "Do not open suspicious links. Verify the website through an official source.",
    );
  }

  actions.push(
    isHindi
      ? "OTP, UPI PIN, पासवर्ड या बैंक की गोपनीय जानकारी साझा न करें।"
      : "Never share your OTP, UPI PIN, password, or confidential banking details.",
  );

  if (isHigh || isMedium) {
    actions.push(
      isHindi
        ? "भारत में साइबर वित्तीय धोखाधड़ी होने पर 1930 पर संपर्क करें।"
        : "If financial cyber fraud has occurred in India, contact 1930 and report it at cybercrime.gov.in.",
    );
  }

  return actions;
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function App() {
  const [language, setLanguage] = useState<Language>("en");
  const [message, setMessage] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [result, setResult] = useState<ReturnType<typeof runDetection> | null>(null);
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");

  const isHindi = language === "hi";

  const recommendations = result
    ? getRecommendedActions(
        result.level,
        result.score,
        result.suspiciousUrls.length > 0,
        isHindi,
      )
    : [];

  async function handleAnalyze() {
    const input = message.trim();

    if (!input) {
      setError(
        isHindi
          ? "पहले मैसेज पेस्ट करें या स्क्रीनशॉट अपलोड करें।"
          : "Please enter a message or upload a screenshot first.",
      );
      setResult(null);
      setAiAnalysis("");
      return;
    }

    stopSpeaking();
    setError("");
    setAiAnalysis("");
    setResult(null);
    setIsAnalyzing(true);

    // Local checks remain available even if the backend is unavailable.
    const localResult = runDetection(input);
    setResult(localResult);

    try {
      const analysis = await analyzeWithBackend(input);
      setAiAnalysis(analysis);
    } catch (err) {
      console.error("Gemini backend request failed:", err);
      setError(
        isHindi
          ? "स्थानीय जाँच पूरी हुई, लेकिन AI सर्वर से जवाब नहीं मिला।"
          : "Local check completed, but the AI server did not respond. Check the backend deployment and API configuration.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  function clearMessage() {
    stopSpeaking();
    setMessage("");
    setOcrText("");
    setResult(null);
    setAiAnalysis("");
    setError("");
  }

  function handleExtractedText(text: string) {
    if (!text) {
      setMessage((previous) =>
        ocrText ? previous.replace(ocrText, "").trim() : previous,
      );
      setOcrText("");
    } else {
      setMessage((previous) =>
        previous.trim() ? `${previous}\n${text}` : text,
      );
      setOcrText(text);
    }

    setResult(null);
    setAiAnalysis("");
    setError("");
  }

  function handleVoiceTranscript(transcript: string) {
    setMessage((previous) =>
      previous.trim() ? `${previous}\n${transcript}` : transcript,
    );
    setResult(null);
    setAiAnalysis("");
    setError("");
  }

  function handleSpeakResult() {
    if (!result) return;

    const reasons = (
      isHindi ? result.reasonsHi : result.reasonsEn
    ).join(". ");

    const actions = recommendations.join(". ");
    const resultText = isHindi
      ? `जाँच का परिणाम: ${result.level}। रिस्क स्कोर 100 में से ${result.score}। चेतावनी संकेत: ${reasons}। AI विश्लेषण: ${aiAnalysis}। सुझाव: ${actions}`
      : `Analysis result: ${result.level}. Risk score ${result.score} out of 100. Warning signs: ${reasons}. AI analysis: ${aiAnalysis}. Recommended actions: ${actions}`;

    const started = speakText(resultText, language);

    if (!started) {
      setError(
        isHindi
          ? "इस ब्राउज़र में आवाज़ की सुविधा उपलब्ध नहीं है।"
          : "Text-to-speech is not supported in this browser.",
      );
    } else {
      setError("");
    }
  }

  const riskClass = result
    ? result.level.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    : "";

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="SurakshaCheck home">
          <span className="brand-icon"><ShieldIcon /></span>
          <span>
            <strong>SurakshaCheck</strong>
            <small>{isHindi ? "डिजिटल सुरक्षा सहायक" : "Digital Safety Assistant"}</small>
          </span>
        </a>

        <button
          className="language-toggle"
          type="button"
          onClick={() => {
            stopSpeaking();
            setLanguage(isHindi ? "en" : "hi");
            setError("");
          }}
        >
          {isHindi ? "English" : "हिन्दी"}
        </button>
      </header>

      <main className="main-content">
        <section className="hero">
          <span className="eyebrow">
            <span className="status-dot" />
            {isHindi ? "आपकी डिजिटल सुरक्षा" : "YOUR DIGITAL SAFETY"}
          </span>

          <h1>
            {isHindi ? (
              <>किसी भी मैसेज को<br /><span>जाँचें, फिर भरोसा करें।</span></>
            ) : (
              <>Check before<br /><span>you trust.</span></>
            )}
          </h1>

          <p>
            {isHindi
              ? "संदिग्ध SMS, WhatsApp मैसेज या लिंक की जाँच करें।"
              : "Check suspicious SMS, WhatsApp messages and links for common scam warning signs."}
          </p>
        </section>

        <section className="analyzer-panel">
          <div className="panel-heading">
            <div>
              <span className="step-label">
                {isHindi ? "मैसेज विश्लेषण" : "MESSAGE ANALYSIS"}
              </span>
              <h2>{isHindi ? "क्या जाँचना चाहते हैं?" : "What would you like to check?"}</h2>
            </div>

            <span className="privacy-badge">
              <ShieldIcon />
              {isHindi ? "लोकल + AI जाँच" : "Local + AI check"}
            </span>
          </div>

          <label htmlFor="message-input">
            {isHindi ? "संदिग्ध मैसेज या लिंक" : "Suspicious message or link"}
          </label>

          <div className="message-composer">
            <textarea
              id="message-input"
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                setError("");
                setResult(null);
                setAiAnalysis("");
              }}
              placeholder={
                isHindi
                  ? "यहाँ SMS, WhatsApp मैसेज या लिंक पेस्ट करें..."
                  : "Paste an SMS, WhatsApp message or link here..."
              }
              rows={6}
            />

            <div className="composer-toolbar">
              <div className="composer-tools">
                <div className="composer-tool">
                  <ImageUpload language={language} onTextExtracted={handleExtractedText} />
                </div>
                <div className="composer-tool">
                  <VoiceInputButton language={language} onTranscript={handleVoiceTranscript} />
                </div>
              </div>

              <span className="character-count">
                {message.length} {isHindi ? "अक्षर" : "characters"}
              </span>
            </div>
          </div>

          <div className="input-footer">
            <span className="input-hint">
              {isHindi
                ? "टेक्स्ट टाइप करें, बोलें या स्क्रीनशॉट चुनें"
                : "Type, speak, or select a screenshot"}
            </span>

            {message.length > 0 && (
              <button className="text-button" type="button" onClick={clearMessage}>
                {isHindi ? "साफ़ करें" : "Clear"}
              </button>
            )}
          </div>

          {error && <p role="alert" className="result-disclaimer">{error}</p>}

          <button
            className="analyze-button"
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            <SearchIcon />
            <span>
              {isAnalyzing
                ? (isHindi ? "जाँच हो रही है..." : "Analyzing...")
                : (isHindi ? "मैसेज की जाँच करें" : "Analyze message")}
            </span>
            <ArrowIcon />
          </button>

          <p className="privacy-note">
            <ShieldIcon />
            {isHindi
              ? "मैसेज AI विश्लेषण के लिए सर्वर पर भेजा जाता है। संवेदनशील जानकारी न भेजें।"
              : "Your message is sent to the AI server for analysis. Do not submit sensitive personal or banking information."}
          </p>
        </section>

        {result && (
          <section className={`result-panel risk-${riskClass}`} aria-live="polite">
            <div className="result-top">
              <div>
                <span className="step-label">
                  {isHindi ? "जाँच का परिणाम" : "ANALYSIS RESULT"}
                </span>
                <h2>{result.level}</h2>
                <p className="section-description">
                  {isHindi
                    ? "आपके मैसेज का शुरुआती सुरक्षा विश्लेषण"
                    : "A preliminary safety analysis of your message"}
                </p>
              </div>

              <div className="score-circle">
                <strong>{result.score}</strong>
                <span>/100</span>
              </div>
            </div>

            <div
              className="score-track"
              role="progressbar"
              aria-label={isHindi ? "रिस्क स्कोर" : "Risk score"}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={result.score}
            >
              <div className="score-fill" style={{
                width: `${Math.min(100, Math.max(0, result.score))}%`,
              }} />
            </div>

            <section className="explanation-section">
              <h3>{isHindi ? "यह मैसेज संदिग्ध क्यों है?" : "Why is this suspicious?"}</h3>
              <p className="section-description">
                {isHindi
                  ? "ये संकेत स्थानीय जाँच के दौरान मिले हैं:"
                  : "These warning signs were found during the local rule-based check:"}
              </p>

              {result.reasonsEn.length > 0 ? (
                <ul className="reason-list">
                  {(isHindi ? result.reasonsHi : result.reasonsEn).map((reason, index) => (
                    <li key={`${index}-${reason}`}>{reason}</li>
                  ))}
                </ul>
              ) : (
                <p>
                  {isHindi
                    ? "कोई स्पष्ट चेतावनी संकेत नहीं मिला। इससे मैसेज सुरक्षित साबित नहीं होता।"
                    : "No clear warning signs were detected. This does not prove the message is safe."}
                </p>
              )}

              {result.detectedUrls.length > 0 && (
                <div className="detected-links">
                  <h3>{isHindi ? "मैसेज में मिले लिंक" : "Links found in message"}</h3>
                  <ul>
                    {result.detectedUrls.map((url) => (
                      <li key={url}>
                        <code>{url}</code>
                        {result.suspiciousUrls.includes(url) && (
                          <strong className="url-warning">
                            {" "}— {isHindi ? "जाँचने योग्य" : "Needs review"}
                          </strong>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {aiAnalysis && (
              <section className="explanation-section ai-analysis-section">
                <h3>{isHindi ? "Gemini AI विश्लेषण" : "Gemini AI Analysis"}</h3>
                <p className="section-description">
                  {isHindi
                    ? "AI द्वारा दिया गया अतिरिक्त मार्गदर्शन:"
                    : "Additional guidance generated by the AI service:"}
                </p>
                <div className="ai-analysis-text">
                  {aiAnalysis}
                </div>
              </section>
            )}

            <section className="recommendations-section">
              <h3>{isHindi ? "अब आपको क्या करना चाहिए?" : "What should you do next?"}</h3>
              <p className="section-description">
                {isHindi
                  ? "अपनी सुरक्षा के लिए इन सुझावों का पालन करें:"
                  : "Follow these practical steps to protect yourself:"}
              </p>

              <ol className="recommendation-list">
                {recommendations.map((action, index) => (
                  <li key={`${index}-${action}`}>
                    <span className="recommendation-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ol>
            </section>

            <p className="result-disclaimer">
              {isHindi
                ? "स्कोर और लिंक संकेत स्थानीय नियमों पर आधारित हैं। Gemini का विश्लेषण अतिरिक्त मार्गदर्शन है। कोई भी परिणाम सुरक्षा की गारंटी नहीं देता।"
                : "The score and URL signals come from local rule-based checks. Gemini provides additional guidance. No result guarantees safety."}
            </p>

            <div className="speech-actions">
              <button type="button" className="voice-button" onClick={handleSpeakResult}>
                {isHindi ? "रिज़ल्ट और सुझाव सुनें" : "Listen to result"}
              </button>
              <button type="button" className="text-button" onClick={stopSpeaking}>
                {isHindi ? "आवाज़ रोकें" : "Stop audio"}
              </button>
            </div>
          </section>
        )}

        <section className="safety-tips">
          <span className="step-label">{isHindi ? "सुरक्षा के सुझाव" : "STAY SAFE"}</span>
          <h2>{isHindi ? "तीन बातें याद रखें" : "Three things to remember"}</h2>

          <div className="tips-grid">
            <article className="tip">
              <span className="tip-number">01</span>
              <h3>{isHindi ? "OTP साझा न करें" : "Protect your OTP"}</h3>
              <p>
                {isHindi
                  ? "अपना OTP, PIN या पासवर्ड किसी के साथ साझा न करें।"
                  : "Never share your OTP, PIN or password with anyone."}
              </p>
            </article>

            <article className="tip">
              <span className="tip-number">02</span>
              <h3>{isHindi ? "लिंक जाँचें" : "Check links"}</h3>
              <p>
                {isHindi
                  ? "अनजान लिंक खोलने से पहले भेजने वाले की पुष्टि करें।"
                  : "Verify the sender before opening unfamiliar links."}
              </p>
            </article>

            <article className="tip">
              <span className="tip-number">03</span>
              <h3>{isHindi ? "जल्दबाज़ी न करें" : "Avoid urgency"}</h3>
              <p>
                {isHindi
                  ? "इनाम या अकाउंट बंद होने की धमकी पर तुरंत भरोसा न करें।"
                  : "Do not rush because of prize claims or account-block threats."}
              </p>
            </article>
          </div>
        </section>

        <footer className="app-footer">
          <strong>SurakshaCheck</strong>
          <p>{isHindi ? "आपकी जागरूकता, आपकी सुरक्षा।" : "Stay aware. Stay protected."}</p>
          <small>
            {isHindi
              ? "यह टूल जागरूकता के लिए है, सुरक्षा की गारंटी नहीं देता।"
              : "This tool supports awareness and does not guarantee safety."}
          </small>
        </footer>
      </main>
    </div>
  );
}

export default App;
