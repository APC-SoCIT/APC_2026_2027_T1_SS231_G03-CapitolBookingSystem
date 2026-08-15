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
import { ExternalLink, Activity } from "lucide-react";

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

export function Analytics() {
  const [data, setData] = useState<AnalyticsShape | null>(null);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<number | null>(null);
  const defaultUrl = "/analytic_dashboard/mock_data.json";

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  async function fetchData(url = defaultUrl) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("fetch failed");
      const payload = await res.json();
      setData(payload as AnalyticsShape);
    } catch (e) {
      console.warn("Analytics fetch error", e);
    }
  }

  function startPolling(url = defaultUrl, interval = 10000) {
    if (pollRef.current) return;
    fetchData(url);
    pollRef.current = window.setInterval(() => fetchData(url), interval);
    setPolling(true);
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setPolling(false);
  }

  const totalOrders = (d: AnalyticsShape) => (d.facebook || 0) + (d.website || 0) + (d.other || 0);

  return (
    <div>
      <section className="page-hero dashboard-hero">
        <p className="eyebrow">Analytics</p>
        <h1>Operational Analytics</h1>
        <p>Interactive charts powered by Chart.js and React.</p>
      </section>

      <section className="section">
        <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: 'center' }}>
          <button className="button button--gold" type="button" onClick={() => window.open('/analytic_dashboard/index.html', '_blank')}>
            <ExternalLink size={14} style={{ marginRight: 8 }} /> Open raw dashboard
          </button>

          <button className="button button--outline" type="button" onClick={() => fetchData()}>
            <Activity size={14} style={{ marginRight: 8 }} /> Fetch once
          </button>

          {!polling ? (
            <button className="button" type="button" onClick={() => startPolling()}>
              Start polling
            </button>
          ) : (
            <button className="button" type="button" onClick={() => stopPolling()}>
              Stop polling
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <h3>Orders Source</h3>
            {data ? (
              <>
                <Pie
                  data={{
                    labels: ['Facebook', 'Website', 'Other'],
                    datasets: [{ data: [data.facebook, data.website, data.other || 0], backgroundColor: ['#3b82f6', '#10b981', '#9ca3af'] }],
                  }}
                />
                <div className="center-text">Total: {totalOrders(data)}</div>
              </>
            ) : (
              <p>Load data to view chart.</p>
            )}
          </div>

          <div className="card">
            <h3>Order Types by Source (Stacked)</h3>
            {data ? (
              <Bar
                options={{
                  responsive: true,
                  scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
                }}
                data={{
                  labels: ['Function Room', 'Delivery', 'Catering'],
                  datasets: [
                    { label: 'Facebook', backgroundColor: '#3b82f6', data: [data.types.functionRoom.facebook, data.types.delivery.facebook, data.types.catering.facebook] },
                    { label: 'Website', backgroundColor: '#10b981', data: [data.types.functionRoom.website, data.types.delivery.website, data.types.catering.website] },
                  ],
                }}
              />
            ) : (
              <p>Load data to view chart.</p>
            )}
          </div>

          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h3>Inquiry Tracking</h3>
            {data ? (
              <div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div className="stat">
                    <div className="label">New</div>
                    <div className="value">{data.inquiries.new}</div>
                  </div>
                  <div className="stat">
                    <div className="label">Resolved</div>
                    <div className="value">{data.inquiries.resolved}</div>
                  </div>
                </div>
                <Line
                  options={{ responsive: true, plugins: { legend: { display: false } } }}
                  data={{ labels: ['Now'], datasets: [{ label: 'New inquiries', data: [data.inquiries.new], borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.15)', fill: true }] }}
                />
              </div>
            ) : (
              <p>Load data to view chart.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Analytics;
