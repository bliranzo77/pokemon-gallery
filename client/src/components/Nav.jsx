import './Nav.css';
import { useRef, useState } from "react";
import { NavLink, Link, useLocation, useSearchParams } from "react-router-dom";
import SearchBar from './SearchBar';

function Nav() {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const toggleRef = useRef(null);

  // On narrow screens search sits behind a button; start it open when a
  // gallery search is already active so the filter text stays visible.
  const [searchOpen, setSearchOpen] = useState(
    () => pathname === '/gallery' && !!params.get('q')
  );

  const closeSearch = () => {
    setSearchOpen(false);
    toggleRef.current?.focus();
  };

  return (
    <header className="site-header">
      <div className={searchOpen ? 'site-header-inner is-search-open' : 'site-header-inner'}>
        <Link to="/" className="wordmark">
          <span className="wordmark-full">Pokémon Data Explorer</span>
          <span className="wordmark-short">Data Explorer</span>
        </Link>

        <nav className="site-nav" aria-label="Views">
          <NavLink to="/" end>Entries</NavLink>
          <NavLink to="/gallery">Gallery</NavLink>
          <NavLink to="/compare">Compare</NavLink>
        </nav>

        <button
          ref={toggleRef}
          className="search-toggle"
          aria-expanded={searchOpen}
          aria-controls="site-search"
          aria-label={searchOpen ? 'Close search' : 'Search'}
          onClick={() => {
            setSearchOpen(!searchOpen);
            if (!searchOpen) requestAnimationFrame(() => document.getElementById('pokemon-search')?.focus());
          }}
        >
          <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
            {searchOpen
              ? <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" fill="none" />
              : <>
                  <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M12.5 12.5L17 17" stroke="currentColor" strokeWidth="2" />
                </>}
          </svg>
        </button>

        <div
          className="site-search"
          id="site-search"
          onKeyDown={(e) => { if (e.key === 'Escape' && searchOpen) closeSearch(); }}
        >
          <SearchBar onDone={() => setSearchOpen(false)} />
        </div>
      </div>
    </header>
  );
}

export default Nav;
