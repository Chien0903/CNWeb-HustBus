import { useState } from 'react';
import { searchBusRoutes } from '../services/api.ts';
import { Input } from './ui/input.tsx';
import { Button } from './ui/button.tsx';
import { Search, Loader2 } from 'lucide-react';

interface BusRouteSearchProps {
  onSelect: (route: any) => void;
}

export default function BusRouteSearch({ onSelect }: BusRouteSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const data = await searchBusRoutes(query) as any[];
      setResults(data);
    } catch (error) {
      console.error("Search failed", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Nhập số tuyến hoặc tên..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4" />}
          <span className="ml-2 hidden sm:inline">Tìm kiếm</span>
        </Button>
      </form>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {searched && results.length === 0 && !loading && (
          <p className="text-sm text-gray-500 text-center py-4">Không tìm thấy tuyến nào phù hợp.</p>
        )}

        {results.map((route, index) => (
          <div
            key={index}
            onClick={() => onSelect(route)}
            className="p-3 bg-white border border-gray-200 rounded-lg hover:border-orange hover:shadow-sm cursor-pointer transition-all"
          >
            <h4 className="font-bold text-navy">{route.name}</h4>
            <p className="text-sm text-gray-600">{route.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
