const API_BASE_URL = "https://surakshacheck-api.onrender.com";

export async function analyzeWithBackend(message: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(`Analysis failed (${response.status})`);
  }

  const data: { analysis: string } = await response.json();
  return data.analysis;
}