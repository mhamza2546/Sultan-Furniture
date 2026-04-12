import React, { useState } from 'react';
import { Trash2, Plus, BookOpen, CheckCircle2 } from 'lucide-react';

function DynamicBOM() {
  const [productName, setProductName] = useState('');
  const [recipeItems, setRecipeItems] = useState([
    { material: 'Sheesham Wood', qty: 25, unit: 'Cubic ft' },
    { material: 'Screws', qty: 150, unit: 'Pieces' }
  ]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [qty, setQty] = useState('');

  const handleAdd = () => {
    if (!selectedMaterial || !qty) return;
    const units = { 'Sheesham Wood': 'Cubic ft', 'Varnish': 'Liters', 'Glue': 'Kg', 'Screws': 'Pieces', 'Fabric': 'Meters' };
    setRecipeItems([...recipeItems, { material: selectedMaterial, qty: Number(qty), unit: units[selectedMaterial] || 'Pcs' }]);
    setSelectedMaterial('');
    setQty('');
  };

  const handleRemove = (index) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Product Name */}
      <div>
        <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Target Product Name
        </label>
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="form-control bg-light border-0 fw-semibold"
          style={{ padding: '12px 16px', borderRadius: '12px' }}
          placeholder="e.g. Vintage Chair..."
        />
      </div>

      {/* Materials List */}
      <div>
        <h6 className="d-flex align-items-center gap-2 mb-3" style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          <BookOpen className="w-3.5 h-3.5" />
          Required Materials
        </h6>

        <ul className="list-unstyled d-flex flex-column gap-2 mb-4 overflow-auto pe-1" style={{ maxHeight: '200px' }}>
          {recipeItems.length === 0 ? (
            <li className="text-center py-4 bg-light text-secondary small fw-semibold rounded-3 border border-1" style={{ borderStyle: 'dashed !important' }}>
              No materials added yet
            </li>
          ) : (
            recipeItems.map((item, index) => (
              <li
                key={index}
                className="d-flex align-items-center justify-content-between p-3 bg-white border rounded-3 position-relative group"
              >
                <span className="text-dark fw-bold small">{item.material}</span>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-white text-dark border shadow-sm px-2 py-1">
                    <span style={{ color: '#C5A059' }}>{item.qty}</span> {item.unit}
                  </span>
                  <button
                    onClick={() => handleRemove(index)}
                    className="btn btn-sm btn-light text-danger p-1 rounded-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>

        {/* Add Material Row */}
        <div className="p-3 bg-light rounded-4 border border-1">
          <p className="mb-2" style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Add Material</p>
          
          <div className="row g-2 mb-3">
            <div className="col-8">
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="form-select bg-white border-1 fw-semibold small"
                style={{ height: '44px' }}
              >
                <option value="">Select Material...</option>
                <option>Sheesham Wood</option>
                <option>Varnish</option>
                <option>Glue</option>
                <option>Screws</option>
                <option>Fabric</option>
              </select>
            </div>
            <div className="col-4">
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="form-control bg-white border-1 fw-semibold text-center small"
                style={{ height: '44px' }}
                placeholder="Qty"
                min="1"
              />
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={!selectedMaterial || !qty}
            className="btn btn-dark w-100 d-flex align-items-center justify-content-center gap-2 fw-bold"
            style={{ height: '44px', borderRadius: '10px' }}
          >
            <Plus className="w-4 h-4" />
            Add to List
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-3 border-top">
        <button className="btn w-100 d-flex align-items-center justify-content-center gap-2 text-white fw-bold shadow-sm"
          style={{ height: '48px', borderRadius: '12px', background: 'linear-gradient(to right, #C5A059, #8E6F3E)' }}>
          <CheckCircle2 className="w-4 h-4" />
          Save Complete Recipe
        </button>
      </div>
    </div>
  );
}

export default DynamicBOM;
