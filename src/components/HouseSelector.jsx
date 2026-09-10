import React from 'react';

const HouseSelector = ({ houses, selectedHouseId, onSelect, onAddClick }) => {
  if (!houses.length) return null;

  const useTabs = houses.length <= 3;

  return (
    <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
      {useTabs ? (
        <div className="flex flex-wrap gap-2">
          {houses.map((house) => (
            <button
              key={house.id}
              type="button"
              onClick={() => onSelect(house.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedHouseId === house.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {house.name}
            </button>
          ))}
        </div>
      ) : (
        <select
          value={selectedHouseId || ''}
          onChange={(e) => onSelect(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
        >
          {houses.map((house) => (
            <option key={house.id} value={house.id}>
              {house.name}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        onClick={onAddClick}
        className="inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Добавить домик
      </button>
    </div>
  );
};

export default HouseSelector;
