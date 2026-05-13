import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEra, ERAS } from '../utils/priceMetrics';

const API = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api' : 'https://tcgdex-api-production.up.railway.app');

function eraSlug(era) {
  return era.toLowerCase().replace(/[\s&]+/g, '-').replace(/-+/g, '-');
}

function CardThumb({ item }) {
  const [failed, setFailed] = useState(false);
  const src = item.tcgdex_image_url ?? item.image_url ?? null;
  if (!src || failed) return <div className="mc-thumb-placeholder" />;
  return (
    <img
      src={src}
      alt={item.name}
      className="mc-thumb"
      onError={() => setFailed(true)}
    />
  );
}

function Sparkline({ prices, color }) {
  if (!prices?.length || prices.length < 2) return <div style={{ height: 44 }} />;
  const min = Math.min(...prices) * 0.97;
  const max = Math.max(...prices) * 1.03;
  const range = max - min || 1;
  const VW = 200, VH = 44;
  const pts = prices.map((p, i) =>
    `${((i / (prices.length - 1)) * VW).toFixed(1)},${(VH - ((p - min) / range) * VH).toFixed(1)}`
  ).join(' ');

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width="100%"
      height={VH}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MomentumCard({ item, rank }) {
  const navigate = useNavigate();
  const isPos = item.momentum_30d >= 0;
  const color = isPos ? '#22c55e' : '#ef4444';
  const era = getEra(item.set_name);
  const gainSign = isPos ? '+' : '';

  return (
    <div className="momentum-card" onClick={() => navigate(`/cards/${item.product_id}`)}>
      <div className="mc-rank">#{rank}</div>
      <div className="mc-image">
        <CardThumb item={item} />
      </div>
      <div className="mc-body">
        <div className="mc-badges">
          <span className={`era-badge era-${eraSlug(era)}`}>{era}</span>
        </div>
        <div className="mc-name">{item.name}</div>
        <div className="mc-set">{item.set_name}</div>
        <div className="mc-gain" style={{ color }}>
          {gainSign}{item.momentum_30d.toFixed(1)}%
          <span className="mc-gain-label">30d</span>
        </div>
        <div className="mc-prices">
          <span className="mc-entry">
            {item.price_30d_ago != null ? `$${item.price_30d_ago.toFixed(2)}` : '—'}
          </span>
          <span className="mc-arrow">→</span>
          <span className="mc-current">${item.current_price.toFixed(2)}</span>
        </div>
        <div className="mc-sparkline">
          <Sparkline prices={item.sparkline} color={color} />
        </div>
      </div>
    </div>
  );
}

export default function MomentumPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeEra, setActiveEra] = useState('All');
  const [filter, setFilter] = useState('gainers');

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/analytics/momentum`)
      .then(r => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then(data => {
        if (!cancelled) { setItems(data); setLoading(false); }
      })
      .catch(err => {
        if (!cancelled) { setError(err.message); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, []);

  const eraCounts = useMemo(() => {
    const c = { All: items.length };
    for (const era of ERAS.slice(1)) {
      c[era] = items.filter(item => getEra(item.set_name) === era).length;
    }
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    let r = items;
    if (activeEra !== 'All') r = r.filter(item => getEra(item.set_name) === activeEra);
    if (filter === 'gainers') r = r.filter(item => item.momentum_30d > 0);
    else if (filter === 'losers') r = [...r.filter(item => item.momentum_30d < 0)].reverse();
    return r.slice(0, 100);
  }, [items, activeEra, filter]);

  return (
    <div className="page">
      <div className="dash-header">
        <div>
          <h1>Momentum Index</h1>
          <p className="dash-desc">
            Cards showing the strongest price movement over the last 30 days — monthly gainers
            and losers across all eras.
          </p>
        </div>
      </div>

      <div className="era-tabs">
        {ERAS.map(era => (
          <button
            key={era}
            className={`era-tab${activeEra === era ? ' active' : ''}`}
            onClick={() => setActiveEra(era)}
          >
            {era}
            {eraCounts[era] > 0 && (
              <span className="era-count">{eraCounts[era]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="tier-pills">
        <button
          className={`tier-pill gain${filter === 'gainers' ? ' active' : ''}`}
          onClick={() => setFilter('gainers')}
        >
          ↑ Gainers
        </button>
        <button
          className={`tier-pill loss${filter === 'losers' ? ' active' : ''}`}
          onClick={() => setFilter('losers')}
        >
          ↓ Losers
        </button>
        <button
          className={`tier-pill${filter === 'all' ? ' active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
      </div>

      {loading ? (
        <p className="status">Loading…</p>
      ) : error ? (
        <p className="status" style={{ color: '#ef4444' }}>Failed to load: {error}</p>
      ) : filtered.length === 0 ? (
        <p className="status">
          No cards with significant momentum
          {activeEra !== 'All' ? ` in the ${activeEra} era` : ''}.
        </p>
      ) : (
        <>
          <p className="dash-count">
            Top {filtered.length} {filter === 'gainers' ? 'gainers' : filter === 'losers' ? 'losers' : 'movers'}
            {activeEra !== 'All' ? ` · ${activeEra}` : ''} · 30-day
          </p>
          <div className="momentum-grid">
            {filtered.map((item, i) => (
              <MomentumCard key={item.product_id} item={item} rank={i + 1} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
