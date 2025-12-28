import { FiArrowDown } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface VideoHeroProps {
  onStartClick: () => void;
}

export const VideoHero = ({ onStartClick }: VideoHeroProps) => {
  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-black">
      
      {/* 1. VIDEO BACKGROUND */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover opacity-90 blur-sm"
      >
        <source src="/videos/intro.mp4" type="video/mp4" />
        Trình duyệt của bạn không hỗ trợ thẻ video.
      </video>

      {/* 2. LỚP GRADIENT ĐEN */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 z-10"></div>

    

      {/* 4. NỘI DUNG CHÍNH */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4 pt-16 pb-12">
        
        {/* Tiêu đề chính */}
        <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-8xl font-extrabold text-white mb-6 drop-shadow-2xl tracking-tighter"
        >
          Hust<span className="text-red-500">Bus</span>
        </motion.h1>
        
        {/* Mô tả */}
        <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-2xl text-gray-200 mb-12 max-w-2xl font-light leading-snug drop-shadow-md"
        >
          Dữ liệu thời gian thực. Lộ trình tối ưu. <br className='hidden sm:inline'/>Kết nối giao thông công cộng.
        </motion.p>
        
        {/* Nút bấm */}
        <motion.button 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStartClick}
            className="group relative flex items-center gap-3 px-8 py-4 bg-red-600 text-white font-bold rounded-full text-lg shadow-xl hover:bg-red-500 hover:shadow-red-500/50 transition-all duration-300"
        >
            Bắt đầu hành trình
            <FiArrowDown className="h-5 w-5 group-hover:translate-y-0.5 transition-transform duration-300"/>
        </motion.button>
      </div>
    </div>
  );
};