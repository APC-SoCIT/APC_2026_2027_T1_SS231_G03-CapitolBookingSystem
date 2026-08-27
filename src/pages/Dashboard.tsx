import { Activity } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Pie, Bar, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  Filler,
);

type AnalyticsShape = {
  facebook: number;
  website: number;
  other?: number;
  types: {
    functionRoom: { facebook: number; website: number };
    delivery: { facebook: number; website: number };
    catering: { facebook: number; website: number };
  };
  inquiries: { new: number; resolved: number };
};

const ANALYTICS_FALLBACK: AnalyticsShape = {
  facebook: 120,
  website: 200,
  other: 15,
  types: {
    functionRoom: { facebook: 30, website: 50 },
    delivery: { facebook: 20, website: 90 },
    catering: { facebook: 70, website: 60 },
  },
  inquiries: { new: 12, resolved: 8 },
};

export function Dashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsShape | null>(null);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<number | null>(null);
  const defaultUrl = "/analytic_dashboard/mock_data.json";

  async function fetchAnalytics(url = defaultUrl) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("fetch failed");
      const payload = await res.json();
      setAnalytics(payload as AnalyticsShape);
    } catch (e) {
      console.warn("Analytics fetch error, using fallback", e);
      setAnalytics(ANALYTICS_FALLBACK);
    }
  }

  function startPolling(url = defaultUrl, interval = 10000) {
    if (pollRef.current) return;
    fetchAnalytics(url);
    pollRef.current = window.setInterval(() => fetchAnalytics(url), interval);
    setPolling(true);
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setPolling(false);
  }

  useEffect(() => {
    fetchAnalytics();
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalOrders = (d: AnalyticsShape) =>
    (d.facebook || 0) + (d.website || 0) + (d.other || 0);

  return (
    <div>
      <section className="page-hero dashboard-hero">
        <p className="eyebrow">Staff workspace</p>
        <h1>Dashboard</h1>
        <p>Track operational analytics.</p>
      </section>

      <section className="section dashboard-section">
        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <p className="eyebrow">Analytics · mock data</p>
              <h2>Operational Analytics</h2>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button
                className="button button--outline-light"
                type="button"
                onClick={() => fetchAnalytics()}
                style={{ padding: "0.45rem 0.85rem", fontSize: "0.8rem" }}
              >
                <Activity size={14} style={{ marginRight: 6 }} /> Refresh analytics
              </button>
              {!polling ? (
                <button
                  className="button button--red"
                  type="button"
                  onClick={() => startPolling()}
                  style={{ padding: "0.45rem 0.85rem", fontSize: "0.8rem" }}
                >
                  Start polling
                </button>
              ) : (
                <button
                  className="button button--outline-light"
                  type="button"
                  onClick={() => stopPolling()}
                  style={{ padding: "0.45rem 0.85rem", fontSize: "0.8rem" }}
                >
                  Stop polling
                </button>
              )}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
            className="analytics-grid"
          >
            <div
              className="card"
              style={{
                padding: "1rem",
                border: "1px solid rgba(100,0,0,0.08)",
                borderRadius: 8,
                background: "#fdfbf3",
              }}
            >
              <h3 style={{ margin: "0 0 0.75rem", color: "#640000", fontFamily: 'Georgia, "Times New Roman", serif', fontSize: "1rem" }}>
                Orders Source
              </h3>
              {analytics ? (
                <>
                  <Pie
                    data={{
                      labels: ["Facebook", "Website", "Other"],
                      datasets: [
                        {
                          data: [analytics.facebook, analytics.website, analytics.other || 0],
                          backgroundColor: ["#3b82f6", "#10b981", "#9ca3af"],
                        },
                      ],
                    }}
                  />
                  <div style={{ textAlign: "center", marginTop: 8, color: "#5a3a3a", fontSize: "0.85rem", fontWeight: 600 }}>
                    Total: {totalOrders(analytics)}
                  </div>
                </>
              ) : (
                <p style={{ color: "#8a5a5a", fontSize: "0.85rem" }}>Loading analytics...</p>
              )}
            </div>

            <div
              className="card"
              style={{
                padding: "1rem",
                border: "1px solid rgba(100,0,0,0.08)",
                borderRadius: 8,
                background: "#fdfbf3",
              }}
            >
              <h3 style={{ margin: "0 0 0.75rem", color: "#640000", fontFamily: 'Georgia, "Times New Roman", serif', fontSize: "1rem" }}>
                Order Types by Source (Stacked)
              </h3>
              {analytics ? (
                <Bar
                  options={{
                    responsive: true,
                    scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
                  }}
                  data={{
                    labels: ["Function Room", "Delivery", "Catering"],
                    datasets: [
                      {
                        label: "Facebook",
                        backgroundColor: "#3b82f6",
                        data: [
                          analytics.types.functionRoom.facebook,
                          analytics.types.delivery.facebook,
                          analytics.types.catering.facebook,
                        ],
                      },
                      {
                        label: "Website",
                        backgroundColor: "#10b981",
                        data: [
                          analytics.types.functionRoom.website,
                          analytics.types.delivery.website,
                          analytics.types.catering.website,
                        ],
                      },
                    ],
                  }}
                />
              ) : (
                <p style={{ color: "#8a5a5a", fontSize: "0.85rem" }}>Loading analytics...</p>
              )}
            </div>

            <div
              className="card"
              style={{
                gridColumn: "1 / -1",
                padding: "1rem",
                border: "1px solid rgba(100,0,0,0.08)",
                borderRadius: 8,
                background: "#fdfbf3",
              }}
            >
              <h3 style={{ margin: "0 0 0.75rem", color: "#640000", fontFamily: 'Georgia, "Times New Roman", serif', fontSize: "1rem" }}>
                Inquiry Tracking
              </h3>
              {analytics ? (
                <div>
                  <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                    <div
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        borderRadius: 6,
                        background: "#fff",
                        border: "1px solid rgba(100,0,0,0.08)",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ color: "#8a5a5a", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>New</div>
                      <div style={{ color: "#640000", fontSize: "1.25rem", fontWeight: 700 }}>{analytics.inquiries.new}</div>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        borderRadius: 6,
                        background: "#fff",
                        border: "1px solid rgba(100,0,0,0.08)",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ color: "#8a5a5a", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Resolved</div>
                      <div style={{ color: "#640000", fontSize: "1.25rem", fontWeight: 700 }}>{analytics.inquiries.resolved}</div>
                    </div>
                  </div>
                  <Line
                    options={{ responsive: true, plugins: { legend: { display: false } } }}
                    data={{
                      labels: ["Now"],
                      datasets: [
                        {
                          label: "New inquiries",
                          data: [analytics.inquiries.new],
                          borderColor: "#f97316",
                          backgroundColor: "rgba(249,115,22,0.15)",
                          fill: true,
                        },
                      ],
                    }}
                  />
                </div>
              ) : (
                <p style={{ color: "#8a5a5a", fontSize: "0.85rem" }}>Loading analytics...</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
