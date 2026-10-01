import './grid.css';
import pokedex from "../data/data";

function Grid() {
  return (
    <div className="gallery_content_container">
        <div className="card-grid-container">
            {pokedex.map((item) => (
                <div key={item.id} className="card">
                    <div className="card_img">
                        <img src={item.photo} alt={item.name} />
                    </div>

                    {/* Content Section */}
                    <div className="card-content">
                        <h3>{item.name}</h3>
                    </div>
                </div>
            ))}
        </div>
    </div>

  );
}

export default Grid;