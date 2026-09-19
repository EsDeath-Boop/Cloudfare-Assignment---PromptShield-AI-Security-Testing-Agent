import { useEffect, useState } from "react";
import "./App.css";

interface ScanResult {
  success: boolean;
  scanId: string;
  status: string;
  score: number | null;
  grade: string | null;
  vulnerableTests: number | null;
  totalTests: number | null;
  report?: unknown;
  error?: string | null;
}

interface QuickScanResponse {
  success: boolean;
  score: number;
  grade: string;
  vulnerableTests: number;
  totalTests: number;
  results: unknown[];
  error?: string;
}

interface HistoryScan {
  id: string;
  status: string;
  score: number | null;
  grade: string | null;
  vulnerable_tests: number | null;
  total_tests: number | null;
  created_at: string;
  completed_at: string | null;
}

function App() {
  const [systemPrompt, setSystemPrompt] = useState("");
  const [attacksPerCategory, setAttacksPerCategory] = useState(1);

  const [scanId, setScanId] = useState<string | null>(null);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryScan[]>([]);

  async function loadHistory() {
    try {
      const response = await fetch("/api/scans");

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setHistory(data.scans ?? []);
    } catch {
      // History is supplementary; don't interrupt the main UI.
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function startQuickScan() {
  if (!systemPrompt.trim() || isScanning) {
    return;
  }

  setIsScanning(true);
  setError(null);
  setScan(null);
  setScanId(null);

  try {
    const response = await fetch("/api/test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemPrompt,
      }),
    });

    const data: QuickScanResponse = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to run quick scan.",
      );
    }

    setScan({
      success: data.success,
      scanId: `quick-${Date.now()}`,
      status: "complete",
      score: data.score,
      grade: data.grade,
      vulnerableTests: data.vulnerableTests,
      totalTests: data.totalTests,
      report: data.results,
    });
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Something went wrong.",
    );
  } finally {
    setIsScanning(false);
  }
}

  async function startDeepScan() {
    if (!systemPrompt.trim() || isScanning) {
      return;
    }

    setIsScanning(true);
    setError(null);
    setScan(null);
    setScanId(null);

    try {
      const response = await fetch("/api/deep-scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemPrompt,
          attacksPerCategory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start scan.");
      }

      setScanId(data.scanId);

      let completed = false;

      while (!completed) {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const statusResponse = await fetch(
          `/api/deep-scan/${data.scanId}`,
        );

        const statusData: ScanResult = await statusResponse.json();

        if (!statusResponse.ok) {
          throw new Error(
            statusData.error || "Failed to get scan status.",
          );
        }

        setScan(statusData);

        if (
          statusData.status === "complete" ||
          statusData.status === "failed"
        ) {
          completed = true;
        }
      }

      await loadHistory();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">P</div>
          <div>
            <h1>PromptShield</h1>
            <span>LLM Security Testing Agent</span>
          </div>
        </div>

        <div className="status">
          <span className="status-dot" />
          {isScanning ? "Scan Running" : "System Ready"}
        </div>
      </header>

      <main className="dashboard">
        <section className="hero">
          <div>
            <p className="eyebrow">AI SECURITY TESTING</p>

            <h2>Find vulnerabilities before attackers do.</h2>

            <p className="hero-text">
              Test your LLM system prompts against adversarial attacks,
              jailbreaks, prompt injection, and instruction manipulation.
            </p>
          </div>
        </section>

        <section className="scan-panel">
          <div className="panel-header">
            <div>
              <h3>Configure Security Scan</h3>
              <p>Enter the system prompt you want to test.</p>
            </div>
          </div>

          <label htmlFor="system-prompt">System Prompt</label>

          <textarea
            id="system-prompt"
            value={systemPrompt}
            onChange={(event) => setSystemPrompt(event.target.value)}
            placeholder="Example: You are a banking assistant. Only answer questions about our banking products..."
            disabled={isScanning}
          />

          <div className="controls">
            <div className="attack-control">
              <label htmlFor="attacks">Attacks per category</label>

              <select
                id="attacks"
                value={attacksPerCategory}
                onChange={(event) =>
                  setAttacksPerCategory(Number(event.target.value))
                }
                disabled={isScanning}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </div>

            <div className="scan-buttons">
              <button
                className="secondary-button"
                disabled={!systemPrompt.trim() || isScanning}
                onClick={startQuickScan}
              >
                Quick Scan
              </button>

              <button
                className="primary-button"
                disabled={!systemPrompt.trim() || isScanning}
                onClick={startDeepScan}
              >
                <span>✦</span>
                {isScanning ? "Scanning..." : "Deep Scan"}
              </button>
            </div>
          </div>

          {scanId && (
            <div className="scan-status">
              Scan ID: <code>{scanId}</code>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </section>

        <section className="results-grid">
          <div className="result-card">
            <span className="card-label">SECURITY SCORE</span>

            <strong>
              {scan?.score ?? "—"}
            </strong>

            <span className="muted">
              {scan
                ? `${scan.vulnerableTests ?? 0} vulnerable of ${
                    scan.totalTests ?? 0
                  } tests`
                : "No scan completed"}
            </span>
          </div>

          <div className="result-card">
            <span className="card-label">RISK LEVEL</span>

            <strong>
              {scan?.grade ?? "—"}
            </strong>

            <span className="muted">
              {scan
                ? scan.status
                : "Waiting for scan"}
            </span>
          </div>

          <div className="result-card">
            <span className="card-label">SCAN STATUS</span>

            <strong>
              {scan?.status ?? "Ready"}
            </strong>

            <span className="muted">
              {scanId
                ? "Workflow assessment"
                : "No active scan"}
            </span>
          </div>
        </section>

        <section className="history-panel">
          <div className="panel-header">
            <div>
              <h3>Recent Scans</h3>
              <p>Your latest PromptShield assessments.</p>
            </div>

            <span className="history-count">
              {history.length} scans
            </span>
          </div>

          <div className="scan-table">
            <div className="table-row table-heading">
              <span>SCAN ID</span>
              <span>STATUS</span>
              <span>SCORE</span>
              <span>RISK</span>
              <span>TESTS</span>
            </div>

            {history.length === 0 ? (
              <div className="table-row">
                <span className="scan-id">
                  No scans found
                </span>
                <span>—</span>
                <span>—</span>
                <span>—</span>
                <span>—</span>
              </div>
            ) : (
              history.map((item) => (
                <div className="table-row" key={item.id}>
                  <span className="scan-id">
                    {item.id.slice(0, 8)}...
                    {item.id.slice(-5)}
                  </span>

                  <span
                    className={`badge ${
                      item.status === "complete"
                        ? "complete"
                        : "running"
                    }`}
                  >
                    {item.status}
                  </span>

                  <span>{item.score ?? "—"}</span>

                  <span>{item.grade ?? "—"}</span>

                  <span>
                    {item.vulnerable_tests ?? "—"} /{" "}
                    {item.total_tests ?? "—"}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <footer>
        PromptShield · Powered by Cloudflare Workers AI
      </footer>
    </div>
  );
}

export default App;

