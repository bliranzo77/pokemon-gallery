import mongoose from "mongoose";

const { Schema } = mongoose;

const baseStatsSchema = new Schema(
  {
    hp: { type: Number, required: true },
    attack: { type: Number, required: true },
    defense: { type: Number, required: true },
    sp_attack: { type: Number, required: true },
    sp_defense: { type: Number, required: true },
    speed: { type: Number, required: true },
  },
  { _id: false }
);

// Mirrors one entry of seed/pokemon.data.js, plus `slug`.
const pokemonSchema = new Schema(
  {
    id: { type: Number, required: true },
    national_number: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    type_2: { type: String },
    height_in: { type: Number, required: true },
    weight_lb: { type: Number, required: true },
    region: { type: String, required: true },
    generation: { type: Number, required: true },
    evolution_stage: { type: Number, required: true, enum: [0, 1, 2] },
    evolution_family: { type: String, required: true },
    base_stats: { type: baseStatsSchema, required: true },
    photo: { type: String, required: true },
    // URL-friendly name taken from the photo filename, e.g. "mr-mime"
    slug: { type: String, required: true },
  },
  { versionKey: false }
);

pokemonSchema.index({ id: 1 }, { unique: true });
pokemonSchema.index({ slug: 1 }, { unique: true });
pokemonSchema.index({ type: 1 });
pokemonSchema.index({ type_2: 1 });
pokemonSchema.index({ region: 1 });
pokemonSchema.index({ generation: 1 });
pokemonSchema.index({ evolution_stage: 1 });

// "/pokemon_assets/mr-mime.png" -> "mr-mime"
export const slugFromPhoto = (photo) => photo.split("/").pop().replace(/\.png$/i, "");

// Fields sent to clients: everything except Mongo's internal _id.
export const PUBLIC_FIELDS = { _id: 0 };

// Bound explicitly to the "pokemon" collection.
export default mongoose.model("Pokemon", pokemonSchema, "pokemon");
