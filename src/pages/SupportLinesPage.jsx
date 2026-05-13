import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEra, ERAS } from '../utils/priceMetrics';

const API = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api' : 'https://tcgdex-api-production.up.railway.app');

const TIERS = ['All', '★ Deep Value', '$200+', '$50–$200', '$10–$50'];

function eraSlug(era) {
  return era.toLowerCase().replace(/[\s&]+/g, '-').replace(/-+/g, '-');
}

function CardThumb({ item }) {
  const [failed, setFailed] = useState(false);
  const src = item.tcgdex_image_url ?? item.image_url ?? null;
  if (!src || failed) return <div className="sc-thumb-placeholder" />;
  return (
    <img
      src={src}
      alt={item.name}
      className="sc-thumb"
      onError={() => setFailed(true)}
    />
  );
}

function Sparkline({ prices, floorPrice }) {
  if (!prices?.length || prices.length < 2) return <div style={{ height: 52 }} />;
  const allPrices = floorPrice != null ? [...prices, floorPrice] : prices;
  const min = Math.min(...allPrices) * 0.97;
  const max = Math.max(...allPrices) * 1.03;
  const range = max - min || 1;
  const VW = 200, VH = 52;
  const toX = i => (i / (prices.length - 1)) * VW;
  const toY = p => VH - ((p - min) / range) * VH;
  const pts = prices.map((p, i) => `${toX(i).toFixed(1)},${toY(p).toFixed(1)}`).join(' ');
  const floorY = floorPrice != null ? toY(floorPrice) : null;

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width="100%"
      height={VH}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
    >
      {floorY != null && (
        <line
          x1="0" y1={floorY.toFixed(1)}
          x2={VW} y2={floorY.toFixed(1)}
          stroke="var(--accent)"
          strokeWidth="1"
          strokeDasharray="4,3"
          opacity="0.4"
        />
      )}
      <polyline
        points={pts}
        fill="none"
        stroke="#22c55e"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SupportCard({ item }) {
  const navigate = useNavigate();
  const era = getEra(item.set_name);
  const breakoutGainAmt = item.breakout_price - item.current_price;
  const breakoutGainPct = (breakoutGainAmt / item.current_price) * 100;

  return (
    <div className="support-card" onClick={() => navigate(`/cards/${item.product_id}`)}>
      <div className="sc-image">
        <CardThumb item={item} />
      </div>
      <div className="sc-body">
        <div className="sc-badges">
          <span className={`tier-badge${item.is_deep_value ? ' deep-value' : ''}`}>
            {item.is_deep_value ? '★ Deep Value' : item.tier_label}
          </span>
          <span className={`era-badge era-${eraSlug(era)}`}>{era}</span>
        </div>
        <div className="sc-name">{item.name}</div>
        <div className="sc-set">{item.set_name}</div>
        <div className="sc-price">${item.current_price.toFixed(2)}</div>
        <div className="sc-drawdown">
          <span className="sc-dd-loss">-${item.drawdown_amt.toFixed(2)}</span>
          <span className="sc-dd-sep"> · </span>
          <span className="sc-dd-pct">{(item.drawdown_pct * 100).toFixed(1)}% off ATH</span>
          <span className="sc-ath"> (${item.ath.toFixed(2)})</span>
        </div>
        <div className="sc-sparkline">
          <Sparkline prices={item.sparkline} floorPrice={item.floor_median} />
        </div>
        <div className="sc-breakout">
          <span className="sc-bt-label">Breakout target</span>
          <span className="sc-bt-gain">
            +${breakoutGainAmt.toFixed(2)} ({breakoutGainPct.toFixed(1)}%)
          </span>
          <span className="sc-bt-price">${item.breakout_price.toFixed(2)}</span>
        </div>
        <div className="sc-stats">
          {item.floor_weeks}w on floor · floor ${item.floor_median.toFixed(0)} · ±{(item.tier_band * 100).toFixed(0)}% band
        </div>
      </div>
    </div>
  );
}

export default function SupportLinesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeEra, setActiveEra] = useState('All');
  const [activeTier, setActiveTier] = useState('All');

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/analytics/support-lines`)
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
    if (activeTier !== 'All') {
      if (activeTier === '★ Deep Value') r = r.filter(item => item.is_deep_value);
      else r = r.filter(item => item.tier_label === activeTier);
    }
    return r;
  }, [items, activeEra, activeTier]);

  return (
    <div className="page">
      <div className="dash-header">
        <div>
          <h1>Support Lines</h1>
          <p className="dash-desc">
            Price floors forming across eras — cards sitting in tested accumulation zones with
            defined breakout targets.
          </p>
        </div>
      </div>

      <div className="methodology-note">
        <strong>Methodology</strong> — A card qualifies when it is ≥15–20% off ATH, has held a price
        floor for ≥3–6 weeks, and is currently trading within the floor band. Breakout target is
        floor median × 1.15.
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
        {TIERS.map(t => (
          <button
            key={t}
            className={`tier-pill${activeTier === t ? ' active' : ''}${t === '★ Deep Value' ? ' deep' : ''}`}
            onClick={() => setActiveTier(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="status">Loading…</p>
      ) : error ? (
        <p className="status" style={{ color: '#ef4444' }}>Failed to load: {error}</p>
      ) : filtered.length === 0 ? (
        <p className="status">
          No cards currently qualify for support lines
          {activeEra !== 'All' ? ` in the ${activeEra} era` : ''}.
        </p>
      ) : (
        <>
          <p className="dash-count">{filtered.length} card{filtered.length !== 1 ? 's' : ''} on support</p>
          <div className="dashboard-grid">
            {filtered.map(item => (
              <SupportCard key={item.product_id} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
