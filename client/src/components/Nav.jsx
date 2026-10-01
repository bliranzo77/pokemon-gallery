import './Nav.css';
import { Link } from "react-router-dom";

function Nav() {
  return (
    <section className="nav_content_container">
      <div className="nav_button_container">
        <Link to="/">
          <button className="nav_buttons">Home</button>
        </Link>
        <Link to="/gallery">
          <button className="nav_buttons">Gallery</button>
        </Link>
      </div>
    </section>
  );
}

export default Nav;
