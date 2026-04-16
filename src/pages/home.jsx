import '../App.css';
import { useState } from 'react';
import Nav from '../components/Nav';
import SearchBar from '../components/SearchBar';
import PokeScroll from '../components/PokeScroll';
import pokedex from '../data/data';

function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNavigate = (direction) => {
    setCurrentIndex(prev => prev + direction);
  };

  return (
    <>
      <section className='app_container'>
        <Nav />
        <SearchBar onSelect={setCurrentIndex} />
        <PokeScroll currentIndex={currentIndex} onNavigate={handleNavigate} />
      </section>
    </>
  );
}

export default Home;
