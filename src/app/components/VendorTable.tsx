import { useState } from "react";

export default function VendorsTable({ vendors }) {
  const [ratingFilter, setRatingFilter] = useState(null);
  const [tierFilter, setTierFilter] = useState(null);
  const [sortBy, setSortBy] = useState(null);

  // Filtering
  const filteredVendors = vendors.filter(v => {
    const meetsRating = ratingFilter ? v.avgRating >= ratingFilter : true;
    const meetsTier = tierFilter
      ? v.tiers?.some(t => t.tier === tierFilter)
      : true;
    return meetsRating && meetsTier;
  });

  // Sorting
  const sortedVendors = [...filteredVendors].sort((a, b) => {
    if (sortBy === "rating") return b.avgRating - a.avgRating;
    if (sortBy === "tierCost") {
      const getTierCost = v =>
        v.tiers?.find(t => t.tier === tierFilter)?.cost || Infinity;
      return getTierCost(a) - getTierCost(b);
    }
    return 0;
  });

  return (
    <div className="p-4">
      {/* Filters */}
      <div className="flex gap-4 mb-4">
        {/* Rating filter dropdown */}
        <select
          onChange={e => setRatingFilter(parseFloat(e.target.value) || null)}
          className="border rounded p-1"
        >
          <option value="">Any rating</option>
          {[2, 2.5, 3, 3.5, 4, 4.5].map(r => (
            <option key={r} value={r}>
              {r} ★
            </option>
          ))}
        </select>

        {/* Tier filter dropdown */}
        <select
          onChange={e => setTierFilter(e.target.value || null)}
          className="border rounded p-1"
        >
          <option value="">Any tier</option>
          <option value="Tier 1">Tier 1</option>
          <option value="Tier 2">Tier 2</option>
          <option value="Tier 3">Tier 3</option>
        </select>

        {/* Sort dropdown */}
        <select
          onChange={e => setSortBy(e.target.value || null)}
          className="border rounded p-1"
        >
          <option value="">No sort</option>
          <option value="rating">Sort by rating</option>
          <option value="tierCost">Sort by tier cost</option>
        </select>
      </div>

      {/* Table */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-2">Vendor</th>
            <th className="text-left p-2">Capabilities</th>
            <th className="text-left p-2">Platforms</th>
            <th className="text-left p-2">Tier Cost</th>
            <th className="text-left p-2">Avg ★</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sortedVendors.map(v => (
            <tr key={v.id} className="border-t">
              <td className="p-2 font-semibold">{v.name}</td>
              <td className="p-2">{v.capabilities.map(c => c.slug).join(", ")}</td>
              <td className="p-2">{v.platforms.join(", ")}</td>
              <td className="p-2">
                {v.tiers
                  ? `$${v.tiers.find(t => t.tier === tierFilter)?.cost || v.minTierCost}/hr`
                  : `$${v.minTierCost}/hr`}
              </td>
              <td className="p-2">{v.avgRating}</td>
              <td className="p-2">
                <button className="bg-blue-500 text-white px-2 py-1 rounded">
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
