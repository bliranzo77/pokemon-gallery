import { STAGES, HEIGHT_RANGES, WEIGHT_RANGES } from '../data/filters';

const slug = (s) => s.toLowerCase();

// Toggle chips backed by real checkboxes (several) or radios (one, with "Any").
function ChipGroup({ legend, field, options, filters, idPrefix, typed = false, single = false, children }) {
  const { state, update } = filters;
  const selected = state[field];
  const isOn = (key) => (single ? selected === key : selected.includes(key));
  const toggle = (key) => update({
    [field]: single ? key : selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key],
  });
  const all = single ? [{ key: '', label: 'Any' }, ...options] : options;

  return (
    <fieldset className="filter-group">
      <legend>{legend}</legend>
      <div className="filter-chips">
        {all.map(o => (
          <label
            key={o.key}
            className={typed ? 'filter-chip filter-chip-typed' : 'filter-chip'}
            style={typed ? { '--type': `var(--type-${o.key}, #8A949C)` } : undefined}
          >
            <input
              type={single ? 'radio' : 'checkbox'}
              name={single ? `${idPrefix}-${field}` : undefined}
              id={`${idPrefix}-${field}-${o.key || 'any'}`}
              checked={isOn(o.key)}
              onChange={() => toggle(o.key)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      {children}
    </fieldset>
  );
}

function FilterPanel({ filters, meta, idPrefix }) {
  const { state, update } = filters;

  if (!meta) {
    return <p className="filter-loading">Loading filters…</p>;
  }

  return (
    <div className="filter-panel">
      <ChipGroup
        legend="Type"
        field="types"
        options={meta.types.map(t => ({ key: slug(t), label: t }))}
        filters={filters}
        idPrefix={idPrefix}
        typed
      >
        <fieldset className="filter-match">
          <legend>Match</legend>
          {[['any', 'Any selected type'], ['all', 'All selected types']].map(([value, label]) => (
            <label key={value}>
              <input
                type="radio"
                name={`${idPrefix}-match`}
                value={value}
                checked={state.match === value}
                onChange={() => update({ match: value })}
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
      </ChipGroup>

      {/* Only worth a control once the data spans more than one region */}
      {meta.regions.length > 1 && (
        <ChipGroup
          legend="Region"
          field="generations"
          options={meta.regions.map(r => ({ key: r.generation, label: `Gen ${r.generation}: ${r.name}` }))}
          filters={filters}
          idPrefix={idPrefix}
        />
      )}

      <ChipGroup legend="Evolution stage" field="stages" options={STAGES} filters={filters} idPrefix={idPrefix} />
      <ChipGroup legend="Height" field="height" options={HEIGHT_RANGES} filters={filters} idPrefix={idPrefix} single />
      <ChipGroup legend="Weight" field="weight" options={WEIGHT_RANGES} filters={filters} idPrefix={idPrefix} single />
    </div>
  );
}

export default FilterPanel;
