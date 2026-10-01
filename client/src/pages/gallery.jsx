import '../App.css';
import Grid from '../components/Grid';
import Nav from '../components/Nav';

function Gallery() {
  return (
    <section className='app_container'>
      <Nav />
      <main>
        <Grid />
      </main>
    </section>
  );
}

export default Gallery;
