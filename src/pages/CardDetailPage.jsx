import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://tcgdex-api-production.up.railway.app');

const VARIANT_COLORS = {
  'Normal':           '#aa3bff',
  'Holofoil':         '#f59e0b',
  'Reverse Holofoil': '#06b6d4',
};

const RANGES = [
  { label: '7D',  days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: 'All', days: null },
];

function buildChartData(snapshots) {
  const byDate = {};
  for (const row of snapshots) {
    if (!byDate[row.snapshot_date]) byDate[row.snapshot_date] = { date: row.snapshot_date };
    byDate[row.snapshot_date][row.sub_type_name] = parseFloat(row.market_price);
  }
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

export default function CardDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState('All');

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`${API}/cards/${id}`).then(r => r.ok ? r.json() : Promise.reject(r.status)),
      fetch(`${API}/cards/${id}/prices`).then(r => r.ok ? r.json() : Promise.reject(r.status)),
    ])
      .then(([cardData, priceData]) => {
        setCard(cardData);
        setPrices(priceData);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load card.');
        setLoading(false);
      });
  }, [id]);

  const allChartData = useMemo(() => buildChartData(prices), [prices]);
  const variants = useMemo(() => [...new Set(prices.map(p => p.sub_type_name))], [prices]);

  const chartData = useMemo(() => {
    const days = RANGES.find(r => r.label === range)?.days;
    if (!days || allChartData.length === 0) return allChartData;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return allChartData.filter(d => d.date >= cutoffStr);
  }, [allChartData, range]);

  const yDomain = useMemo(() => {
    const vals = chartData.flatMap(d => variants.map(v => d[v]).filter(v => v != null));
    if (vals.length === 0) return ['auto', 'auto'];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = (max - min) * 0.1 || max * 0.05;
    return [
      parseFloat((min - pad).toFixed(2)),
      parseFloat((max + pad).toFixed(2)),
    ];
  }, [chartData, variants]);

  const latestByVariant = useMemo(() => {
    const result = {};
    for (const row of prices) {
      if (!result[row.sub_type_name] ||
          row.snapshot_date > result[row.sub_type_name].snapshot_date) {
        result[row.sub_type_name] = row;
      }
    }
    return result;
  }, [prices]);

  if (loading) return <div className="page"><p className="status">Loading…</p></div>;
  if (error)   return <div className="page"><p className="error">{error}</p></div>;
  if (!card)   return null;

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate('/')}>← Back</button>

      <div className="card-detail">
        <div className="card-detail-image">
          {card.image_url
            ? <img src={card.image_url} alt={card.name} />
            : <div className="card-img-placeholder" />
          }
        </div>

        <div className="card-detail-info">
          <h1>{card.name}</h1>
          <dl className="card-meta">
            <dt>Set</dt>    <dd>{card.set_name}</dd>
            <dt>Number</dt> <dd>{card.collector_number}/{card.set_total}</dd>
            {card.rarity && <><dt>Rarity</dt><dd>{card.rarity}</dd></>}
          </dl>

          {Object.keys(latestByVariant).length > 0 && (
            <div className="price-pills">
              {Object.entries(latestByVariant).map(([variant, row]) => (
                <div key={variant} className="price-pill">
                  <span className="pill-label">{variant}</span>
                  <span className="pill-price">${parseFloat(row.market_price).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {card.tcgplayer_url && (
            <a className="tcgplayer-btn" href={card.tcgplayer_url} target="_blank" rel="noreferrer">
              View on TCGPlayer →
            </a>
          )}
        </div>
      </div>

      {allChartData.length > 0 && (
        <div className="chart-section">
          <div className="chart-header">
            <h2>Price History</h2>
            <div className="range-buttons">
              {RANGES.map(r => (
                <button
                  key={r.label}
                  className={`range-btn${range === r.label ? ' active' : ''}`}
                  onClick={() => setRange(r.label)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: 'var(--text)' }}
                tickFormatter={d => d.slice(0, 10)}
              />
              <YAxis
                domain={yDomain}
                tick={{ fontSize: 12, fill: 'var(--text)' }}
                tickFormatter={v => `$${Number(v).toFixed(0)}`}
                width={56}
              />
              <Tooltip
                formatter={(v, name) => [`$${Number(v).toFixed(2)}`, name]}
                labelFormatter={l => `Date: ${l.slice(0, 10)}`}
                contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8 }}
              />
              <Legend />
              {variants.map(variant => (
                <Line
                  key={variant}
                  type="monotone"
                  dataKey={variant}
                  stroke={VARIANT_COLORS[variant] ?? '#8884d8'}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
