import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://tcgdex-api-production.up.railway.app');

const COLUMNS = [
  { key: 'name',             label: 'Name' },
  { key: 'set_name',         label: 'Set' },
  { key: 'collector_number', label: '#' },
  { key: 'rarity',           label: 'Rarity' },
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
  const [sort, setSort] = useState({ field: 'set_name', dir: 'asc' });
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
    const s = [...new Set(cards.map(c => c.set_name))].filter(Boolean);
    return s.sort((a, b) => a.localeCompare(b));
  }, [cards]);

  const displayed = useMemo(() => {
    let result = setFilter ? cards.filter(c => c.set_name === setFilter) : cards;
    result = [...result].sort((a, b) => {
      const av = a[sort.field] ?? '';
      const bv = b[sort.field] ?? '';
      const cmp = typeof av === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [cards, setFilter, sort]);

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
      </header>

      <div className="about">
        <p>
          TCGDex tracks high-rarity Pokémon TCG cards and their market prices over time.
          Browse the full card list, filter by set, and click any card to view a detailed
          price history chart. Prices are sourced from TCGPlayer and update automatically
          every day at 4 PM EST. Price tracking started on 4/2/26, cards will not have price data before then. 
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
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    className="sortable"
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    {sort.field === col.key && <SortIcon dir={sort.dir} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map(card => (
                <tr key={card.product_id} onClick={() => navigate(`/cards/${card.product_id}`)}>
                  <td className="thumb-cell">
                    {card.image_url
                      ? <img src={card.image_url} alt={card.name} className="card-thumb" />
                      : <div className="card-thumb placeholder" />
                    }
                  </td>
                  <td className="name-cell">{card.name}</td>
                  <td>{card.set_name}</td>
                  <td className="num-cell">{card.collector_number}/{card.set_total}</td>
                  <td>{card.rarity ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
