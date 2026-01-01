import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Radio } from 'lucide-react';

const STATIONS = [
  {
    name: "Lofi Beats",
    genre: "Chill / Study",
    color: "from-purple-500 to-indigo-500",
    url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3" // Example standard lofi clip
  },
  {
    name: "City Rain",
    genre: "Ambient",
    color: "from-blue-400 to-gray-500",
    url: "https://cdn.pixabay.com/download/audio/2022/07/04/audio_06d39d942d.mp3?filename=rain-and-thunder-115364.mp3"
  },
  {
    name: "Synthwave",
    genre: "Night Drive",
    color: "from-pink-500 to-purple-800",
    url: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=synthwave-80s-11004.mp3"
  }
];

export default function BusRadio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isExpanded, setIsExpanded] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const station = STATIONS[currentStationIndex];

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(station.url);
      audioRef.current.loop = true;
    } else {
      // Change source if station changed
      // Check if src is different
      if (audioRef.current.src !== station.url) {
        const wasPlaying = !audioRef.current.paused;
        audioRef.current.src = station.url;
        if (wasPlaying) audioRef.current.play();
      }
    }
    audioRef.current.volume = volume;
  }, [currentStationIndex, volume, station.url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const nextStation = () => {
    setCurrentStationIndex((prev) => (prev + 1) % STATIONS.length);
  };

  const prevStation = () => {
    setCurrentStationIndex((prev) => (prev - 1 + STATIONS.length) % STATIONS.length);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="absolute top-4 right-4 z-[1000] bg-white text-navy p-3 rounded-full shadow-lg hover:scale-110 transition-transform border-2 border-gray-100 flex items-center justify-center gap-2"
      >
        <Radio size={20} className="text-orange" />
        <span className="font-bold text-xs">Bus Radio</span>
      </button>
    );
  }

  return (
    <div className="absolute top-4 right-4 z-[1000] w-64 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-white/50 transition-all animate-in fade-in zoom-in-95 duration-200">
      {/* Header / Display */}
      <div className={`h-24 bg-gradient-to-r ${station.color} p-4 text-white relative flex flex-col justify-end`}>
        <div className="absolute top-2 right-2 cursor-pointer opacity-70 hover:opacity-100" onClick={() => setIsExpanded(false)}>
          ✖
        </div>
        <div className="absolute top-2 left-2 flex gap-1">
          <div className="w-1 h-4 bg-white/30 animate-pulse rounded-full"></div>
          <div className="w-1 h-6 bg-white/30 animate-pulse delay-75 rounded-full"></div>
          <div className="w-1 h-3 bg-white/30 animate-pulse delay-150 rounded-full"></div>
        </div>
        <h3 className="font-bold text-lg leading-tight">{station.name}</h3>
        <p className="text-xs opacity-80">{station.genre}</p>
      </div>

      {/* Controls */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center text-navy">
          <button onClick={prevStation} className="hover:text-orange transition-colors"><SkipBack size={20} /></button>
          <button
            onClick={togglePlay}
            className="w-12 h-12 flex items-center justify-center bg-navy text-white rounded-full shadow-lg hover:bg-orange transition-colors active:scale-95"
          >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
          </button>
          <button onClick={nextStation} className="hover:text-orange transition-colors"><SkipForward size={20} /></button>
        </div>

        <div className="flex items-center gap-2 text-gray-400">
          <Volume2 size={16} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-navy"
          />
        </div>
      </div>
    </div>
  );
}
