function TypePill({ type }) {
  return (
    <span className="type-pill" style={{ '--type': `var(--type-${type.toLowerCase()}, #8A949C)` }}>
      {type}
    </span>
  );
}

export default TypePill;
