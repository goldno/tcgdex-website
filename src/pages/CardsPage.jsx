import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'https://tcgdex-api-production.up.railway.app';

export default function CardsPage() {
  const [cards, setCards] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
      </header>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="status">Loading…</p>
      ) : cards.length === 0 ? (
        <p className="status">No cards found.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Set</th>
                <th>#</th>
                <th>Rarity</th>
              </tr>
            </thead>
            <tbody>
              {cards.map(card => (
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
