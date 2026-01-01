import { Button } from "./ui/button.tsx";

const FILTERS = [
    { id: 'fastest', label: 'Nhanh nhất' },
    { id: 'fewest_transfers', label: 'Ít chuyển' },
    { id: 'cheapest', label: 'Rẻ nhất' },
];

interface FilterTabsProps {
    activeFilter: string;
    onChange: (filterId: string) => void;
}

export default function FilterTabs({ activeFilter, onChange }: FilterTabsProps) {
    return (
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
            {FILTERS.map((filter) => (
                <Button
                    key={filter.id}
                    type="button"
                    variant={activeFilter === filter.id ? "default" : "ghost"}
                    onClick={() => onChange(filter.id)}
                    className={`text-sm h-8 transition-colors ${activeFilter === filter.id
                            ? 'bg-red-600 text-white shadow-md hover:bg-red-700'
                            : 'text-red-600 bg-white/80 hover:bg-red-50 hover:text-red-700'
                        }`}
                >
                    {filter.label}
                </Button>
            ))}
        </div>
    );
}
