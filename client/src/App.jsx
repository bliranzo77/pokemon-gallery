import './App.css';
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/home'
import Gallery from './pages/gallery'
import ComparePage from './pages/compare'

function App() {
  return (
    <Router>
        <Routes>
          <Route path='/' element={<Home/>}/>
          <Route path='/gallery' element={<Gallery/>}/>
          <Route path='/compare' element={<ComparePage/>}/>
        </Routes>
    </Router>
  );
}

export default App;
