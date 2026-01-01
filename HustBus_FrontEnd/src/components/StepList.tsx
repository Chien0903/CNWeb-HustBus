import { Clock, DollarSign, Footprints, Bus } from 'lucide-react';

interface StepListProps {
    steps: any[];
}

export default function StepList({ steps }: StepListProps) {
    // Filter out walk steps with 0 distance and no significant wait time
    const filteredSteps = steps.filter((step) => {
        return !(step.lineId === 'walk' && step.distance === 0 && (!step.waitTime || step.waitTime < 1));
    });

    // Format wait time with improved logic
    const formatWaitTime = (status: string, waitTime: number) => {
        if (!status && !waitTime) return null;

        // Parse existing status messages
        if (status) {
            if (status.includes('Đúng giờ') || status === 'Đúng giờ') {
                return 'Khởi hành ngay';
            }
            if (status.includes('Sớm')) {
                const match = status.match(/Sớm (\d+)/);
                if (match) {
                    return `Thời gian chờ dự kiến: ${match[1]} phút`;
                }
            }
            if (status.includes('Trễ')) {
                const match = status.match(/Trễ (\d+)/);
                if (match) {
                    return `Chờ chuyến tiếp theo: ${match[1]} phút`;
                }
            }
        }

        // Use waitTime if provided
        if (waitTime) {
            if (waitTime === 0) return 'Khởi hành ngay';
            return `Thời gian chờ dự kiến: ${waitTime} phút`;
        }

        return status;
    };

    return (
        <ol className="relative border-l-2 border-gray-200 ml-3 space-y-8 py-4">
            {filteredSteps.map((step, index) => {
                const isWalk = step.lineId === 'walk';
                const isTransfer = step.isTransfer || (index > 0 && !isWalk && filteredSteps[index - 1].lineId !== 'walk');
                const waitTimeText = formatWaitTime(step.status, step.waitTime);

                return (
                    <li key={`${step.lineId}-${index}`} className={`relative pl-8 ${isTransfer ? 'mt-8' : ''}`}>
                        <span className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white ${isWalk ? 'bg-gray-400' : 'bg-blue-600'
                            }`}></span>

                        {isTransfer && (
                            <div className="mb-3 p-2 bg-orange/10 text-orange rounded-lg text-sm font-medium inline-flex items-center gap-2">
                                <span>🔄</span>
                                <strong>Chuyển Tuyến</strong>
                            </div>
                        )}

                        <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${isWalk ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {isWalk ? <Footprints className="h-3 w-3 inline mr-1" /> : <Bus className="h-3 w-3 inline mr-1" />}
                                    {isWalk ? 'Đi bộ' : step.lineName}
                                </span>
                                <strong className="text-navy">{step.title}</strong>
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                {step.duration} phút • {step.distance.toFixed(1)} km
                            </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">{step.instruction}</p>

                        <div className="flex flex-wrap gap-3 text-xs">
                            {!isWalk && step.cost > 0 && (
                                <span className="flex items-center gap-1 text-green-600 font-medium">
                                    <DollarSign className="h-3 w-3" />
                                    Giá vé: {step.cost.toLocaleString()}₫
                                </span>
                            )}
                            {waitTimeText && (
                                <span className="flex items-center gap-1 text-orange font-medium">
                                    <Clock className="h-3 w-3" />
                                    {waitTimeText}
                                </span>
                            )}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
