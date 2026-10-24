
import { useEffect, useRef, useState } from "react";

interface VoiceInputButtonProps {
  language: "en" | "hi";
  onTranscript: (text: string) => void;
}

interface SpeechResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
  resultIndex: number;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

export default function VoiceInputButton({
  language,
  onTranscript,
}: VoiceInputButtonProps) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const activeRef = useRef(false);

  useEffect(() => {
    return () => {
      activeRef.current = false;
      recognitionRef.current?.abort();
    };
  }, []);

  function toggleVoice() {
    setError("");

    if (listening) {
      activeRef.current = false;
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const browserWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

    const Recognition =
      browserWindow.SpeechRecognition ??
      browserWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setError(
        language === "hi"
          ? "Voice input is browser mein supported nahi hai. Chrome try karein."
          : "Voice input is not supported in this browser. Try Chrome.",
      );
      return;
    }

    try {
      const recognition = new Recognition();
      recognition.lang = language === "hi" ? "hi-IN" : "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .slice(event.resultIndex)
          .map((item) => item[0]?.transcript ?? "")
          .join(" ")
          .trim();

        if (transcript) onTranscript(transcript);
      };

      recognition.onerror = (event) => {
        activeRef.current = false;
        setListening(false);

        const messages: Record<string, string> = {
          "not-allowed":
            "Microphone permission denied. Allow microphone access in your browser.",
          "no-speech": "No speech detected. Please try again.",
          "network": "Speech recognition network error. Please try again.",
        };

        setError(
          language === "hi"
            ? event.error === "not-allowed"
              ? "Microphone permission allow karein."
              : event.error === "no-speech"
                ? "Awaaz detect nahi hui. Dobara try karein."
                : "Voice recognition fail hua. Dobara try karein."
            : messages[event.error] ??
                "Voice recognition failed. Please try again.",
        );
      };

      recognition.onend = () => {
        activeRef.current = false;
        setListening(false);
      };

      recognitionRef.current = recognition;
      activeRef.current = true;
      setListening(true);
      recognition.start();
    } catch {
      activeRef.current = false;
      setListening(false);
      setError("Could not start voice input. Please try again.");
    }
  }

  return (
    <div className="voice-control">
      <button
        type="button"
        className={`voice-button ${listening ? "is-listening" : ""}`}
        onClick={toggleVoice}
        aria-pressed={listening}
      >
        <span aria-hidden="true">{listening ? "■" : "🎙️"}</span>
        {listening
          ? language === "hi"
            ? "सुनना बंद करें"
            : "Stop listening"
          : language === "hi"
            ? "बोलकर मैसेज डालें"
            : "Speak your message"}
      </button>

      {listening && (
        <p className="voice-status" aria-live="polite">
          {language === "hi"
            ? "सुन रहा है… अब बोलें।"
            : "Listening… speak now."}
        </p>
      )}

      {error && (
        <p className="voice-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
