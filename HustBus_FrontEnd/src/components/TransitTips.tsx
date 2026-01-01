import { Lightbulb, BadgeCheck, Clock, Ticket } from 'lucide-react';

export default function TransitTips() {
  const tips = [
    {
      icon: <Ticket className="w-4 h-4 text-orange" />,
      text: "Vé lượt 10.000đ/lượt, vé tháng ưu tiên 140.000đ/tháng."
    },
    {
      icon: <Clock className="w-4 h-4 text-blue-500" />,
      text: "Xe buýt hoạt động từ 5h00 - 22h00 hàng ngày."
    },
    {
      icon: <BadgeCheck className="w-4 h-4 text-green-500" />,
      text: "Chuẩn bị tiền lẻ hoặc thẻ vé trước khi lên xe."
    },
    {
      icon: <Lightbulb className="w-4 h-4 text-yellow-500" />,
      text: "Nhường ghế cho người già, phụ nữ mang thai và trẻ em."
    }
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="font-semibold text-navy mb-4 flex items-center">
        <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
        Mẹo di chuyển
      </h3>
      <ul className="space-y-4">
        {tips.map((tip, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0 bg-gray-50 p-1.5 rounded-full">
              {tip.icon}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{tip.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
