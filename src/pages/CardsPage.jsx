import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://tcgdex-api-production.up.railway.app');

function cardImageUrl(card) {
  return card.tcgdex_image_url ?? card.image_url ?? null;
}

function CardThumb({ card }) {
  const [failed, setFailed] = useState(false);
  const src = cardImageUrl(card);
  if (!src || failed) return <div className="card-thumb placeholder" />;
  return (
    <img
      src={src}
      alt={card.name}
      className="card-thumb"
      onError={() => setFailed(true)}
    />
  );
}

const PAGE_SIZE = 50;

function Pagination({ page, pageCount, onPage }) {
  if (pageCount <= 1) return null;

  const pages = [];
  if (pageCount <= 7) {
    for (let i = 1; i <= pageCount; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(pageCount - 1, page + 1); i++) pages.push(i);
    if (page < pageCount - 2) pages.push('...');
    pages.push(pageCount);
  }

  return (
    <div className="pagination">
      <button disabled={page === 1} onClick={() => onPage(page - 1)}>←</button>
      {pages.map((p, i) =>
        p === '...'
          ? <span key={`e${i}`} className="page-ellipsis">…</span>
          : <button key={p} className={p === page ? 'active' : ''} onClick={() => onPage(p)}>{p}</button>
      )}
      <button disabled={page === pageCount} onClick={() => onPage(page + 1)}>→</button>
    </div>
  );
}

const COLUMNS = [
  { key: 'name',             label: 'Name',   noSort: true },
  { key: 'set_name',         label: 'Set',    noSort: true },
  { key: 'collector_number', label: '#',      noSort: true },
  { key: 'rarity',           label: 'Rarity', noSort: true },
  { key: 'latest_price',     label: 'Price' },
];

function SortIcon({ dir }) {
  return <span className="sort-icon">{dir === 'asc' ? '↑' : '↓'}</span>;
}

export default function CardsPage() {
  const [cards, setCards] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [setFilter, setSetFilter] = useState('');
  const [rarityFilter, setRarityFilter] = useState('');
  const [sort, setSort] = useState({ field: 'latest_price', dir: 'desc' });
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    const delay = setTimeout(() => {
      setLoading(true);
      setError(null);
      const url = search
        ? `${API}/cards?search=${encodeURIComponent(search)}`
        : `${API}/cards`;
      fetch(url, { signal: controller.signal })
        .then(r => r.json())
        .then(data => { setCards(data); setLoading(false); })
        .catch(err => {
          if (err.name !== 'AbortError') {
            setError('Failed to load cards.');
            setLoading(false);
          }
        });
    }, search ? 300 : 0);
    return () => { clearTimeout(delay); controller.abort(); };
  }, [search]);

  const sets = useMemo(() => {
    const byName = {};
    for (const c of cards) {
      if (c.set_name && (!byName[c.set_name] || c.group_id > byName[c.set_name])) {
        byName[c.set_name] = c.group_id;
      }
    }
    return Object.entries(byName)
      .sort((a, b) => b[1] - a[1]) // newest first
      .map(([name]) => name);
  }, [cards]);

  const rarities = useMemo(() => {
    const seen = new Set();
    for (const c of cards) if (c.rarity) seen.add(c.rarity);
    return [...seen].sort();
  }, [cards]);

  useEffect(() => { setPage(1); }, [search, setFilter, rarityFilter, sort]);

  const displayed = useMemo(() => {
    let result = setFilter ? cards.filter(c => c.set_name === setFilter) : cards;
    if (rarityFilter) result = result.filter(c => c.rarity === rarityFilter);
    result = [...result].sort((a, b) => {
      if (sort.field === 'latest_price') {
        const an = parseFloat(a.latest_price);
        const bn = parseFloat(b.latest_price);
        const aNull = isNaN(an);
        const bNull = isNaN(bn);
        if (aNull && bNull) return 0;
        if (aNull) return 1;
        if (bNull) return -1;
        return sort.dir === 'asc' ? an - bn : bn - an;
      }
      const av = String(a[sort.field] ?? '');
      const bv = String(b[sort.field] ?? '');
      const cmp = av.localeCompare(bv);
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [cards, setFilter, rarityFilter, sort]);

  const pageCount = Math.ceil(displayed.length / PAGE_SIZE);
  const pageCards = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(field) {
    setSort(prev =>
      prev.field === field
        ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { field, dir: 'asc' }
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>TCGDex</h1>
        <input
          className="search"
          type="search"
          placeholder="Search cards…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {sets.length > 0 && (
          <select
            className="set-filter"
            value={setFilter}
            onChange={e => setSetFilter(e.target.value)}
          >
            <option value="">All sets</option>
            {sets.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {rarities.length > 0 && (
          <select
            className="set-filter"
            value={rarityFilter}
            onChange={e => setRarityFilter(e.target.value)}
          >
            <option value="">All rarities</option>
            {rarities.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        )}
      </header>

      <div className="about">
        <p>
          TCGDex tracks high-rarity Pokémon TCG cards and their market prices over time.
          Browse the full card list, filter by set, and click any card to view a detailed
          price history chart. Prices are sourced from TCGPlayer and update automatically
          every day at 4 PM EST. Price tracking started on 2/8/24, cards will not have price data before then. 
          Data for new sets will be automatically tracked when they are released.
        </p>
      </div>

      {loading ? (
        <p className="status">Loading…</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : displayed.length === 0 ? (
        <p className="status">No cards found.</p>
      ) : (
        <>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    className={col.noSort ? '' : 'sortable'}
                    onClick={col.noSort ? undefined : () => handleSort(col.key)}
                  >
                    {col.label}
                    {!col.noSort && sort.field === col.key && <SortIcon dir={sort.dir} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageCards.map(card => (
                <tr key={card.product_id} onClick={() => navigate(`/cards/${card.product_id}`)}>
                  <td className="thumb-cell">
                    <CardThumb card={card} />
                  </td>
                  <td className="name-cell">{card.name}</td>
                  <td>{card.set_name}</td>
                  <td className="num-cell">{card.collector_number}/{card.set_total}</td>
                  <td>{card.rarity ?? '—'}</td>
                  <td className="price-cell">
                    {card.latest_price != null ? `$${parseFloat(card.latest_price).toFixed(2)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
        </>
      )}
    </div>
  );
}
