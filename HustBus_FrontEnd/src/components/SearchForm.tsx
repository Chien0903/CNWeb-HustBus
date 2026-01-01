import { useState } from 'react';
import useGeolocation from '../hooks/useGeolocation.ts';
import PlaceAutocomplete from './PlaceAutocomplete.tsx';
import { reverseGeocode } from '../services/geocoding.ts';
import { Button } from './ui/button.tsx';
import { Crosshair, Search } from 'lucide-react';

interface SearchFormProps {
    onSubmit: (data: { from: any; to: any }) => void;
    initialFrom?: any;
    initialTo?: any;
}

export default function SearchForm({ onSubmit, initialFrom, initialTo }: SearchFormProps) {
    const [fromPlace, setFromPlace] = useState(initialFrom || null);
    const [toPlace, setToPlace] = useState(initialTo || null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { requestPosition, loading: locating, error: geoError } = useGeolocation();

    const handleFromChange = (place: any) => {
        setFromPlace(place);
        if (place) {
            setErrors((prev) => ({ ...prev, from: '' }));
        }
    };

    const handleToChange = (place: any) => {
        setToPlace(place);
        if (place) {
            setErrors((prev) => ({ ...prev, to: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!fromPlace || !fromPlace.coords) {
            newErrors.from = 'Vui lòng chọn điểm đi từ danh sách gợi ý';
        }
        if (!toPlace || !toPlace.coords) {
            newErrors.to = 'Vui lòng chọn điểm đến từ danh sách gợi ý';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!validate()) return;
        onSubmit({
            from: fromPlace,
            to: toPlace,
        });
    };

    const handleUseLocation = async () => {
        try {
            const coords = await requestPosition();

            try {
                const locationInfo = await reverseGeocode([coords.lat, coords.lng]);
                setFromPlace({
                    label: 'Vị trí của tôi',
                    fullName: locationInfo.name,
                    coords: coords,
                });
            } catch {
                setFromPlace({
                    label: 'Vị trí của tôi',
                    coords: coords,
                });
            }

            setErrors((prev) => ({ ...prev, from: '' }));
        } catch (err: any) {
            setErrors((prev) => ({
                ...prev,
                from: err.message || geoError || 'Lỗi xác định vị trí',
            }));
        }
    };

    return (
        <form className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
                <label htmlFor="from" className="text-sm font-medium text-gray-700">Điểm đi</label>
                <div className="flex gap-2">
                    <PlaceAutocomplete
                        id="from"
                        value={fromPlace}
                        onChange={handleFromChange}
                        placeholder="Nhập địa chỉ hoặc địa điểm..."
                        error={errors.from}
                        className="flex-1"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleUseLocation}
                        disabled={locating}
                        className="shrink-0"
                        title="Sử dụng vị trí của tôi"
                    >
                        <Crosshair className={`h-4 w-4 ${locating ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                {errors.from && <p className="text-xs text-red-500">{errors.from}</p>}
            </div>

            <div className="space-y-2">
                <label htmlFor="to" className="text-sm font-medium text-gray-700">Điểm đến</label>
                <PlaceAutocomplete
                    id="to"
                    value={toPlace}
                    onChange={handleToChange}
                    placeholder="Nhập địa chỉ hoặc địa điểm..."
                    error={errors.to}
                />
                {errors.to && <p className="text-xs text-red-500">{errors.to}</p>}
            </div>

            {geoError && <p className="text-xs text-red-500">{geoError}</p>}

            <div className="pt-2">
                <Button type="submit" className="w-full bg-orange hover:bg-orange-hover text-white">
                    <Search className="mr-2 h-4 w-4" />
                    Tìm kiếm lộ trình
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                    Nhập tối thiểu 3 ký tự để tìm kiếm địa điểm.
                </p>
            </div>
        </form>
    );
}
