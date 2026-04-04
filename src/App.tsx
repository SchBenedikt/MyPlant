import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useParams, 
  useNavigate,
  useLocation
} from 'react-router-dom';
import { 
  Plus, 
  Search, 
  TreeDeciduous, 
  Sprout, 
  Calendar, 
  MapPin, 
  Trash2, 
  Edit2, 
  X, 
  Check,
  Leaf,
  Filter,
  Camera,
  Droplets,
  Download,
  Upload,
  BarChart3,
  ChevronRight,
  Info,
  ArrowLeft,
  History,
  TrendingUp,
  Droplet,
  Map as MapIcon,
  LayoutGrid,
  Move,
  ChevronLeft,
  Menu,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { GoogleGenAI, Type } from "@google/genai";
import { format, differenceInDays, parseISO, addDays } from 'date-fns';
import { de } from 'date-fns/locale';

type PlantType = 'Baum' | 'Strauch' | 'Blume' | 'Gemüse' | 'Sonstiges';
type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'type-asc' | 'water-needed';

interface WateringEvent {
  date: string;
  notes?: string;
}

interface DiaryEntry {
  id: string;
  date: string;
  text: string;
  image?: string;
}

interface Plant {
  id: string;
  name: string;
  type: PlantType;
  datePlanted: string;
  location: string;
  notes: string;
  images: string[];
  lastWatered?: string;
  wateringInterval?: number;
  history: WateringEvent[];
  diary: DiaryEntry[];
  isOutdoor: boolean;
  health?: string;
  size?: string;
  age?: string;
  mapPosition?: { x: number; y: number };
}

const PLANT_TYPES: PlantType[] = ['Baum', 'Strauch', 'Blume', 'Gemüse', 'Sonstiges'];

// --- Helper Functions ---
const getWateringStatus = (plant: Plant) => {
  if (plant.isOutdoor) return 'outdoor';
  if (!plant.lastWatered || !plant.wateringInterval) return 'unknown';
  const last = parseISO(plant.lastWatered);
  const diffDays = differenceInDays(new Date(), last);
  if (diffDays >= plant.wateringInterval) return 'thirsty';
  if (diffDays >= plant.wateringInterval * 0.8) return 'soon';
  return 'ok';
};

// --- Components ---

function Sidebar({ 
  onExport, 
  onImport, 
  isCollapsed, 
  setIsCollapsed 
}: { 
  onExport: () => void, 
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void,
  isCollapsed: boolean,
  setIsCollapsed: (v: boolean) => void
}) {
  const location = useLocation();

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-m3-surface border-r border-m3-outline/10 flex flex-col z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}>
      <div className="p-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity overflow-hidden">
          <div className="bg-m3-primary text-m3-on-primary p-3 rounded-2xl shrink-0">
            <TreeDeciduous className="w-6 h-6" />
          </div>
          {!isCollapsed && (
            <div className="whitespace-nowrap">
              <h1 className="text-2xl font-display font-extrabold tracking-tight text-m3-primary leading-none">MyPlant</h1>
              <p className="text-[10px] uppercase font-black tracking-widest text-m3-primary/50 mt-1">Smart Garden Diary</p>
            </div>
          )}
        </Link>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex m3-btn-ghost !p-2 ml-2"
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 py-4">
        <Link 
          to="/" 
          className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${location.pathname === '/' ? 'bg-m3-primary-container text-m3-on-primary-container' : 'hover:bg-m3-surface-container-high'}`}
          title="Dashboard"
        >
          <LayoutGrid className="w-6 h-6 shrink-0" />
          {!isCollapsed && <span className="font-bold whitespace-nowrap">Dashboard</span>}
        </Link>
        <Link 
          to="/plants" 
          className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${location.pathname === '/plants' ? 'bg-m3-primary-container text-m3-on-primary-container' : 'hover:bg-m3-surface-container-high'}`}
          title="Pflanzen-Liste"
        >
          <Sprout className="w-6 h-6 shrink-0" />
          {!isCollapsed && <span className="font-bold whitespace-nowrap">Pflanzen-Liste</span>}
        </Link>
        <Link 
          to="/map" 
          className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${location.pathname === '/map' ? 'bg-m3-primary-container text-m3-on-primary-container' : 'hover:bg-m3-surface-container-high'}`}
          title="Garten-Karte"
        >
          <MapIcon className="w-6 h-6 shrink-0" />
          {!isCollapsed && <span className="font-bold whitespace-nowrap">Garten-Karte</span>}
        </Link>
      </nav>

      <div className="p-4 border-t border-m3-outline/10 space-y-2">
        <button 
          onClick={onExport} 
          className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-m3-surface-container-high transition-all text-left"
          title="Export"
        >
          <Download className="w-6 h-6 shrink-0" />
          {!isCollapsed && <span className="font-bold whitespace-nowrap">Export</span>}
        </button>
        <label 
          className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-m3-surface-container-high transition-all cursor-pointer"
          title="Import"
        >
          <Upload className="w-6 h-6 shrink-0" />
          {!isCollapsed && <span className="font-bold whitespace-nowrap">Import</span>}
          <input type="file" className="hidden" accept=".json" onChange={onImport} />
        </label>
      </div>
    </aside>
  );
}

function PlantCard({ plant, onEdit, onDelete, onWater }: { 
  plant: Plant, 
  onEdit: (p: Plant) => void, 
  onDelete: (id: string) => void,
  onWater: (id: string) => void,
  key?: string | number
}) {
  const waterStatus = getWateringStatus(plant);
  const nextWatering = !plant.isOutdoor && plant.lastWatered && plant.wateringInterval 
    ? addDays(parseISO(plant.lastWatered), plant.wateringInterval)
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="m3-card group flex flex-col h-full"
    >
      <Link to={`/plant/${plant.id}`} className="relative h-48 -mx-6 -mt-6 mb-6 overflow-hidden bg-m3-surface-container-highest block rounded-t-[24px]">
        {plant.images && plant.images.length > 0 ? (
          <img src={plant.images[0]} alt={plant.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-m3-primary/10">
            <TreeDeciduous className="w-16 h-16" />
          </div>
        )}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <span className={`m3-badge ${
            waterStatus === 'thirsty' ? 'bg-rose-500 text-white border-rose-600' : 
            waterStatus === 'soon' ? 'bg-amber-400 text-amber-900 border-amber-500' : 
            waterStatus === 'outdoor' ? 'bg-sky-500 text-white border-sky-600' :
            'bg-m3-primary text-white border-m3-primary'
          }`}>
            {waterStatus === 'thirsty' ? 'Wasserbedarf' : 
             waterStatus === 'soon' ? 'Bald gießen' : 
             waterStatus === 'outdoor' ? 'Draußen (Autark)' : 'OK'}
          </span>
          {plant.isOutdoor && (
            <span className="m3-badge bg-m3-secondary text-white border-m3-secondary">Outdoor</span>
          )}
        </div>
      </Link>

      <div className="flex justify-between items-start mb-4">
        <Link to={`/plant/${plant.id}`} className="flex-1">
          <h3 className="text-xl font-display font-bold text-m3-on-surface hover:text-m3-primary transition-colors">{plant.name}</h3>
          <span className="text-[10px] font-black text-m3-secondary uppercase tracking-widest">{plant.type}</span>
        </Link>
        <div className="flex gap-1">
          <button onClick={(e) => { e.preventDefault(); onEdit(plant); }} className="m3-btn-ghost"><Edit2 className="w-4 h-4" /></button>
          <button onClick={(e) => { e.preventDefault(); onDelete(plant.id); }} className="m3-btn-ghost text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="space-y-2 flex-1 text-sm font-medium text-m3-on-surface-variant">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 opacity-40" />
          <span>{plant.location || 'Kein Standort'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 opacity-40" />
          <span>Gepflanzt: {format(parseISO(plant.datePlanted), 'dd. MMM yyyy', { locale: de })}</span>
        </div>
        {nextWatering && (
          <div className="flex items-center gap-2 text-m3-primary">
            <Droplet className="w-4 h-4" />
            <span>Nächstes Gießen: {format(nextWatering, 'dd.MM.')}</span>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-m3-outline/10 flex items-center justify-between">
        <Link to={`/plant/${plant.id}`} className="text-xs font-bold text-m3-primary flex items-center gap-1 hover:underline">
          Details <ChevronRight className="w-3 h-3" />
        </Link>
        <button 
          onClick={() => onWater(plant.id)}
          className="m3-btn-secondary !py-2 !px-4 !text-xs"
        >
          <Droplets className="w-3 h-3" />
          Gießen
        </button>
      </div>
    </motion.div>
  );
}

function Dashboard({ stats, plants }: { stats: any, plants: Plant[] }) {
  return (
    <main className="max-w-7xl mx-auto px-6 sm:px-12 py-12">
      <div className="mb-12">
        <h2 className="text-4xl font-display font-black text-m3-primary">Dashboard</h2>
        <p className="text-m3-on-surface-variant mt-2">Willkommen zurück! Hier ist eine Übersicht deines Gartens.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {/* Total Plants */}
        <div className="bg-m3-primary-container text-m3-on-primary-container p-8 rounded-[32px] border border-m3-primary/5 flex flex-col justify-between min-h-[200px]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Gesamtbestand</p>
            <h2 className="text-6xl font-display font-black">{stats.total}</h2>
          </div>
          <div className="flex gap-4 text-xs font-bold opacity-70">
            <span className="flex items-center gap-1"><Leaf className="w-3 h-3" /> {stats.indoor} Indoor</span>
            <span className="flex items-center gap-1"><TreeDeciduous className="w-3 h-3" /> {stats.outdoor} Outdoor</span>
          </div>
        </div>

        {/* Avg Age */}
        <div className="bg-m3-secondary-container text-m3-on-secondary-container p-8 rounded-[32px] border border-m3-secondary/5 flex flex-col justify-between min-h-[200px]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Durchschnittsalter</p>
            <h2 className="text-6xl font-display font-black">{stats.avgAge}</h2>
            <p className="text-xs font-bold opacity-70 mt-1">Tage seit Pflanzung</p>
          </div>
          <div className="text-xs font-bold opacity-70 truncate">
            Älteste Pflanze: {stats.oldestPlantName || 'N/A'}
          </div>
        </div>

        {/* Activity */}
        <div className="bg-m3-surface-container-high p-8 rounded-[32px] border border-m3-outline/5 flex flex-col justify-between min-h-[200px]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Gießvorgänge</p>
            <h2 className="text-6xl font-display font-black">{stats.totalWateringEvents}</h2>
          </div>
          <p className="text-xs font-bold opacity-70">Ø Intervall: {stats.avgInterval} Tage</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Type Distribution */}
        <div className="m3-card !p-8">
          <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-m3-primary" /> Bestandsverteilung
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {PLANT_TYPES.map(type => (
              <div key={type} className="p-4 bg-m3-surface-container rounded-2xl border border-m3-outline/5">
                <p className="text-2xl font-display font-black text-m3-primary">{stats.byType[type] || 0}</p>
                <p className="text-[10px] font-black uppercase tracking-tighter opacity-50">{type}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity / Tips */}
        <div className="m3-card !p-8 bg-m3-tertiary-container/10 border-m3-tertiary/10">
          <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2 text-m3-tertiary">
            <Info className="w-5 h-5" /> Garten-Tipp
          </h3>
          <div className="space-y-4">
            <p className="text-m3-on-surface-variant leading-relaxed">
              {stats.total > 0 
                ? "Wusstest du schon? Regelmäßiges Dokumentieren im Tagebuch hilft dir, Krankheiten frühzeitig zu erkennen und das Wachstum deiner Pflanzen besser zu verstehen."
                : "Fange an, deinen Garten zu digitalisieren! Füge deine erste Pflanze hinzu, um Statistiken und Pflegetipps zu erhalten."}
            </p>
            <Link to="/plants" className="m3-btn-secondary inline-flex">
              Pflanzen ansehen <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function PlantOverview({ 
  plants, 
  filteredPlants, 
  searchTerm, 
  setSearchTerm, 
  filterType, 
  setFilterType, 
  sortBy, 
  setSortBy, 
  handleEdit, 
  handleDelete, 
  handleWaterPlant 
}: {
  plants: Plant[],
  filteredPlants: Plant[],
  searchTerm: string,
  setSearchTerm: (v: string) => void,
  filterType: string,
  setFilterType: (v: any) => void,
  sortBy: SortOption,
  setSortBy: (v: SortOption) => void,
  handleEdit: (p: Plant) => void,
  handleDelete: (id: string) => void,
  handleWaterPlant: (id: string) => void
}) {
  return (
    <main className="max-w-7xl mx-auto px-6 sm:px-12 py-12">
      <div className="mb-12">
        <h2 className="text-4xl font-display font-black text-m3-primary">Pflanzen-Liste</h2>
        <p className="text-m3-on-surface-variant mt-2">Verwalte und durchsuche deinen gesamten Bestand.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-6 mb-12">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" />
          <input 
            type="text"
            placeholder="Pflanze oder Standort suchen..."
            className="w-full bg-m3-surface-container h-16 pl-16 pr-6 rounded-3xl outline-none focus:ring-2 focus:ring-m3-primary/20 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <select 
            className="bg-m3-surface-container h-16 px-6 rounded-3xl font-bold text-sm outline-none cursor-pointer border-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="Alle">Alle Typen</option>
            {PLANT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select 
            className="bg-m3-surface-container h-16 px-6 rounded-3xl font-bold text-sm outline-none cursor-pointer border-none"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="date-desc">Neueste</option>
            <option value="date-asc">Älteste</option>
            <option value="name-asc">A-Z</option>
            <option value="water-needed">Wasser-Bedarf</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredPlants.map(plant => (
            <PlantCard 
              key={plant.id} 
              plant={plant} 
              onEdit={handleEdit} 
              onDelete={handleDelete}
              onWater={handleWaterPlant}
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredPlants.length === 0 && (
        <div className="py-32 text-center opacity-30">
          <Sprout className="w-20 h-20 mx-auto mb-4" />
          <p className="text-xl font-display font-bold">Keine Pflanzen gefunden</p>
        </div>
      )}
    </main>
  );
}

function PlantDetailPage({ plants, setPlants, onWater, onEdit }: { 
  plants: Plant[], 
  setPlants: React.Dispatch<React.SetStateAction<Plant[]>>, 
  onWater: (id: string) => void, 
  onEdit: (p: Plant) => void 
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const plant = plants.find(p => p.id === id);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [diaryText, setDiaryText] = useState('');
  const [diaryImage, setDiaryImage] = useState<string | null>(null);
  const diaryFileRef = useRef<HTMLInputElement>(null);

  if (!plant) return <div className="p-12 text-center">Pflanze nicht gefunden.</div>;

  const handleAddDiaryEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diaryText.trim()) return;

    const newEntry: DiaryEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      text: diaryText,
      image: diaryImage || undefined
    };

    setPlants(prev => prev.map(p => p.id === plant.id ? {
      ...p,
      diary: [newEntry, ...(p.diary || [])]
    } : p));

    setDiaryText('');
    setDiaryImage(null);
  };

  const handleDiaryImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const r = new FileReader();
      r.onload = () => setDiaryImage(r.result as string);
      r.readAsDataURL(file);
    }
  };

  const waterStatus = getWateringStatus(plant);
  
  // Prepare chart data (watering frequency)
  const chartData = plant.history.slice(-7).map(event => ({
    date: format(parseISO(event.date), 'dd.MM.'),
    val: 1
  }));

  const mainImage = plant.images && plant.images.length > 0 ? plant.images[0] : null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <button onClick={() => navigate(-1)} className="m3-btn-ghost mb-8 flex items-center gap-2">
        <ArrowLeft className="w-5 h-5" /> Zurück
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Image & Quick Info */}
        <div className="lg:col-span-1 space-y-8">
          <div className="aspect-square rounded-[40px] overflow-hidden bg-m3-surface-container-highest border border-m3-outline/10 relative group">
            {mainImage ? (
              <img src={mainImage} alt={plant.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-m3-primary/10">
                <TreeDeciduous className="w-32 h-32" />
              </div>
            )}
            {plant.isOutdoor && (
              <div className="absolute bottom-4 right-4 bg-sky-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                Outdoor
              </div>
            )}
          </div>

          {/* Gallery Section */}
          {plant.images && plant.images.length > 1 && (
            <div className="m3-card !p-6">
              <h3 className="text-sm font-black uppercase opacity-40 mb-4 flex items-center gap-2">
                <Camera className="w-4 h-4" /> Fotogalerie
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {plant.images.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedImage(img)}
                    className="aspect-square rounded-xl overflow-hidden border border-m3-outline/10 hover:border-m3-primary transition-colors"
                  >
                    <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="m3-card !p-8 space-y-6">
            <div className="flex items-center justify-between">
              <span className={`m3-badge ${
                waterStatus === 'thirsty' ? 'bg-rose-500 text-white' : 
                waterStatus === 'soon' ? 'bg-amber-400 text-amber-900' : 
                waterStatus === 'outdoor' ? 'bg-sky-500 text-white' :
                'bg-m3-primary text-white'
              }`}>
                {waterStatus === 'thirsty' ? 'Wasserbedarf' : 
                 waterStatus === 'soon' ? 'Bald gießen' : 
                 waterStatus === 'outdoor' ? 'Draußen (Autark)' : 'OK'}
              </span>
              <button onClick={() => onEdit(plant)} className="m3-btn-ghost"><Edit2 className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-m3-surface-container-highest text-m3-on-surface rounded-2xl">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase opacity-40">Tage seit Pflanzung</p>
                  <p className="font-bold">{differenceInDays(new Date(), parseISO(plant.datePlanted))} Tage</p>
                </div>
              </div>
              {plant.health && (
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-m3-tertiary-container text-m3-on-tertiary-container rounded-2xl">
                    <Leaf className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-40">Gesundheit</p>
                    <p className="font-bold">{plant.health}</p>
                  </div>
                </div>
              )}
              {plant.size && (
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-m3-surface-container-highest text-m3-on-surface rounded-2xl">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-40">Größe</p>
                    <p className="font-bold">{plant.size}</p>
                  </div>
                </div>
              )}
              {plant.age && (
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-m3-secondary-container text-m3-on-secondary-container rounded-2xl">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-40">Alter (geschätzt)</p>
                    <p className="font-bold">{plant.age}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className="p-3 bg-m3-primary-container text-m3-on-primary-container rounded-2xl">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase opacity-40">Standort</p>
                  <p className="font-bold">{plant.location || 'Nicht angegeben'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-m3-secondary-container text-m3-on-secondary-container rounded-2xl">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase opacity-40">Gepflanzt am</p>
                  <p className="font-bold">{format(parseISO(plant.datePlanted), 'dd. MMMM yyyy', { locale: de })}</p>
                </div>
              </div>
            </div>

            {!plant.isOutdoor && (
              <button 
                onClick={() => onWater(plant.id)}
                className="m3-btn-primary w-full justify-center py-4"
              >
                <Droplets className="w-5 h-5" /> Jetzt gießen
              </button>
            )}
          </div>
        </div>

        {/* Right: Details & History */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-5xl font-display font-black text-m3-primary mb-2">{plant.name}</h2>
            <p className="text-lg font-bold text-m3-secondary uppercase tracking-widest">{plant.type}</p>
          </div>

          <div className="m3-card !p-8">
            <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-m3-primary" /> Pflege-Notizen
            </h3>
            <p className="text-m3-on-surface-variant leading-relaxed whitespace-pre-wrap">
              {plant.notes || 'Keine Notizen vorhanden.'}
            </p>
          </div>

          {/* Diary Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-display font-black text-m3-primary flex items-center gap-3">
                <History className="w-6 h-6" /> Tagebuch
              </h3>
            </div>

            <div className="m3-card !p-8 bg-m3-primary-container/20 border-m3-primary/10">
              <form onSubmit={handleAddDiaryEntry} className="space-y-4">
                <textarea 
                  placeholder="Was ist heute passiert? (z.B. Erster Trieb, Düngung, Umtopfen...)"
                  className="w-full bg-m3-surface min-h-[100px] p-6 rounded-3xl border border-m3-outline/10 outline-none focus:ring-2 focus:ring-m3-primary/20 transition-all font-medium"
                  value={diaryText}
                  onChange={(e) => setDiaryText(e.target.value)}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button 
                      type="button"
                      onClick={() => diaryFileRef.current?.click()}
                      className={`m3-btn-ghost !p-3 ${diaryImage ? 'text-m3-primary bg-m3-primary/10' : ''}`}
                    >
                      <Camera className="w-6 h-6" />
                    </button>
                    <input 
                      ref={diaryFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleDiaryImage}
                    />
                    {diaryImage && (
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-m3-primary">
                        <img src={diaryImage} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setDiaryImage(null)}
                          className="absolute top-0 right-0 bg-rose-500 text-white p-0.5 rounded-bl-lg"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <button type="submit" className="m3-btn-primary" disabled={!diaryText.trim()}>
                    Eintrag speichern
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-6">
              {plant.diary && plant.diary.length > 0 ? (
                plant.diary.map((entry) => (
                  <motion.div 
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="m3-card !p-8 flex gap-6"
                  >
                    <div className="shrink-0 text-center">
                      <p className="text-2xl font-display font-black text-m3-primary">{format(parseISO(entry.date), 'dd')}</p>
                      <p className="text-[10px] font-black uppercase opacity-40">{format(parseISO(entry.date), 'MMM yyyy')}</p>
                    </div>
                    <div className="flex-1 space-y-4">
                      <p className="text-m3-on-surface-variant leading-relaxed">{entry.text}</p>
                      {entry.image && (
                        <div className="max-w-sm rounded-[24px] overflow-hidden border border-m3-outline/10">
                          <img src={entry.image} className="w-full h-auto" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 opacity-30">
                  <History className="w-12 h-12 mx-auto mb-4" />
                  <p className="font-bold">Noch keine Tagebucheinträge vorhanden.</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="m3-card !p-8">
              <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                <History className="w-5 h-5 text-m3-primary" /> Gieß-Historie
              </h3>
              <div className="space-y-4">
                {plant.history.length > 0 ? (
                  plant.history.slice().reverse().map((event, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-m3-outline/5 last:border-0">
                      <span className="font-medium">{format(parseISO(event.date), 'dd.MM.yyyy')}</span>
                      <Check className="w-4 h-4 text-m3-primary" />
                    </div>
                  ))
                ) : (
                  <p className="text-sm opacity-50 italic">Noch keine Einträge.</p>
                )}
              </div>
            </div>

            <div className="m3-card !p-8 flex flex-col">
              <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-m3-primary" /> Aktivität
              </h3>
              <div className="flex-1 min-h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1b4332" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#1b4332" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="val" stroke="#1b4332" fillOpacity={1} fill="url(#colorVal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] font-bold text-center opacity-40 mt-4 uppercase tracking-widest">Gieß-Ereignisse (letzte 7)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImage} 
              className="max-w-full max-h-full rounded-2xl object-contain"
            />
            <button className="absolute top-8 right-8 text-white p-2 hover:bg-white/10 rounded-full">
              <X className="w-8 h-8" />
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Garden Map Component ---

function GardenMap({ 
  plants, 
  setPlants, 
  mapBackground, 
  setMapBackground 
}: { 
  plants: Plant[], 
  setPlants: React.Dispatch<React.SetStateAction<Plant[]>>,
  mapBackground: string | null,
  setMapBackground: (bg: string | null) => void
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);

  const handleDragEnd = (id: string, info: any) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((info.point.x - rect.left) / rect.width) * 100;
    const y = ((info.point.y - rect.top) / rect.height) * 100;
    
    setPlants(prev => prev.map(p => p.id === id ? { ...p, mapPosition: { x, y } } : p));
    setIsDragging(null);
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setMapBackground(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-4xl font-display font-extrabold tracking-tight text-m3-primary">Garten-Karte</h2>
          <p className="text-m3-on-surface-variant mt-2">Positioniere deine Pflanzen visuell auf deinem Grundstück.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={bgInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleBgUpload} 
          />
          <button 
            onClick={() => bgInputRef.current?.click()}
            className="m3-btn-secondary"
          >
            <Camera className="w-5 h-5" />
            Luftbild hochladen
          </button>
          <Link to="/plants" className="m3-btn-ghost !border-m3-outline/20">
            <LayoutGrid className="w-5 h-5" />
            Listenansicht
          </Link>
        </div>
      </div>

      <div 
        ref={mapRef}
        className="relative w-full aspect-video bg-m3-surface-container-highest rounded-[40px] border border-m3-outline/10 overflow-hidden bg-[radial-gradient(#00000010_1px,transparent_1px)] [background-size:20px_20px]"
      >
        {/* Map Background Image */}
        {mapBackground ? (
          <img 
            src={mapBackground} 
            className="absolute inset-0 w-full h-full object-cover opacity-80" 
            alt="Garden Map Background"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-500 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-64 h-64 bg-m3-primary rounded-full blur-3xl" />
          </div>
        )}

        {/* Overlay for better contrast if background exists */}
        {mapBackground && <div className="absolute inset-0 bg-black/5 pointer-events-none" />}

        {plants.map((plant) => (
          <motion.div
            key={plant.id}
            drag
            dragMomentum={false}
            onDragStart={() => setIsDragging(plant.id)}
            onDragEnd={(_, info) => handleDragEnd(plant.id, info)}
            initial={plant.mapPosition ? { left: `${plant.mapPosition.x}%`, top: `${plant.mapPosition.y}%` } : { left: '50%', top: '50%' }}
            style={{ position: 'absolute', x: '-50%', y: '-50%' }}
            className={`z-10 cursor-grab active:cursor-grabbing group ${isDragging === plant.id ? 'z-50' : ''}`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                isDragging === plant.id ? 'scale-125 rotate-12 bg-m3-primary text-m3-on-primary' : 'bg-white text-m3-primary hover:scale-110'
              }`}>
                {plant.type === 'Baum' ? <TreeDeciduous className="w-6 h-6" /> : 
                 plant.type === 'Blume' ? <Leaf className="w-6 h-6" /> : 
                 <Sprout className="w-6 h-6" />}
              </div>
              <div className="bg-m3-surface-container-high px-3 py-1 rounded-full border border-m3-outline/10 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                <p className="text-[10px] font-bold">{plant.name}</p>
              </div>
            </div>
          </motion.div>
        ))}

        {plants.length === 0 && !mapBackground && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-m3-on-surface-variant/40">
            <MapIcon className="w-24 h-24 mb-4 opacity-20" />
            <p className="font-display font-bold text-xl">Keine Pflanzen zum Anzeigen</p>
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="m3-card bg-m3-primary-container/30 border-m3-primary/10">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-m3-primary text-m3-on-primary rounded-2xl">
              <Move className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-m3-primary">Positionierung</h3>
              <p className="text-sm text-m3-on-surface-variant mt-1">
                Ziehe die Pflanzen-Icons einfach an die gewünschte Stelle auf deinem Luftbild. 
                Die Position wird automatisch gespeichert.
              </p>
            </div>
          </div>
        </div>
        <div className="m3-card bg-emerald-100/30 border-emerald-200/50">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-800">Luftbild nutzen</h3>
              <p className="text-sm text-emerald-700/80 mt-1">
                Lade ein Foto deines Gartens von oben hoch (z.B. ein Screenshot von Google Maps oder eine Drohnenaufnahme), 
                um eine realistische Übersicht zu erhalten.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main App Component ---

export default function App() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [mapBackground, setMapBackground] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<PlantType | 'Alle'>('Alle');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSuccess, setAnalysisSuccess] = useState(false);

  const [formData, setFormData] = useState<Omit<Plant, 'id' | 'history' | 'diary'>>({
    name: '',
    type: 'Baum',
    datePlanted: new Date().toISOString().split('T')[0],
    location: '',
    notes: '',
    images: [],
    lastWatered: new Date().toISOString().split('T')[0],
    wateringInterval: 7,
    isOutdoor: false,
    health: '',
    size: '',
    age: ''
  });

  const analyzeImage = async (base64Data: string) => {
    setIsAnalyzing(true);
    setAnalysisSuccess(false);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: "Analyze this plant image. Identify the plant's real name (common and scientific name), type (Baum, Strauch, Blume, Gemüse, Sonstiges), health status, estimated size, estimated age, and detailed care instructions (Pflegehinweise). Return the result in JSON format." },
              { inlineData: { data: base64Data.split(',')[1], mimeType: "image/jpeg" } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Common name of the plant" },
              scientificName: { type: Type.STRING, description: "Scientific/Latin name of the plant" },
              type: { type: Type.STRING, enum: PLANT_TYPES },
              health: { type: Type.STRING },
              size: { type: Type.STRING },
              age: { type: Type.STRING },
              careInstructions: { type: Type.STRING },
              notes: { type: Type.STRING }
            },
            required: ["name", "scientificName", "type", "health", "size", "age", "careInstructions"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      setFormData(prev => ({
        ...prev,
        name: result.scientificName ? `${result.name} (${result.scientificName})` : (result.name || prev.name),
        type: result.type || prev.type,
        health: result.health || prev.health,
        size: result.size || prev.size,
        age: result.age || prev.age,
        notes: `${prev.notes}\n\nPflegehinweise: ${result.careInstructions}${result.notes ? `\n\nZusatz: ${result.notes}` : ''}`.trim()
      }));
      setAnalysisSuccess(true);
      setTimeout(() => setAnalysisSuccess(false), 5000);
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('myplant_data');
    const savedBg = localStorage.getItem('myplant_map_bg');
    if (savedBg) setMapBackground(savedBg);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration for old data
        const migrated = parsed.map((p: any) => ({
          ...p,
          images: p.images || (p.image ? [p.image] : []),
          isOutdoor: p.isOutdoor ?? false,
          history: p.history || [],
          diary: p.diary || []
        }));
        setPlants(migrated);
      } catch (e) {
        console.error('Fehler beim Laden', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('myplant_data', JSON.stringify(plants));
  }, [plants]);

  useEffect(() => {
    if (mapBackground) {
      localStorage.setItem('myplant_map_bg', mapBackground);
    }
  }, [mapBackground]);

  const filteredPlants = useMemo(() => {
    return plants
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             p.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'Alle' || p.type === filterType;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date-asc': return new Date(a.datePlanted).getTime() - new Date(b.datePlanted).getTime();
          case 'name-asc': return a.name.localeCompare(b.name);
          case 'type-asc': return a.type.localeCompare(b.type);
          case 'water-needed':
            const priority = { thirsty: 0, soon: 1, ok: 2, unknown: 3 };
            return priority[getWateringStatus(a)] - priority[getWateringStatus(b)];
          default: return new Date(b.datePlanted).getTime() - new Date(a.datePlanted).getTime();
        }
      });
  }, [plants, searchTerm, filterType, sortBy]);

  const stats = useMemo(() => {
    const total = plants.length;
    const thirsty = plants.filter(p => getWateringStatus(p) === 'thirsty').length;
    const outdoor = plants.filter(p => p.isOutdoor).length;
    const indoor = total - outdoor;
    const byType = PLANT_TYPES.reduce((acc, type) => {
      acc[type] = plants.filter(p => p.type === type).length;
      return acc;
    }, {} as Record<string, number>);
    
    const totalWateringEvents = plants.reduce((acc, p) => acc + (p.history?.length || 0), 0);
    const avgInterval = plants.filter(p => !p.isOutdoor && p.wateringInterval).reduce((acc, p) => acc + (p.wateringInterval || 0), 0) / (plants.filter(p => !p.isOutdoor && p.wateringInterval).length || 1);

    const ages = plants.map(p => differenceInDays(new Date(), parseISO(p.datePlanted)));
    const avgAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
    
    const oldestPlant = plants.length > 0 ? [...plants].sort((a, b) => new Date(a.datePlanted).getTime() - new Date(b.datePlanted).getTime())[0] : null;

    return { 
      total, 
      thirsty, 
      outdoor, 
      indoor, 
      byType, 
      totalWateringEvents, 
      avgInterval: Math.round(avgInterval),
      avgAge,
      oldestPlantName: oldestPlant?.name
    };
  }, [plants]);

  const handleWaterPlant = (id: string) => {
    const now = new Date().toISOString();
    setPlants(plants.map(p => p.id === id ? { 
      ...p, 
      lastWatered: now.split('T')[0],
      history: [...(p.history || []), { date: now }]
    } : p));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlant) {
      setPlants(plants.map(p => p.id === editingPlant.id ? { ...formData, id: p.id, history: p.history || [], diary: p.diary || [] } : p));
    } else {
      setPlants([...plants, { ...formData, id: crypto.randomUUID(), history: [], diary: [] }]);
    }
    setIsModalOpen(false);
    setEditingPlant(null);
  };

  const handleEdit = (plant: Plant) => {
    setEditingPlant(plant);
    setFormData({
      name: plant.name,
      type: plant.type,
      datePlanted: plant.datePlanted,
      location: plant.location,
      notes: plant.notes,
      images: plant.images || [],
      lastWatered: plant.lastWatered || new Date().toISOString().split('T')[0],
      wateringInterval: plant.wateringInterval || 7,
      isOutdoor: plant.isOutdoor || false,
      health: plant.health || '',
      size: plant.size || '',
      age: plant.age || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Löschen?')) setPlants(plants.filter(p => p.id !== id));
  };

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(plants));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = "gartenlog_backup.json";
    a.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target?.result as string);
          if (Array.isArray(imported)) setPlants(imported);
        } catch (e) { alert('Fehler beim Import'); }
      };
      reader.readAsText(file);
    }
  };

  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-m3-surface font-sans text-m3-on-surface flex">
        <Sidebar 
          onExport={exportData} 
          onImport={importData} 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
        />
        
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'pl-20' : 'pl-72'}`}>
          <Routes>
            <Route path="/" element={<Dashboard stats={stats} plants={plants} />} />
            <Route path="/plants" element={
              <PlantOverview 
                plants={plants}
                filteredPlants={filteredPlants}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterType={filterType}
                setFilterType={setFilterType}
                sortBy={sortBy}
                setSortBy={setSortBy}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                handleWaterPlant={handleWaterPlant}
              />
            } />
            <Route path="/map" element={
              <GardenMap 
                plants={plants} 
                setPlants={setPlants} 
                mapBackground={mapBackground}
                setMapBackground={setMapBackground}
              />
            } />
            <Route path="/plant/:id" element={<PlantDetailPage plants={plants} setPlants={setPlants} onWater={handleWaterPlant} onEdit={handleEdit} />} />
          </Routes>
        </div>

        <button onClick={() => { setEditingPlant(null); setIsModalOpen(true); }} className="m3-fab">
          <Plus className="w-6 h-6" /> <span>Hinzufügen</span>
        </button>

        {/* Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="relative bg-m3-surface w-full max-w-2xl rounded-[32px] overflow-hidden max-h-[90vh] flex flex-col border border-m3-outline/10">
                <div className="p-8 border-b border-m3-outline/5 flex justify-between items-center">
                  <h2 className="text-2xl font-display font-black text-m3-primary">{editingPlant ? 'Bearbeiten' : 'Neue Pflanze'}</h2>
                  <button onClick={() => setIsModalOpen(false)} className="m3-btn-ghost"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
                  <div className="space-y-4">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-40 rounded-3xl border-2 border-dashed border-m3-outline/20 flex flex-col items-center justify-center cursor-pointer hover:bg-m3-primary/5 transition-all overflow-hidden relative"
                    >
                      {formData.images && formData.images.length > 0 ? (
                        <div className="flex w-full h-full">
                          {formData.images.map((img, idx) => (
                            <img key={idx} src={img} className="h-full object-cover flex-1" style={{ maxWidth: '33.33%' }} />
                          ))}
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Plus className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Camera className="w-10 h-10 opacity-20" />
                          <p className="text-xs font-bold opacity-40 mt-2">Fotos hinzufügen</p>
                        </div>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                        const fileList = e.target.files;
                        if (!fileList) return;
                        const files = Array.from(fileList);
                        files.forEach((file: File, idx: number) => {
                          const r = new FileReader();
                          r.onload = () => {
                            const base64 = r.result as string;
                            setFormData(prev => ({...prev, images: [...prev.images, base64].slice(-6)}));
                            if (idx === 0 && !formData.name) {
                              analyzeImage(base64);
                            }
                          };
                          r.readAsDataURL(file);
                        });
                      }} />
                    </div>
                    {isAnalyzing && (
                      <div className="flex items-center gap-2 text-m3-primary animate-pulse py-2 px-4 bg-m3-primary-container rounded-xl">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-bold">KI analysiert Pflanze...</span>
                      </div>
                    )}
                    {analysisSuccess && (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-emerald-600 py-2 px-4 bg-emerald-50 rounded-xl border border-emerald-100"
                      >
                        <Check className="w-4 h-4" />
                        <span className="text-xs font-bold">Pflanze erfolgreich identifiziert!</span>
                      </motion.div>
                    )}
                    {formData.images.length > 0 && !isAnalyzing && (
                      <div className="flex gap-4">
                        <button 
                          type="button" 
                          onClick={() => analyzeImage(formData.images[0])}
                          className="text-[10px] font-black uppercase text-m3-primary hover:underline flex items-center gap-1"
                        >
                          <Search className="w-3 h-3" /> KI-Analyse erneut starten
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setFormData({...formData, images: []})}
                          className="text-[10px] font-black uppercase text-rose-500 hover:underline"
                        >
                          Alle Fotos löschen
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-m3-surface-container rounded-2xl">
                      <div className="flex-1">
                        <p className="font-bold">Outdoor-Pflanze</p>
                        <p className="text-xs opacity-60">Draußen stehende Pflanzen benötigen keine Gieß-Erinnerungen.</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, isOutdoor: !formData.isOutdoor})}
                        className={`w-14 h-8 rounded-full transition-colors relative ${formData.isOutdoor ? 'bg-m3-primary' : 'bg-m3-outline/20'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${formData.isOutdoor ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase opacity-40 px-2">Name der Pflanze</label>
                        <input required placeholder="Name" className="m3-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        <p className="text-[10px] opacity-40 px-2">Der Name deiner Pflanze (z.B. Tomate 'Roma').</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase opacity-40 px-2">Pflanzentyp</label>
                        <select className="m3-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                          {PLANT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <p className="text-[10px] opacity-40 px-2">Wähle die Kategorie deiner Pflanze.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase opacity-40 px-2">Gesundheit</label>
                        <input placeholder="Gesundheit (KI)" className="m3-input" value={formData.health} onChange={e => setFormData({...formData, health: e.target.value})} />
                        <p className="text-[10px] opacity-40 px-2">Zustand der Pflanze (wird oft von der KI erkannt).</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase opacity-40 px-2">Größe</label>
                        <input placeholder="Größe (KI)" className="m3-input" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} />
                        <p className="text-[10px] opacity-40 px-2">Aktuelle Größe oder Wuchshöhe.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase opacity-40 px-2">Alter</label>
                        <input placeholder="Alter (KI)" className="m3-input" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                        <p className="text-[10px] opacity-40 px-2">Geschätztes oder bekanntes Alter.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase opacity-40 px-2">Auspflanzdatum</label>
                        <input type="date" className="m3-input" value={formData.datePlanted} onChange={e => setFormData({...formData, datePlanted: e.target.value})} />
                        <p className="text-[10px] opacity-40 px-2">Wann wurde die Pflanze eingepflanzt?</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase opacity-40 px-2">Standort</label>
                      <input placeholder="Standort" className="m3-input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                      <p className="text-[10px] opacity-40 px-2">Wo steht die Pflanze? (z.B. Süd-Beet, Balkon).</p>
                    </div>

                    {!formData.isOutdoor && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase opacity-40 px-2">Gieß-Intervall (Tage)</label>
                          <input type="number" placeholder="Gieß-Intervall" className="m3-input" value={formData.wateringInterval} onChange={e => setFormData({...formData, wateringInterval: parseInt(e.target.value) || 7})} />
                          <p className="text-[10px] opacity-40 px-2">Wie oft muss gegossen werden?</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase opacity-40 px-2">Zuletzt gegossen</label>
                          <input type="date" className="m3-input" value={formData.lastWatered} onChange={e => setFormData({...formData, lastWatered: e.target.value})} />
                          <p className="text-[10px] opacity-40 px-2">Wann hast du zuletzt gegossen?</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase opacity-40 px-2">Notizen & Pflegehinweise</label>
                      <textarea placeholder="Notizen" rows={3} className="m3-input resize-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                      <p className="text-[10px] opacity-40 px-2">Zusätzliche Infos oder KI-generierte Tipps.</p>
                    </div>
                  </div>
                  <button type="submit" className="m3-btn-primary w-full justify-center h-16 text-lg">Speichern</button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Router>
  );
}
