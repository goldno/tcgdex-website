import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://tcgdex-api-production.up.railway.app');

function cardImageUrl(card) {
  return card.tcgdex_image_url ?? card.image_url ?? null;
}

function CardImage({ card }) {
  const [failed, setFailed] = useState(false);
  const src = cardImageUrl(card);
  if (!src || failed) return <div className="card-img-placeholder" />;
  return <img src={src} alt={card.name} onError={() => setFailed(true)} />;
}

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
  const [supportData, setSupportData] = useState(null);
  const [momentumData, setMomentumData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState('All');

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSupportData(null);
    setMomentumData(null);

    const cardReq   = fetch(`${API}/cards/${id}`).then(r => r.ok ? r.json() : Promise.reject(r.status));
    const pricesReq = fetch(`${API}/cards/${id}/prices`).then(r => r.ok ? r.json() : Promise.reject(r.status));
    const supportReq  = fetch(`${API}/analytics/support-lines`).then(r => r.ok ? r.json() : []).catch(() => []);
    const momentumReq = fetch(`${API}/analytics/momentum`).then(r => r.ok ? r.json() : []).catch(() => []);

    Promise.all([cardReq, pricesReq, supportReq, momentumReq])
      .then(([cardData, priceData, supportLines, momentum]) => {
        setCard(cardData);
        setPrices(priceData);
        setSupportData(supportLines.find(s => String(s.product_id) === String(id)) ?? null);
        setMomentumData(momentum.find(m => String(m.product_id) === String(id)) ?? null);
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
          <CardImage card={card} />
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

      {(supportData || momentumData) && (
        <div className="analytics-section">
          <h2 className="analytics-heading">Analytics</h2>
          <div className="analytics-panels">

            {supportData && (() => {
              const gainAmt = supportData.breakout_price - supportData.current_price;
              const gainPct = (gainAmt / supportData.current_price) * 100;
              return (
                <div className="analytics-panel support-panel">
                  <div className="ap-header">
                    <span className="ap-title">Support Line</span>
                    <div className="ap-badges">
                      {supportData.is_deep_value
                        ? <span className="ap-badge deep-value">★ Deep Value</span>
                        : <span className="ap-badge tier">{supportData.tier_label}</span>
                      }
                      {supportData.in_band && <span className="ap-badge in-band">In Band</span>}
                    </div>
                  </div>
                  <div className="ap-stats">
                    <div className="ap-stat">
                      <span className="ap-stat-label">ATH</span>
                      <span className="ap-stat-value">${supportData.ath.toFixed(2)}</span>
                    </div>
                    <div className="ap-stat">
                      <span className="ap-stat-label">Drawdown</span>
                      <span className="ap-stat-value loss">
                        -{(supportData.drawdown_pct * 100).toFixed(1)}%
                        <span className="ap-stat-sub"> (-${supportData.drawdown_amt.toFixed(2)})</span>
                      </span>
                    </div>
                    <div className="ap-stat">
                      <span className="ap-stat-label">Floor Median</span>
                      <span className="ap-stat-value">${supportData.floor_median.toFixed(2)}</span>
                    </div>
                    <div className="ap-stat">
                      <span className="ap-stat-label">Weeks on Floor</span>
                      <span className="ap-stat-value">{supportData.floor_weeks}w</span>
                    </div>
                  </div>
                  <div className="ap-breakout">
                    <span className="ap-bt-label">Breakout target</span>
                    <span className="ap-bt-price">${supportData.breakout_price.toFixed(2)}</span>
                    <span className="ap-bt-gain">+${gainAmt.toFixed(2)} ({gainPct.toFixed(1)}%)</span>
                  </div>
                  <div className="ap-band-note">
                    ±{(supportData.tier_band * 100).toFixed(0)}% band
                  </div>
                </div>
              );
            })()}

            {momentumData && (() => {
              const isPos = momentumData.momentum_30d >= 0;
              const color = isPos ? '#22c55e' : '#ef4444';
              const sign  = isPos ? '+' : '';
              return (
                <div className="analytics-panel momentum-panel">
                  <div className="ap-header">
                    <span className="ap-title">Momentum</span>
                    <span className="ap-badge momentum" style={{ color, borderColor: color }}>
                      {sign}{momentumData.momentum_30d.toFixed(1)}% · 30d
                    </span>
                  </div>
                  <div className="ap-momentum-big" style={{ color }}>
                    {sign}{momentumData.momentum_30d.toFixed(1)}%
                  </div>
                  <div className="ap-momentum-prices">
                    <span className="ap-mp-entry">
                      {momentumData.price_30d_ago != null ? `$${momentumData.price_30d_ago.toFixed(2)}` : '—'}
                    </span>
                    <span className="ap-mp-arrow">→</span>
                    <span className="ap-mp-current">${momentumData.current_price.toFixed(2)}</span>
                  </div>
                  <div className="ap-momentum-label">30-day price change</div>
                </div>
              );
            })()}

          </div>
        </div>
      )}

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
