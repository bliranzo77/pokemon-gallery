import '../App.css';
import Compare from '../components/Compare';
import Nav from '../components/Nav';

function ComparePage() {
  return (
    <section className='app_container'>
      <Nav />
      <main>
        <Compare />
      </main>
    </section>
  );
}

export default ComparePage;
