import { useEffect, useRef, useState, useCallback } from "react";
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
import {
  Activity,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  ShoppingBag,
  MessageSquare,
  CheckCircle,
} from "lucide-react";

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
  other: number;
  types: {
    functionRoom: { facebook: number; website: number };
    delivery: { facebook: number; website: number };
    catering: { facebook: number; website: number };
  };
  inquiries: { new: number; resolved: number };
};

type InquiryHistoryEntry = { time: string; value: number };
type OrderHistoryEntry = { time: string; total: number };

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function Dashboard() {
  const [data, setData] = useState<AnalyticsShape | null>(null);
  const [inquiryHistory, setInquiryHistory] = useState<InquiryHistoryEntry[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderHistoryEntry[]>([]);
  const [polling, setPolling] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const pollRef = useRef<number | null>(null);
  const clockRef = useRef<number | null>(null);
  const dataRef = useRef<AnalyticsShape | null>(null);
  const defaultUrl = "/analytic_dashboard/mock_data.json";

  // Keep a ref in sync with state for simulation callback
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Live clock
  useEffect(() => {
    clockRef.current = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => {
      if (clockRef.current) clearInterval(clockRef.current);
    };
  }, []);

  const simulateUpdate = useCallback((current: AnalyticsShape): AnalyticsShape => {
    const fbInc = Math.random() < 0.6 ? Math.floor(Math.random() * 3) : 0;
    const webInc = Math.random() < 0.7 ? Math.floor(Math.random() * 3) : 0;
    const otherInc = Math.random() < 0.2 ? Math.floor(Math.random() * 2) : 0;

    const newFacebook = current.facebook + fbInc;
    const newWebsite = current.website + webInc;
    const newOther = current.other + otherInc;

    const types = { ...current.types };
    (["functionRoom", "delivery", "catering"] as const).forEach((t) => {
      const addFb = Math.random() < 0.4 ? Math.floor(Math.random() * 2) : 0;
      const addWeb = Math.random() < 0.5 ? Math.floor(Math.random() * 2) : 0;
      types[t] = {
        facebook: current.types[t].facebook + addFb,
        website: current.types[t].website + addWeb,
      };
    });

    const newInquiries = Math.random() < 0.5 ? Math.floor(Math.random() * 2) : 0;
    const resolved = Math.random() < 0.3 ? Math.floor(Math.random() * 2) : 0;

    return {
      facebook: newFacebook,
      website: newWebsite,
      other: Math.max(0, newOther),
      types,
      inquiries: {
        new: current.inquiries.new + newInquiries,
        resolved: current.inquiries.resolved + resolved,
      },
    };
  }, []);

  // Fetch initial data
  useEffect(() => {
    let cancelled = false;

    async function fetchInitial() {
      try {
        const res = await fetch(defaultUrl);
        if (!res.ok) throw new Error("fetch failed");
        const payload = (await res.json()) as AnalyticsShape;
        if (!cancelled) {
          setData(payload);
          setLastUpdated(new Date());
          const ts = new Date().toLocaleTimeString();
          setInquiryHistory([{ time: ts, value: payload.inquiries.new }]);
          const total = payload.facebook + payload.website + (payload.other || 0);
          setOrderHistory([{ time: ts, total }]);
        }
      } catch (e) {
        console.warn("Analytics fetch error", e);
      }
    }

    fetchInitial();
    return () => { cancelled = true; };
  }, []);

  // Polling / simulation interval
  useEffect(() => {
    if (!polling || !data) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    pollRef.current = window.setInterval(() => {
      const current = dataRef.current;
      if (!current) return;

      const updated = simulateUpdate(current);
      setData(updated);
      setLastUpdated(new Date());

      const ts = new Date().toLocaleTimeString();
      setInquiryHistory((prev) => {
        const next = [...prev, { time: ts, value: updated.inquiries.new }];
        return next.length > 20 ? next.slice(-20) : next;
      });
      const total = updated.facebook + updated.website + updated.other;
      setOrderHistory((prev) => {
        const next = [...prev, { time: ts, total }];
        return next.length > 20 ? next.slice(-20) : next;
      });
    }, 5000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [polling, data, simulateUpdate]);

  const totalOrders = (d: AnalyticsShape) =>
    (d.facebook || 0) + (d.website || 0) + (d.other || 0);

  const peakSource = (d: AnalyticsShape) => {
    const sources = [
      { name: "Facebook", value: d.facebook },
      { name: "Website", value: d.website },
      { name: "Other", value: d.other },
    ];
    return sources.reduce((a, b) => (a.value >= b.value ? a : b));
  };

  const peakService = (d: AnalyticsShape) => {
    const services = [
      { name: "Function Room", value: d.types.functionRoom.facebook + d.types.functionRoom.website },
      { name: "Delivery", value: d.types.delivery.facebook + d.types.delivery.website },
      { name: "Catering", value: d.types.catering.facebook + d.types.catering.website },
    ];
    return services.reduce((a, b) => (a.value >= b.value ? a : b));
  };

  return (
    <div>
      <section className="page-hero dashboard-hero">
        <p className="eyebrow">Analytics</p>
        <h1>Daily Operations Report</h1>
        <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Calendar size={16} />
          {formatDate(currentTime)}
        </p>
      </section>

      <section className="section">
        {/* Date & Time header bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.5rem",
            marginBottom: 24,
            borderRadius: 10,
            background: "#640000",
            color: "#fdf6e3",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Clock size={18} style={{ color: "#f2e7a9" }} />
            <div>
              <div style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(242,231,169,0.7)" }}>
                Current Time
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, fontFamily: "Georgia, serif", color: "#f2e7a9" }}>
                {formatTime(currentTime)}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {polling ? (
              <button
                className="button"
                type="button"
                onClick={() => setPolling(false)}
                style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", border: "1px solid rgba(242,231,169,0.4)", background: "transparent", color: "#f2e7a9" }}
              >
                <Activity size={12} style={{ marginRight: 6 }} /> Stop live
              </button>
            ) : (
              <button
                className="button button--gold"
                type="button"
                onClick={() => setPolling(true)}
                style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}
              >
                <Activity size={12} style={{ marginRight: 6 }} /> Start live
              </button>
            )}
            {polling && (
              <span style={{ fontSize: "0.75rem", color: "#87d068", fontWeight: 600 }}>
                ● Live
              </span>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(242,231,169,0.7)" }}>
              Last Updated
            </div>
            <div style={{ fontSize: "0.85rem", color: "#f2e7a9" }}>
              {lastUpdated ? formatTime(lastUpdated) : "—"}
            </div>
          </div>
        </div>

        {/* Summary cards */}
        {data && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            <div className="card" style={{ padding: "1.25rem", borderLeft: "4px solid #af0100" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <ShoppingBag size={18} style={{ color: "#af0100" }} />
                <span style={{ fontSize: "0.7rem", color: "#8a5a5a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Total Orders Today
                </span>
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#640000", fontFamily: "Georgia, serif" }}>
                {totalOrders(data)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#8a5a5a", marginTop: 4 }}>
                Peak source: <strong style={{ color: "#af0100" }}>{peakSource(data).name}</strong> ({peakSource(data).value})
              </div>
            </div>

            <div className="card" style={{ padding: "1.25rem", borderLeft: "4px solid #3b82f6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <TrendingUp size={18} style={{ color: "#3b82f6" }} />
                <span style={{ fontSize: "0.7rem", color: "#8a5a5a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Top Service
                </span>
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#640000", fontFamily: "Georgia, serif" }}>
                {peakService(data).name}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#8a5a5a", marginTop: 4 }}>
                {peakService(data).value} orders combined
              </div>
            </div>

            <div className="card" style={{ padding: "1.25rem", borderLeft: "4px solid #f97316" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <MessageSquare size={18} style={{ color: "#f97316" }} />
                <span style={{ fontSize: "0.7rem", color: "#8a5a5a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  New Inquiries Today
                </span>
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#640000", fontFamily: "Georgia, serif" }}>
                {data.inquiries.new}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#8a5a5a", marginTop: 4 }}>
                Pending response
              </div>
            </div>

            <div className="card" style={{ padding: "1.25rem", borderLeft: "4px solid #087443" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <CheckCircle size={18} style={{ color: "#087443" }} />
                <span style={{ fontSize: "0.7rem", color: "#8a5a5a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Resolved Today
                </span>
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#640000", fontFamily: "Georgia, serif" }}>
                {data.inquiries.resolved}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#8a5a5a", marginTop: 4 }}>
                Resolution rate:{" "}
                <strong style={{ color: "#087443" }}>
                  {data.inquiries.new > 0
                    ? Math.round((data.inquiries.resolved / data.inquiries.new) * 100)
                    : 0}
                  %
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Source breakdown strip */}
        {data && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              marginBottom: 24,
              padding: "1rem",
              borderRadius: 8,
              background: "rgba(100, 0, 0, 0.03)",
              border: "1px solid rgba(100, 0, 0, 0.08)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", color: "#8a5a5a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Facebook Orders
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#3b82f6" }}>{data.facebook}</div>
              <div style={{ fontSize: "0.7rem", color: "#8a5a5a" }}>
                {totalOrders(data) > 0 ? Math.round((data.facebook / totalOrders(data)) * 100) : 0}% of total
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", color: "#8a5a5a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Website Orders
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#10b981" }}>{data.website}</div>
              <div style={{ fontSize: "0.7rem", color: "#8a5a5a" }}>
                {totalOrders(data) > 0 ? Math.round((data.website / totalOrders(data)) * 100) : 0}% of total
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", color: "#8a5a5a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Other Orders
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#9ca3af" }}>{data.other}</div>
              <div style={{ fontSize: "0.7rem", color: "#8a5a5a" }}>
                {totalOrders(data) > 0 ? Math.round((data.other / totalOrders(data)) * 100) : 0}% of total
              </div>
            </div>
          </div>
        )}

        {/* Charts grid */}
        {data ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Pie Chart - Orders Source */}
            <div className="card" style={{ padding: "1.5rem" }}>
              <h3 style={{ margin: "0 0 0.25rem", color: "#640000", fontFamily: "Georgia, serif", fontSize: "1.1rem" }}>
                Orders by Source
              </h3>
              <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: "#8a5a5a" }}>
                Distribution of today's orders across channels
              </p>
              <Pie
                data={{
                  labels: ["Facebook", "Website", "Other"],
                  datasets: [
                    {
                      data: [data.facebook, data.website, data.other],
                      backgroundColor: ["#3b82f6", "#10b981", "#9ca3af"],
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { position: "bottom" } },
                }}
              />
              <div style={{ marginTop: 12, fontWeight: 600, textAlign: "center", color: "#640000" }}>
                Total: {totalOrders(data)} orders
              </div>
            </div>

            {/* Stacked Bar Chart - Order Types by Source */}
            <div className="card" style={{ padding: "1.5rem" }}>
              <h3 style={{ margin: "0 0 0.25rem", color: "#640000", fontFamily: "Georgia, serif", fontSize: "1.1rem" }}>
                Service Breakdown by Source
              </h3>
              <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: "#8a5a5a" }}>
                How each service category performs per channel today
              </p>
              <Bar
                options={{
                  responsive: true,
                  scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true },
                  },
                  plugins: { legend: { position: "bottom" } },
                }}
                data={{
                  labels: ["Function Room", "Delivery", "Catering"],
                  datasets: [
                    {
                      label: "Facebook",
                      backgroundColor: "#3b82f6",
                      data: [
                        data.types.functionRoom.facebook,
                        data.types.delivery.facebook,
                        data.types.catering.facebook,
                      ],
                    },
                    {
                      label: "Website",
                      backgroundColor: "#10b981",
                      data: [
                        data.types.functionRoom.website,
                        data.types.delivery.website,
                        data.types.catering.website,
                      ],
                    },
                  ],
                }}
              />
            </div>

            {/* Order volume over time (full width) */}
            <div className="card" style={{ gridColumn: "1 / -1", padding: "1.5rem" }}>
              <h3 style={{ margin: "0 0 0.25rem", color: "#640000", fontFamily: "Georgia, serif", fontSize: "1.1rem" }}>
                Order Volume Over Time
              </h3>
              <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: "#8a5a5a" }}>
                Cumulative order count tracked throughout the day ({formatDate(currentTime)})
              </p>
              <Line
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { display: orderHistory.length > 1 },
                    y: { beginAtZero: true },
                  },
                }}
                data={{
                  labels: orderHistory.map((h) => h.time),
                  datasets: [
                    {
                      label: "Total orders",
                      data: orderHistory.map((h) => h.total),
                      borderColor: "#640000",
                      backgroundColor: "rgba(100,0,0,0.08)",
                      fill: true,
                      tension: 0.3,
                    },
                  ],
                }}
              />
            </div>

            {/* Inquiry Tracking (full width) */}
            <div className="card" style={{ gridColumn: "1 / -1", padding: "1.5rem" }}>
              <h3 style={{ margin: "0 0 0.25rem", color: "#640000", fontFamily: "Georgia, serif", fontSize: "1.1rem" }}>
                Inquiry Tracking
              </h3>
              <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: "#8a5a5a" }}>
                New customer inquiries received today — {formatDate(currentTime)}
              </p>
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1, padding: "0.75rem", background: "rgba(100, 0, 0, 0.04)", borderRadius: 6, textAlign: "center" }}>
                  <div style={{ fontSize: "0.7rem", color: "#8a5a5a", textTransform: "uppercase", letterSpacing: "0.08em" }}>New</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#640000" }}>{data.inquiries.new}</div>
                </div>
                <div style={{ flex: 1, padding: "0.75rem", background: "rgba(8, 116, 67, 0.06)", borderRadius: 6, textAlign: "center" }}>
                  <div style={{ fontSize: "0.7rem", color: "#8a5a5a", textTransform: "uppercase", letterSpacing: "0.08em" }}>Resolved</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#087443" }}>{data.inquiries.resolved}</div>
                </div>
                <div style={{ flex: 1, padding: "0.75rem", background: "rgba(249, 115, 22, 0.06)", borderRadius: 6, textAlign: "center" }}>
                  <div style={{ fontSize: "0.7rem", color: "#8a5a5a", textTransform: "uppercase", letterSpacing: "0.08em" }}>Pending</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f97316" }}>
                    {Math.max(0, data.inquiries.new - data.inquiries.resolved)}
                  </div>
                </div>
              </div>
              <Line
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { display: inquiryHistory.length > 1 },
                    y: { beginAtZero: true },
                  },
                }}
                data={{
                  labels: inquiryHistory.map((h) => h.time),
                  datasets: [
                    {
                      label: "New inquiries",
                      data: inquiryHistory.map((h) => h.value),
                      borderColor: "#f97316",
                      backgroundColor: "rgba(249,115,22,0.15)",
                      fill: true,
                      tension: 0.3,
                    },
                  ],
                }}
              />
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <Activity size={32} />
            <p>Loading analytics data...</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
