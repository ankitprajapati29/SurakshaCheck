
import { useRef, useState } from "react";
import { extractTextFromImage } from "../services/input/ocrInput";

interface ImageUploadProps {
  onTextExtracted: (text: string) => void;
  language?: "en" | "hi";
}

export default function ImageUpload({
  onTextExtracted,
  language = "en",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  const [extractedText, setExtractedText] = useState("");

  const isHindi = language === "hi";

  function removeImage() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview("");
    setExtractedText("");
    setError("");

    // Remove only the OCR text added by this image.
    if (extractedText) {
      onTextExtracted("");
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleImage(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(isHindi ? "Sahi image select karein." : "Select a valid image.");
      return;
    }

    if (preview) URL.revokeObjectURL(preview);

    setError("");
    setLoading(true);
    setPreview(URL.createObjectURL(file));
    setExtractedText("");

    try {
      const result = await extractTextFromImage(file);

      if (!result.text) {
        setError(
          isHindi
            ? "Text nahi mila. Clear screenshot try karein."
            : "No text found. Try a clearer screenshot.",
        );
      } else {
        setExtractedText(result.text);
        onTextExtracted(result.text);
      }
    } catch {
      setError(
        isHindi
          ? "OCR fail hua. Dobara try karein."
          : "OCR failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="image-upload">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(event) => {
          void handleImage(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />

      {preview ? (
        <div className="image-attachment">
          <img
            src={preview}
            alt={isHindi ? "Selected screenshot" : "Selected screenshot"}
            className="image-preview"
          />

          <button
            type="button"
            className="remove-image-button"
            onClick={removeImage}
            disabled={loading}
            aria-label={isHindi ? "Image हटाएँ" : "Remove image"}
            title={isHindi ? "Image हटाएँ" : "Remove image"}
          >
            ×
          </button>

          <span className="attachment-status">
            {loading
              ? isHindi
                ? "Text निकाला जा रहा है..."
                : "Extracting text..."
              : extractedText
                ? isHindi
                  ? "Text extract ho gaya"
                  : "Text extracted"
                : isHindi
                  ? "Screenshot selected"
                  : "Screenshot selected"}
          </span>
        </div>
      ) : (
        <button
          type="button"
          className="upload-trigger"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
        >
          <span aria-hidden="true">＋</span>
          {isHindi ? "Screenshot चुनें" : "Attach screenshot"}
        </button>
      )}

      {error && <p className="upload-error" role="alert">{error}</p>}
    </div>
  );
}
