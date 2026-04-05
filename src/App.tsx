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
  Bot,
  MessageSquare,
  Send,
  ArrowLeft,
  History,
  TrendingUp,
  Droplet,
  Map as MapIcon,
  LayoutGrid,
  Move,
  ChevronLeft,
  Menu,
  Clock,
  Flower2,
  Carrot,
  Smartphone,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Monitor,
  Database,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';

// PWA Install Hook
function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
  };

  return { isInstallable, install };
}
import { motion, AnimatePresence, useMotionValue } from 'motion/react';
import Markdown from 'react-markdown';
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
import { de, enUS } from 'date-fns/locale';
import { Language, translations } from './translations';

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

interface Zone {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AIInsight {
  id: string;
  type: 'health' | 'growth' | 'water';
  date: string;
  data: any;
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
  zoneId?: string;
  aiInsights?: AIInsight[];
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
  setIsCollapsed,
  language,
  setLanguage
}: { 
  onExport: () => void, 
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void,
  isCollapsed: boolean,
  setIsCollapsed: (v: boolean) => void,
  language: Language,
  setLanguage: (l: Language) => void
}) {
  const location = useLocation();
  const t = translations[language];
  const { isInstallable, install } = usePWA();

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-m3-surface border-r border-m3-outline/10 hidden md:flex flex-col z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}>
      <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity overflow-hidden">
          <div className="bg-m3-primary text-m3-on-primary p-3 rounded-2xl shrink-0 border border-m3-primary/10">
            <TreeDeciduous className="w-6 h-6" />
          </div>
          {!isCollapsed && (
            <div className="whitespace-nowrap">
              <h1 className="text-2xl font-display font-black tracking-tight text-m3-primary leading-none">MyPlant</h1>
              <p className="text-[10px] uppercase font-black tracking-widest text-m3-primary/50 mt-1">Smart Garden Diary</p>
            </div>
          )}
        </Link>
        {!isCollapsed && (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex m3-btn-ghost !p-2 ml-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {isCollapsed && (
        <div className="flex justify-center mb-4">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="m3-btn-ghost !p-2"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      )}

      <nav className="flex-1 px-4 space-y-2 py-4 overflow-y-auto scrollbar-hide">
        <div className="space-y-1">
          <Link 
            to="/" 
            className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 border ${isCollapsed ? 'justify-center' : ''} ${location.pathname === '/' ? 'bg-m3-primary text-m3-on-primary border-m3-primary/10' : 'hover:bg-m3-surface-container-high text-m3-on-surface-variant border-transparent'}`}
            title={t.dashboard}
          >
            <LayoutGrid className="w-6 h-6 shrink-0" />
            {!isCollapsed && <span className="font-bold whitespace-nowrap">{t.dashboard}</span>}
          </Link>
          <Link 
            to="/plants" 
            className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 border ${isCollapsed ? 'justify-center' : ''} ${location.pathname === '/plants' ? 'bg-m3-primary text-m3-on-primary border-m3-primary/10' : 'hover:bg-m3-surface-container-high text-m3-on-surface-variant border-transparent'}`}
            title={t.plantList}
          >
            <Sprout className="w-6 h-6 shrink-0" />
            {!isCollapsed && <span className="font-bold whitespace-nowrap">{t.plantList}</span>}
          </Link>
          <Link 
            to="/map" 
            className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 border ${isCollapsed ? 'justify-center' : ''} ${location.pathname === '/map' ? 'bg-m3-primary text-m3-on-primary border-m3-primary/10' : 'hover:bg-m3-surface-container-high text-m3-on-surface-variant border-transparent'}`}
            title={t.gardenMap}
          >
            <MapIcon className="w-6 h-6 shrink-0" />
            {!isCollapsed && <span className="font-bold whitespace-nowrap">{t.gardenMap}</span>}
          </Link>
          <Link 
            to="/insights" 
            className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 border ${isCollapsed ? 'justify-center' : ''} ${location.pathname === '/insights' ? 'bg-m3-primary text-m3-on-primary border-m3-primary/10' : 'hover:bg-m3-surface-container-high text-m3-on-surface-variant border-transparent'}`}
            title={t.aiInsights}
          >
            <Bot className="w-6 h-6 shrink-0" />
            {!isCollapsed && <span className="font-bold whitespace-nowrap">{t.aiInsights}</span>}
          </Link>
          <Link 
            to="/settings" 
            className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 border ${isCollapsed ? 'justify-center' : ''} ${location.pathname === '/settings' ? 'bg-m3-primary text-m3-on-primary border-m3-primary/10' : 'hover:bg-m3-surface-container-high text-m3-on-surface-variant border-transparent'}`}
            title={t.settings}
          >
            <SettingsIcon className="w-6 h-6 shrink-0" />
            {!isCollapsed && <span className="font-bold whitespace-nowrap">{t.settings}</span>}
          </Link>
        </div>

        {!isCollapsed && (
          <div className="mt-8 px-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-m3-on-surface-variant/40 mb-4">{t.smartTip}</p>
            <div className="m3-card !p-4 bg-m3-primary-container/20 border-m3-primary/10 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Bot className="w-16 h-16 text-m3-primary" />
              </div>
              <p className="text-xs font-medium text-m3-on-surface-variant leading-relaxed relative z-10">
                {t.smartTipContent}
              </p>
            </div>
          </div>
        )}

        {isInstallable && !isCollapsed && (
          <div className="mt-8 px-4">
            <button 
              onClick={install}
              className="w-full bg-emerald-600 text-white p-4 rounded-2xl flex items-center gap-3 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
            >
              <Smartphone className="w-5 h-5" />
              <span className="font-bold text-sm">App installieren</span>
            </button>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-m3-outline/10 space-y-2 bg-m3-surface-container-low">
        <button 
          onClick={() => setLanguage(language === 'en' ? 'de' : 'en')}
          className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-m3-surface-container-high transition-all text-left text-m3-on-surface-variant"
          title={t.language}
        >
          <div className="w-6 h-6 flex items-center justify-center font-black text-xs bg-m3-secondary-container text-m3-on-secondary-container rounded-lg shrink-0">
            {language.toUpperCase()}
          </div>
          {!isCollapsed && <span className="font-bold whitespace-nowrap">{t.language}: {language === 'en' ? 'English' : 'Deutsch'}</span>}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={onExport} 
            className="flex items-center justify-center gap-2 p-4 rounded-2xl hover:bg-m3-surface-container-high transition-all text-m3-on-surface-variant border border-transparent"
            title={t.export}
          >
            <Download className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="font-bold text-xs">{t.export}</span>}
          </button>
          <label 
            className="flex items-center justify-center gap-2 p-4 rounded-2xl hover:bg-m3-surface-container-high transition-all cursor-pointer text-m3-on-surface-variant border border-transparent"
            title={t.import}
          >
            <Upload className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="font-bold text-xs">{t.import}</span>}
            <input type="file" className="hidden" accept=".json" onChange={onImport} />
          </label>
        </div>
      </div>
    </aside>
  );
}

function MobileHeader({ language }: { language: Language }) {
  const t = translations[language];
  const { isInstallable, install } = usePWA();
  return (
    <header className="md:hidden sticky top-0 left-0 right-0 h-16 bg-m3-surface/80 backdrop-blur-xl border-b border-m3-outline/10 z-50 px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-m3-primary text-m3-on-primary p-2 rounded-xl border border-m3-primary/10">
          <TreeDeciduous className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-display font-black tracking-tight text-m3-primary">MyPlant</h1>
      </div>
      <div className="flex items-center gap-2">
        {isInstallable && (
          <button 
            onClick={install}
            className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Smartphone className="w-5 h-5" />
          </button>
        )}
        <div className="w-8 h-8 flex items-center justify-center font-black text-[10px] bg-m3-secondary-container text-m3-on-secondary-container rounded-lg">
          {language.toUpperCase()}
        </div>
      </div>
    </header>
  );
}

function BottomNav({ language }: { language: Language }) {
  const location = useLocation();
  const t = translations[language];
  const { isInstallable, install } = usePWA();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-m3-surface/80 backdrop-blur-xl border-t border-m3-outline/10 flex justify-around items-center p-4 z-50 md:hidden">
      <Link 
        to="/" 
        className={`flex flex-col items-center gap-1 transition-all duration-200 ${location.pathname === '/' ? 'text-m3-primary' : 'text-m3-on-surface-variant/60'}`}
      >
        <LayoutGrid className={`w-6 h-6 ${location.pathname === '/' ? 'fill-m3-primary/20' : ''}`} />
        <span className="text-[10px] font-black uppercase tracking-tighter">{t.dashboard}</span>
      </Link>
      <Link 
        to="/plants" 
        className={`flex flex-col items-center gap-1 transition-all duration-200 ${location.pathname === '/plants' ? 'text-m3-primary' : 'text-m3-on-surface-variant/60'}`}
      >
        <Sprout className={`w-6 h-6 ${location.pathname === '/plants' ? 'fill-m3-primary/20' : ''}`} />
        <span className="text-[10px] font-black uppercase tracking-tighter">{t.plantList}</span>
      </Link>
      <Link 
        to="/map" 
        className={`flex flex-col items-center gap-1 transition-all duration-200 ${location.pathname === '/map' ? 'text-m3-primary' : 'text-m3-on-surface-variant/60'}`}
      >
        <MapIcon className={`w-6 h-6 ${location.pathname === '/map' ? 'fill-m3-primary/20' : ''}`} />
        <span className="text-[10px] font-black uppercase tracking-tighter">{t.gardenMap}</span>
      </Link>
      <Link 
        to="/insights" 
        className={`flex flex-col items-center gap-1 transition-all duration-200 ${location.pathname === '/insights' ? 'text-m3-primary' : 'text-m3-on-surface-variant/60'}`}
      >
        <Bot className={`w-6 h-6 ${location.pathname === '/insights' ? 'fill-m3-primary/20' : ''}`} />
        <span className="text-[10px] font-black uppercase tracking-tighter">{t.aiInsights}</span>
      </Link>
      <Link 
        to="/settings" 
        className={`flex flex-col items-center gap-1 transition-all duration-200 ${location.pathname === '/settings' ? 'text-m3-primary' : 'text-m3-on-surface-variant/60'}`}
      >
        <SettingsIcon className={`w-6 h-6 ${location.pathname === '/settings' ? 'fill-m3-primary/20' : ''}`} />
        <span className="text-[10px] font-black uppercase tracking-tighter">{t.settings}</span>
      </Link>
    </nav>
  );
}

function AIInsightsView({ stats, language }: { stats: any, language: Language }) {
  const t = translations[language];
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSummary = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this garden state: Total plants: ${stats.total}, Thirsty: ${stats.thirsty}, Outdoor: ${stats.outdoor}. 
                  Provide a detailed summary of the garden health and growth, and provide 3 actionable tips for the gardener in ${language === 'en' ? 'English' : 'German'}.`,
      });
      setAiSummary(response.text || '...');
    } catch (e) {
      setAiSummary('Error: Could not generate summary.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
      <div>
        <h2 className="text-5xl font-display font-black text-m3-primary mb-2">{t.aiInsights}</h2>
        <p className="text-lg font-bold text-m3-secondary uppercase tracking-widest">Smart Garden Analysis</p>
      </div>

      <div className="m3-card !p-8 bg-gradient-to-br from-m3-primary/5 to-m3-secondary/5 border-m3-primary/10 relative overflow-hidden group">
        <div className="absolute -right-8 -top-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
          <Bot className="w-48 h-48 text-m3-primary" />
        </div>
        
        <div className="relative z-10 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-m3-primary text-m3-on-primary rounded-2xl">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold">{t.aiHealthCheck}</h3>
                <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Powered by Gemini</p>
              </div>
            </div>
            <button 
              onClick={generateSummary}
              disabled={isGenerating}
              className="m3-btn-primary"
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <TrendingUp className="w-5 h-5" />
              )}
              {t.generateSummary}
            </button>
          </div>

          {aiSummary ? (
            <div className="prose prose-sm dark:prose-invert max-w-none bg-m3-surface-container/50 p-8 rounded-3xl border border-m3-outline/5 leading-relaxed">
              <Markdown>{aiSummary}</Markdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-m3-surface-container-high rounded-[32px] flex items-center justify-center">
                <Bot className="w-10 h-10 opacity-20" />
              </div>
              <p className="text-m3-on-surface-variant/60 font-medium">{t.aiSummaryPlaceholder}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Settings({ 
  language, 
  theme, 
  setTheme, 
  dbConfig, 
  setDbConfig,
  dbStatus
}: { 
  language: Language, 
  theme: 'light' | 'dark' | 'auto', 
  setTheme: (t: 'light' | 'dark' | 'auto') => void,
  dbConfig: any,
  setDbConfig: (c: any) => void,
  dbStatus: 'connected' | 'disconnected' | 'connecting'
}) {
  const t = translations[language];
  const [localDbConfig, setLocalDbConfig] = useState(dbConfig);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean, message: string } | null>(null);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/config/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localDbConfig)
      });
      const result = await response.json();
      setTestResult({ success: result.success, message: result.message || result.error });
      if (result.success) {
        setDbConfig(localDbConfig);
        localStorage.setItem('myplant_db_config', JSON.stringify(localDbConfig));
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message });
    } finally {
      setIsTesting(false);
    }
  };

  const sqlCommands = `CREATE DATABASE IF NOT EXISTS garden_db;
USE garden_db;

CREATE TABLE IF NOT EXISTS plants (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  datePlanted DATETIME NOT NULL,
  isOutdoor BOOLEAN DEFAULT FALSE,
  health VARCHAR(50),
  size VARCHAR(50),
  notes TEXT,
  images JSON,
  history JSON,
  aiInsights JSON,
  position JSON
);`;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
      <div>
        <h2 className="text-5xl font-display font-black text-m3-primary mb-2">{t.settings}</h2>
        <p className="text-lg font-bold text-m3-secondary uppercase tracking-widest">Customize your experience</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Theme Settings */}
        <div className="m3-card !p-8 space-y-6">
          <h3 className="text-xl font-display font-bold flex items-center gap-2">
            <Sun className="w-5 h-5 text-m3-primary" /> {t.theme}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: 'light', icon: Sun, label: t.light },
              { id: 'dark', icon: Moon, label: t.dark },
              { id: 'auto', icon: Monitor, label: t.auto }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setTheme(item.id as any)}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${theme === item.id ? 'border-m3-primary bg-m3-primary-container text-m3-on-primary-container' : 'border-m3-outline/10 hover:border-m3-primary/30'}`}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-xs font-bold">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Database Status */}
        <div className="m3-card !p-8 space-y-6">
          <h3 className="text-xl font-display font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-m3-primary" /> {t.databaseSettings}
          </h3>
          <div className="flex items-center gap-4 p-4 bg-m3-surface-container rounded-2xl border border-m3-outline/5">
            <div className={`w-3 h-3 rounded-full animate-pulse ${dbStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <div>
              <p className="text-xs font-black uppercase opacity-40">Status</p>
              <p className="font-bold">{dbStatus === 'connected' ? t.connected : t.disconnected}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Database Configuration */}
      <div className="m3-card !p-8 space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-display font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-m3-primary" /> MySQL Configuration
          </h3>
          <button 
            onClick={handleTestConnection}
            disabled={isTesting}
            className="m3-btn-primary"
          >
            {isTesting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-5 h-5" />}
            {t.connect}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-5">{t.dbHost}</label>
            <input 
              type="text" 
              value={localDbConfig.host} 
              onChange={e => setLocalDbConfig({ ...localDbConfig, host: e.target.value })}
              placeholder="192.168.1.100"
              className="m3-input"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-5">{t.dbPort}</label>
            <input 
              type="text" 
              value={localDbConfig.port} 
              onChange={e => setLocalDbConfig({ ...localDbConfig, port: e.target.value })}
              placeholder="3306"
              className="m3-input"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-5">{t.dbUser}</label>
            <input 
              type="text" 
              value={localDbConfig.user} 
              onChange={e => setLocalDbConfig({ ...localDbConfig, user: e.target.value })}
              placeholder="root"
              className="m3-input"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-5">{t.dbPassword}</label>
            <input 
              type="password" 
              value={localDbConfig.password} 
              onChange={e => setLocalDbConfig({ ...localDbConfig, password: e.target.value })}
              placeholder="••••••••"
              className="m3-input"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-5">{t.dbName}</label>
            <input 
              type="text" 
              value={localDbConfig.database} 
              onChange={e => setLocalDbConfig({ ...localDbConfig, database: e.target.value })}
              placeholder="garden_db"
              className="m3-input"
            />
          </div>
        </div>

        {testResult && (
          <div className={`p-4 rounded-2xl border flex items-center gap-4 ${testResult.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' : 'bg-rose-500/10 border-rose-500/20 text-rose-700'}`}>
            {testResult.success ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
            <p className="text-sm font-bold">{testResult.message}</p>
          </div>
        )}
      </div>

      {/* SQL Instructions */}
      <div className="m3-card !p-8 space-y-6">
        <h3 className="text-xl font-display font-bold flex items-center gap-2">
          <Info className="w-5 h-5 text-m3-primary" /> {t.sqlInstructions}
        </h3>
        <p className="text-sm font-medium opacity-60">{t.sqlInstructionsContent}</p>
        <div className="bg-m3-surface-container-highest p-6 rounded-2xl border border-m3-outline/10 font-mono text-xs leading-relaxed overflow-x-auto">
          <pre>{sqlCommands}</pre>
        </div>
      </div>
    </div>
  );
}

function PlantCard({ plant, onEdit, onDelete, onWater, language }: { 
  plant: Plant, 
  onEdit: (p: Plant) => void, 
  onDelete: (id: string) => void,
  onWater: (id: string) => void,
  language: Language,
  key?: string | number
}) {
  const waterStatus = getWateringStatus(plant);
  const t = translations[language];
  const nextWatering = !plant.isOutdoor && plant.lastWatered && plant.wateringInterval 
    ? addDays(parseISO(plant.lastWatered), plant.wateringInterval)
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="m3-card !p-4 sm:!p-6 group flex flex-col h-full hover:border-m3-primary/40"
    >
      <Link to={`/plant/${plant.id}`} className="relative h-40 sm:h-48 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-4 sm:mb-6 overflow-hidden bg-m3-surface-container-highest block rounded-t-[20px] sm:rounded-t-[24px] border-b border-m3-outline/5">
        {plant.images && plant.images.length > 0 ? (
          <img src={plant.images[0]} alt={plant.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-m3-primary/10">
            {plant.type === 'Baum' ? <TreeDeciduous className="w-12 h-12 sm:w-16 h-16" /> : 
             plant.type === 'Strauch' ? <Sprout className="w-12 h-12 sm:w-16 h-16" /> : 
             plant.type === 'Blume' ? <Flower2 className="w-12 h-12 sm:w-16 h-16" /> : 
             plant.type === 'Gemüse' ? <Carrot className="w-12 h-12 sm:w-16 h-16" /> : <Leaf className="w-12 h-12 sm:w-16 h-16" />}
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className={`m3-badge !px-2 !py-0.5 !text-[8px] sm:!text-[10px] ${
            waterStatus === 'thirsty' ? 'bg-rose-500 text-white border-rose-600' : 
            waterStatus === 'soon' ? 'bg-amber-400 text-amber-900 border-amber-500' : 
            waterStatus === 'outdoor' ? 'bg-sky-500 text-white border-sky-600' :
            'bg-m3-primary text-white border-m3-primary'
          }`}>
            {waterStatus === 'thirsty' ? t.thirsty : 
             waterStatus === 'soon' ? t.soon : 
             waterStatus === 'outdoor' ? t.outdoorAutark : t.ok}
          </span>
          {plant.isOutdoor && (
            <span className="m3-badge !px-2 !py-0.5 !text-[8px] sm:!text-[10px] bg-m3-secondary text-white border-m3-secondary">{t.outdoor}</span>
          )}
        </div>
      </Link>

      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <Link to={`/plant/${plant.id}`} className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-display font-bold text-m3-on-surface hover:text-m3-primary transition-colors line-clamp-1">{plant.name}</h3>
          <span className="text-[9px] sm:text-[10px] font-black text-m3-secondary uppercase tracking-widest flex items-center gap-1">
            {plant.type === 'Baum' ? <TreeDeciduous className="w-2.5 h-2.5 sm:w-3 h-3" /> : 
             plant.type === 'Strauch' ? <Sprout className="w-2.5 h-2.5 sm:w-3 h-3" /> : 
             plant.type === 'Blume' ? <Flower2 className="w-2.5 h-2.5 sm:w-3 h-3" /> : 
             plant.type === 'Gemüse' ? <Carrot className="w-2.5 h-2.5 sm:w-3 h-3" /> : <Leaf className="w-2.5 h-2.5 sm:w-3 h-3" />}
            {plant.type === 'Baum' ? t.tree : 
             plant.type === 'Strauch' ? t.shrub : 
             plant.type === 'Blume' ? t.flower : 
             plant.type === 'Gemüse' ? t.vegetable : t.other}
          </span>
        </Link>
        <div className="flex gap-0.5 sm:gap-1">
          <button onClick={(e) => { e.preventDefault(); onEdit(plant); }} className="m3-btn-ghost !p-1.5 sm:!p-2"><Edit2 className="w-3.5 h-3.5 sm:w-4 h-4" /></button>
          <button onClick={(e) => { e.preventDefault(); onDelete(plant.id); }} className="m3-btn-ghost !p-1.5 sm:!p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"><Trash2 className="w-3.5 h-3.5 sm:w-4 h-4" /></button>
        </div>
      </div>

      <div className="space-y-1.5 sm:space-y-2 flex-1 text-xs sm:text-sm font-medium text-m3-on-surface-variant">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 sm:w-4 h-4 opacity-40" />
          <span className="line-clamp-1">{plant.location || t.notSpecified}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 sm:w-4 h-4 opacity-40" />
          <span>{t.planted}: {format(parseISO(plant.datePlanted), 'dd.MM.yy', { locale: language === 'de' ? de : enUS })}</span>
        </div>
        {nextWatering && (
          <div className="flex items-center gap-2 text-m3-primary">
            <Droplet className="w-3.5 h-3.5 sm:w-4 h-4" />
            <span>{t.nextWatering}: {format(nextWatering, 'dd.MM.')}</span>
          </div>
        )}
      </div>

      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-m3-outline/10 flex items-center justify-between">
        <Link to={`/plant/${plant.id}`} className="text-[10px] sm:text-xs font-bold text-m3-primary flex items-center gap-1 hover:underline">
          {t.details} <ChevronRight className="w-3 h-3" />
        </Link>
        <button 
          onClick={() => onWater(plant.id)}
          className="m3-btn-secondary !py-1.5 !px-3 !text-[10px] sm:!text-xs border border-m3-secondary/10"
        >
          <Droplets className="w-3 h-3" />
          {t.water}
        </button>
      </div>
    </motion.div>
  );
}

function Dashboard({ stats, plants, language }: { stats: any, plants: Plant[], language: Language }) {
  const t = translations[language];
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSummary = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this garden state: Total plants: ${stats.total}, Thirsty: ${stats.thirsty}, Outdoor: ${stats.outdoor}. 
                  Provide a very short (2 sentences) summary and one actionable tip for the gardener in ${language === 'en' ? 'English' : 'German'}.`,
      });
      setAiSummary(response.text || '...');
    } catch (e) {
      setAiSummary('Error: Could not generate summary.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-12 py-8 sm:py-12 space-y-8 sm:space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl sm:text-5xl font-display font-black text-m3-primary mb-2">{t.dashboard}</h2>
          <p className="text-sm sm:text-lg font-bold text-m3-secondary uppercase tracking-widest">{t.welcomeBack}</p>
        </div>
        <button 
          onClick={generateSummary}
          disabled={isGenerating}
          className="m3-btn-primary self-start md:self-auto"
        >
          {isGenerating ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Bot className="w-5 h-5" />
          )}
          {t.generateSummary}
        </button>
      </div>

      {aiSummary && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="m3-card !p-6 bg-m3-primary-container/10 border-m3-primary/20 relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <Bot className="w-32 h-32 text-m3-primary" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 text-m3-primary">
              <Bot className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">AI Summary</span>
            </div>
            <p className="text-m3-on-surface-variant leading-relaxed italic">"{aiSummary}"</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
        {/* Total Plants */}
        <div className="bg-m3-primary-container text-m3-on-primary-container p-6 sm:p-8 rounded-[32px] border border-m3-primary/10 flex flex-col justify-between min-h-[160px] sm:min-h-[200px]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{t.totalPlants}</p>
            <h2 className="text-4xl sm:text-6xl font-display font-black">{stats.total}</h2>
          </div>
          <div className="flex gap-4 text-[10px] sm:text-xs font-bold opacity-70">
            <span className="flex items-center gap-1"><Leaf className="w-3 h-3" /> {stats.indoor} {t.indoor}</span>
            <span className="flex items-center gap-1"><TreeDeciduous className="w-3 h-3" /> {stats.outdoor} {t.outdoor}</span>
          </div>
        </div>

        {/* Avg Age */}
        <div className="bg-m3-secondary-container text-m3-on-secondary-container p-6 sm:p-8 rounded-[32px] border border-m3-secondary/10 flex flex-col justify-between min-h-[160px] sm:min-h-[200px]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{t.avgAge}</p>
            <h2 className="text-4xl sm:text-6xl font-display font-black">{stats.avgAge}</h2>
            <p className="text-[10px] sm:text-xs font-bold opacity-70 mt-1">{t.daysSincePlanting}</p>
          </div>
          <div className="text-[10px] sm:text-xs font-bold opacity-70 truncate">
            {t.oldestPlant}: {stats.oldestPlantName || 'N/A'}
          </div>
        </div>

        {/* Activity */}
        <div className="bg-m3-surface-container-high p-6 sm:p-8 rounded-[32px] border border-m3-outline/10 flex flex-col justify-between min-h-[160px] sm:min-h-[200px]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{t.wateringEvents}</p>
            <h2 className="text-4xl sm:text-6xl font-display font-black">{stats.totalWateringEvents}</h2>
          </div>
          <p className="text-[10px] sm:text-xs font-bold opacity-70">{t.avgInterval}: {stats.avgInterval} {t.days}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Type Distribution */}
        <div className="m3-card !p-6 sm:!p-8">
          <h3 className="text-lg sm:text-xl font-display font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-m3-primary" /> {t.distribution}
          </h3>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            {PLANT_TYPES.map(type => (
              <div key={type} className="p-4 bg-m3-surface-container rounded-2xl border border-m3-outline/5 hover:bg-m3-surface-container-high transition-colors flex items-center gap-4">
                <div className="p-3 bg-m3-primary/10 text-m3-primary rounded-xl shrink-0">
                  {type === 'Baum' ? <TreeDeciduous className="w-5 h-5 sm:w-6 h-6" /> : 
                   type === 'Strauch' ? <Sprout className="w-5 h-5 sm:w-6 h-6" /> : 
                   type === 'Blume' ? <Flower2 className="w-5 h-5 sm:w-6 h-6" /> : 
                   type === 'Gemüse' ? <Carrot className="w-5 h-5 sm:w-6 h-6" /> : <Leaf className="w-5 h-5 sm:w-6 h-6" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-display font-black text-m3-primary leading-none">{stats.byType[type] || 0}</p>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter opacity-50 truncate mt-1">
                    {type === 'Baum' ? t.tree : 
                     type === 'Strauch' ? t.shrub : 
                     type === 'Blume' ? t.flower : 
                     type === 'Gemüse' ? t.vegetable : t.other}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity / Tips */}
        <div className="m3-card !p-6 sm:!p-8 bg-m3-tertiary-container/10 border-m3-tertiary/10">
          <h3 className="text-lg sm:text-xl font-display font-bold mb-6 flex items-center gap-2 text-m3-tertiary">
            <Info className="w-5 h-5" /> {t.gardenTip}
          </h3>
          <div className="space-y-4">
            <p className="text-sm sm:text-base text-m3-on-surface-variant leading-relaxed">
              {stats.total > 0 
                ? t.tipContent
                : t.tipEmpty}
            </p>
            <Link to="/plants" className="m3-btn-secondary inline-flex text-sm">
              {t.viewPlants} <ChevronRight className="w-4 h-4 ml-1" />
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
  zones,
  selectedZoneId,
  setSelectedZoneId,
  sortBy, 
  setSortBy, 
  handleEdit, 
  handleDelete, 
  handleWaterPlant,
  language
}: {
  plants: Plant[],
  filteredPlants: Plant[],
  searchTerm: string,
  setSearchTerm: (v: string) => void,
  filterType: string,
  setFilterType: (v: any) => void,
  zones: Zone[],
  selectedZoneId: string,
  setSelectedZoneId: (v: string) => void,
  sortBy: SortOption,
  setSortBy: (v: SortOption) => void,
  handleEdit: (p: Plant) => void,
  handleDelete: (id: string) => void,
  handleWaterPlant: (id: string) => void,
  language: Language
}) {
  const t = translations[language];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-12 py-8 sm:py-12">
      <div className="mb-8 sm:mb-12">
        <h2 className="text-3xl sm:text-4xl font-display font-black text-m3-primary">{t.plantList}</h2>
        <p className="text-sm sm:text-base text-m3-on-surface-variant mt-2">{t.tipEmpty}</p>
      </div>

      <div className="flex flex-col gap-4 mb-8 sm:mb-12">
        <div className="relative">
          <Search className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 h-5 opacity-30" />
          <input 
            type="text"
            placeholder={t.searchPlaceholder}
            className="w-full bg-m3-surface-container h-14 sm:h-16 pl-12 sm:pl-16 pr-6 rounded-2xl sm:rounded-3xl outline-none focus:ring-2 focus:ring-m3-primary/20 transition-all font-medium border border-m3-outline/5 text-sm sm:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <select 
            className="bg-m3-surface-container h-12 sm:h-14 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm outline-none cursor-pointer border border-m3-outline/5 min-w-[120px] sm:min-w-[140px]"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="Alle">{t.allTypes}</option>
            {PLANT_TYPES.map(type => (
              <option key={type} value={type}>
                {type === 'Baum' ? t.tree : 
                 type === 'Strauch' ? t.shrub : 
                 type === 'Blume' ? t.flower : 
                 type === 'Gemüse' ? t.vegetable : t.other}
              </option>
            ))}
          </select>
          <select 
            className="bg-m3-surface-container h-12 sm:h-14 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm outline-none cursor-pointer border border-m3-outline/5 min-w-[120px] sm:min-w-[140px]"
            value={selectedZoneId}
            onChange={(e) => setSelectedZoneId(e.target.value)}
          >
            <option value="Alle">{t.allZones}</option>
            {zones.map(zone => (
              <option key={zone.id} value={zone.id}>{zone.name}</option>
            ))}
          </select>
          <select 
            className="bg-m3-surface-container h-12 sm:h-14 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm outline-none cursor-pointer border border-m3-outline/5 min-w-[120px] sm:min-w-[140px]"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="date-desc">{t.newest}</option>
            <option value="date-asc">{t.oldest}</option>
            <option value="name-asc">{t.nameAZ}</option>
            <option value="water-needed">{t.waterNeed}</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-8">
        <AnimatePresence mode="popLayout">
          {filteredPlants.map(plant => (
            <PlantCard 
              key={plant.id} 
              plant={plant} 
              onEdit={handleEdit} 
              onDelete={handleDelete}
              onWater={handleWaterPlant}
              language={language}
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredPlants.length === 0 && (
        <div className="py-32 text-center opacity-30">
          <Sprout className="w-20 h-20 mx-auto mb-4" />
          <p className="text-xl font-display font-bold">{t.noPlantsFound}</p>
        </div>
      )}
    </main>
  );
}

function AICareAssistant({ plant, language, onClose }: { plant: Plant, language: Language, onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const t = translations[language];
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a professional gardener. The user is asking about their plant: ${plant.name} (${plant.type}). 
                  Plant Info: Location: ${plant.location}, Health: ${plant.health}, Size: ${plant.size}, Age: ${plant.age}.
                  User Question: ${userMsg}.
                  Provide a helpful, concise answer in ${language === 'en' ? 'English' : 'German'}.`,
      });
      setMessages(prev => [...prev, { role: 'ai', text: response.text || '...' }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Error: Could not reach AI.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-20 sm:bottom-24 right-4 left-4 md:left-auto md:w-96 bg-m3-surface rounded-[28px] sm:rounded-[32px] shadow-2xl border border-m3-outline/10 z-[60] flex flex-col overflow-hidden h-[450px] sm:h-[500px]"
    >
      <div className="p-4 sm:p-6 bg-m3-primary text-m3-on-primary flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm leading-none">{t.aiCareChat}</h3>
            <p className="text-[9px] sm:text-[10px] opacity-60 mt-1 uppercase font-black tracking-widest">{plant.name}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-m3-surface-container-lowest scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center py-8 opacity-40">
            <MessageSquare className="w-12 h-12 mx-auto mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest">{t.askAI}</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-m3-primary text-m3-on-primary rounded-tr-none' : 'bg-m3-surface-container-high text-m3-on-surface rounded-tl-none'}`}>
              <Markdown>{m.text}</Markdown>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-m3-surface-container-high p-4 rounded-2xl rounded-tl-none flex gap-1">
              <div className="w-1.5 h-1.5 bg-m3-primary rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-m3-primary rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-m3-primary rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-m3-surface border-t border-m3-outline/5 flex gap-2">
        <input 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={t.askAI}
          className="flex-1 bg-m3-surface-container-high rounded-2xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-m3-primary/20 outline-none"
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="w-12 h-12 bg-m3-primary text-m3-on-primary rounded-2xl flex items-center justify-center disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

function PlantDetailPage({ plants, setPlants, onWater, onEdit, language }: { 
  plants: Plant[], 
  setPlants: React.Dispatch<React.SetStateAction<Plant[]>>, 
  onWater: (id: string) => void, 
  onEdit: (p: Plant) => void,
  language: Language
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const plant = plants.find(p => p.id === id);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [diaryText, setDiaryText] = useState('');
  const [diaryImage, setDiaryImage] = useState<string | null>(null);
  const diaryFileRef = useRef<HTMLInputElement>(null);
  const t = translations[language];

  if (!plant) return <div className="p-12 text-center">{t.noPlantsFound}</div>;

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

  const [activeImage, setActiveImage] = useState(0);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isAIAnalyzing, setIsAIAnalyzing] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{
    type: 'health' | 'growth' | 'water';
    data: any;
  } | null>(null);
  const waterStatus = getWateringStatus(plant);

  const runAIAction = async (action: 'health' | 'growth' | 'water') => {
    setIsAIAnalyzing(action);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      let prompt = "";
      let schema: any = {};
      let tools: any[] = [];

      if (action === 'health') {
        prompt = `Analyze the health of this plant: ${plant.name} (${plant.type}). 
                  Location: ${plant.location}, Is Outdoor: ${plant.isOutdoor}.
                  Image context: ${plant.images?.[0] ? 'Image provided' : 'No image'}. 
                  Identify specific disease indicators, nutrient deficiencies, and provide detailed care tips.`;
        schema = {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING },
            indicators: { type: Type.ARRAY, items: { type: Type.STRING } },
            deficiencies: { type: Type.ARRAY, items: { type: Type.STRING } },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } },
            pestAlert: { type: Type.STRING }
          },
          required: ["status", "indicators", "deficiencies", "tips"]
        };
      } else if (action === 'growth') {
        prompt = `Predict the growth of this plant: ${plant.name} (${plant.type}). 
                  Current size: ${plant.size}, Age: ${plant.age}, Planted: ${plant.datePlanted}.
                  Provide a 3-month projection with specific milestones and recommended care adjustments.`;
        schema = {
          type: Type.OBJECT,
          properties: {
            projection: { type: Type.STRING },
            milestones: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  month: { type: Type.STRING }, 
                  expectation: { type: Type.STRING } 
                },
                required: ["month", "expectation"]
              } 
            },
            careAdjustments: { type: Type.STRING }
          },
          required: ["projection", "milestones", "careAdjustments"]
        };
      } else if (action === 'water') {
        prompt = `Suggest an optimal watering schedule for this plant: ${plant.name} (${plant.type}). 
                  Location: ${plant.location}, Is Outdoor: ${plant.isOutdoor}. 
                  Current interval: ${plant.wateringInterval} days. 
                  Consider current weather patterns for ${plant.location || 'general climate'} and historical care patterns.`;
        tools = [{ googleSearch: {} }];
        schema = {
          type: Type.OBJECT,
          properties: {
            optimalTime: { type: Type.STRING },
            schedule: { type: Type.STRING },
            weatherContext: { type: Type.STRING },
            historicalPatterns: { type: Type.STRING }
          },
          required: ["optimalTime", "schedule", "weatherContext", "historicalPatterns"]
        };
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          tools: tools.length > 0 ? tools : undefined
        }
      });

      const result = JSON.parse(response.text || '{}');
      setAiResult({ type: action, data: result });
      
      const newInsight: AIInsight = {
        id: crypto.randomUUID(),
        type: action,
        date: new Date().toISOString(),
        data: result
      };

      setPlants(prev => prev.map(p => p.id === plant.id ? { 
        ...p, 
        aiInsights: [newInsight, ...(p.aiInsights || [])]
      } : p));
    } catch (e) {
      console.error(e);
    } finally {
      setIsAIAnalyzing(null);
    }
  };
  
  // Prepare chart data (watering frequency)
  const chartData = plant.history.slice(-7).map(event => ({
    date: format(parseISO(event.date), 'dd.MM.', { locale: language === 'de' ? de : enUS }),
    val: 1
  }));

  const mainImage = plant.images && plant.images.length > 0 ? plant.images[activeImage] : null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <button onClick={() => navigate(-1)} className="m3-btn-ghost mb-8 flex items-center gap-2">
        <ArrowLeft className="w-5 h-5" /> {t.back}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Image & Quick Info */}
        <div className="lg:col-span-1 space-y-8">
          <div className="aspect-square rounded-[40px] overflow-hidden bg-m3-surface-container-highest border border-m3-outline/10 relative group">
            {mainImage ? (
              <img src={mainImage} alt={plant.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-m3-primary/10">
                <TreeDeciduous className="w-32 h-32" />
              </div>
            )}
            {plant.isOutdoor && (
              <div className="absolute bottom-4 right-4 bg-sky-500 text-white px-3 py-1 rounded-full text-xs font-bold border border-sky-400/30">
                {t.outdoor}
              </div>
            )}
          </div>

          {/* Gallery Section */}
          {plant.images && plant.images.length > 1 && (
            <div className="m3-card !p-6">
              <h3 className="text-sm font-black uppercase opacity-40 mb-4 flex items-center gap-2">
                <Camera className="w-4 h-4" /> {t.photoGallery}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {plant.images.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImage(idx)}
                    onDoubleClick={() => setSelectedImage(img)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-m3-primary' : 'border-m3-outline/10 hover:border-m3-primary/50'}`}
                  >
                    <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
              <p className="text-[8px] uppercase font-black opacity-30 mt-4 text-center tracking-tighter">{t.doubleClickToEnlarge}</p>
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
                {waterStatus === 'thirsty' ? t.thirsty : 
                 waterStatus === 'soon' ? t.soon : 
                 waterStatus === 'outdoor' ? t.outdoorAutark : t.ok}
              </span>
              <button onClick={() => onEdit(plant)} className="m3-btn-ghost"><Edit2 className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-m3-surface-container-highest text-m3-on-surface rounded-2xl">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase opacity-40">{t.daysSincePlanting}</p>
                  <p className="font-bold">{differenceInDays(new Date(), parseISO(plant.datePlanted))} {t.days}</p>
                </div>
              </div>
              {plant.health && (
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-m3-tertiary-container text-m3-on-tertiary-container rounded-2xl">
                    <Leaf className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-40">{t.health}</p>
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
                    <p className="text-[10px] font-black uppercase opacity-40">{t.size}</p>
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
                    <p className="text-[10px] font-black uppercase opacity-40">{t.age}</p>
                    <p className="font-bold">{plant.age}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className="p-3 bg-m3-primary-container text-m3-on-primary-container rounded-2xl">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase opacity-40">{t.location}</p>
                  <p className="font-bold">{plant.location || t.notSpecified}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-m3-secondary-container text-m3-on-secondary-container rounded-2xl">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase opacity-40">{t.planted}</p>
                  <p className="font-bold">{format(parseISO(plant.datePlanted), 'dd. MMMM yyyy', { locale: language === 'de' ? de : enUS })}</p>
                </div>
              </div>
            </div>

            {!plant.isOutdoor && (
              <button 
                onClick={() => onWater(plant.id)}
                className="m3-btn-primary w-full justify-center py-4 border border-m3-primary/10"
              >
                <Droplets className="w-5 h-5" /> {t.water}
              </button>
            )}

            {/* AI Quick Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => runAIAction('health')}
                disabled={!!isAIAnalyzing}
                className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col items-center gap-1 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                title={t.aiHealthCheck}
              >
                <TrendingUp className={`w-4 h-4 text-emerald-600 ${isAIAnalyzing === 'health' ? 'animate-spin' : ''}`} />
                <span className="text-[8px] font-black uppercase text-emerald-700">{t.aiHealthCheck}</span>
              </button>
              <button 
                onClick={() => runAIAction('growth')}
                disabled={!!isAIAnalyzing}
                className="p-3 bg-purple-50 border border-purple-100 rounded-2xl flex flex-col items-center gap-1 hover:bg-purple-100 transition-colors disabled:opacity-50"
                title={t.aiGrowthPrediction}
              >
                <Calendar className={`w-4 h-4 text-purple-600 ${isAIAnalyzing === 'growth' ? 'animate-spin' : ''}`} />
                <span className="text-[8px] font-black uppercase text-purple-700">{t.aiGrowthPrediction}</span>
              </button>
              <button 
                onClick={() => runAIAction('water')}
                disabled={!!isAIAnalyzing}
                className="p-3 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col items-center gap-1 hover:bg-blue-100 transition-colors disabled:opacity-50"
                title={t.aiWateringSuggestion}
              >
                <Droplets className={`w-4 h-4 text-blue-600 ${isAIAnalyzing === 'water' ? 'animate-spin' : ''}`} />
                <span className="text-[8px] font-black uppercase text-blue-700">{t.aiWateringSuggestion}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Details & History */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-5xl font-display font-black text-m3-primary mb-2">{plant.name}</h2>
              <p className="text-lg font-bold text-m3-secondary uppercase tracking-widest flex items-center gap-2">
                {plant.type === 'Baum' ? <TreeDeciduous className="w-5 h-5" /> : 
                 plant.type === 'Strauch' ? <Sprout className="w-5 h-5" /> : 
                 plant.type === 'Blume' ? <Flower2 className="w-5 h-5" /> : 
                 plant.type === 'Gemüse' ? <Carrot className="w-5 h-5" /> : <Leaf className="w-5 h-5" />}
                {plant.type === 'Baum' ? t.tree : 
                 plant.type === 'Strauch' ? t.shrub : 
                 plant.type === 'Blume' ? t.flower : 
                 plant.type === 'Gemüse' ? t.vegetable : t.other}
              </p>
            </div>
            <div className="m3-card !p-4 !rounded-2xl flex items-center gap-4 bg-m3-surface-container-high">
              <div className="text-right">
                <p className="text-[10px] font-black uppercase opacity-40">{t.activity}</p>
                <p className="font-bold text-m3-primary">{plant.history.length} {t.wateringEvents}</p>
              </div>
              <div className="w-px h-8 bg-m3-outline/10" />
              <div className="text-right">
                <p className="text-[10px] font-black uppercase opacity-40">{t.diary}</p>
                <p className="font-bold text-m3-primary">{plant.diary.length} {t.addEntry}</p>
              </div>
              <div className="w-px h-8 bg-m3-outline/10" />
              <button 
                onClick={() => setIsAIChatOpen(true)}
                className="w-12 h-12 bg-m3-primary-container text-m3-on-primary-container rounded-2xl flex items-center justify-center hover:scale-105 transition-transform"
                title={t.aiCareChat}
              >
                <Bot className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="m3-card !p-8">
            <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-m3-primary" /> {t.notes}
            </h3>
            <p className="text-m3-on-surface-variant leading-relaxed whitespace-pre-wrap">
              {plant.notes || t.notSpecified}
            </p>
          </div>

          {/* AI Insights Section */}
          <div className="space-y-6">
            <h3 className="text-2xl font-display font-black text-m3-primary flex items-center gap-3">
              <Bot className="w-6 h-6" /> {t.aiInsights}
            </h3>
            
            <div className="space-y-4">
              {plant.aiInsights && plant.aiInsights.length > 0 ? (
                plant.aiInsights.map((insight) => (
                  <div key={insight.id} className="m3-card !p-6 border-m3-primary/10 bg-m3-primary-container/5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {insight.type === 'health' ? <TrendingUp className="w-4 h-4 text-emerald-600" /> :
                         insight.type === 'growth' ? <Calendar className="w-4 h-4 text-purple-600" /> :
                         <Droplets className="w-4 h-4 text-blue-600" />}
                        <span className="text-xs font-black uppercase tracking-widest text-m3-primary">
                          {insight.type === 'health' ? t.aiHealthCheck : 
                           insight.type === 'growth' ? t.aiGrowthPrediction : t.aiWateringSuggestion}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold opacity-40">
                        {format(parseISO(insight.date), 'dd.MM.yyyy HH:mm')}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {insight.type === 'health' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-black uppercase opacity-40 mb-1">{t.healthStatus}</p>
                            <p className="text-sm font-bold">{insight.data.status}</p>
                          </div>
                          {insight.data.indicators?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-black uppercase opacity-40 mb-1">{t.indicators}</p>
                              <p className="text-xs">{insight.data.indicators.join(', ')}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {insight.type === 'growth' && (
                        <div>
                          <p className="text-[10px] font-black uppercase opacity-40 mb-1">{t.projection}</p>
                          <p className="text-sm">{insight.data.projection}</p>
                        </div>
                      )}

                      {insight.type === 'water' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-black uppercase opacity-40 mb-1">{t.optimalTime}</p>
                            <p className="text-sm font-bold">{insight.data.optimalTime}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase opacity-40 mb-1">{t.nextWatering}</p>
                            <p className="text-xs">{insight.data.schedule}</p>
                          </div>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => setAiResult({ type: insight.type, data: insight.data })}
                        className="text-[10px] font-black uppercase tracking-widest text-m3-primary hover:underline"
                      >
                        {t.details}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="m3-card !p-8 text-center opacity-30 border-dashed">
                  <Bot className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm font-bold">{t.noInsights}</p>
                </div>
              )}
            </div>
          </div>

          {/* Diary Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-display font-black text-m3-primary flex items-center gap-3">
                <History className="w-6 h-6" /> {t.diary}
              </h3>
            </div>

            <div className="m3-card !p-4 sm:!p-8 bg-m3-primary-container/20 border-m3-primary/10">
              <form onSubmit={handleAddDiaryEntry} className="space-y-4">
                <textarea 
                  placeholder={t.writeSomething}
                  className="w-full bg-m3-surface min-h-[80px] sm:min-h-[100px] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-m3-outline/10 outline-none focus:ring-2 focus:ring-m3-primary/20 transition-all font-medium text-sm sm:text-base"
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
                    {t.save}
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
                    className="m3-card !p-6 md:p-8 flex flex-col sm:flex-row gap-4 sm:gap-6 hover:bg-m3-surface-container-high transition-colors"
                  >
                    <div className="shrink-0 sm:text-center flex sm:flex-col items-center gap-2 sm:gap-0">
                      <p className="text-2xl font-display font-black text-m3-primary">{format(parseISO(entry.date), 'dd')}</p>
                      <p className="text-[10px] font-black uppercase opacity-40">{format(parseISO(entry.date), 'MMM yyyy', { locale: language === 'de' ? de : enUS })}</p>
                    </div>
                    <div className="flex-1 space-y-4">
                      <p className="text-m3-on-surface-variant leading-relaxed">{entry.text}</p>
                      {entry.image && (
                        <div className="max-w-sm rounded-[24px] overflow-hidden border border-m3-outline/10">
                          <img src={entry.image} className="w-full h-auto cursor-zoom-in" onClick={() => setSelectedImage(entry.image!)} referrerPolicy="no-referrer" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 opacity-30">
                  <History className="w-12 h-12 mx-auto mb-4" />
                  <p className="font-bold">{t.tipEmpty}</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="m3-card !p-8">
              <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                <History className="w-5 h-5 text-m3-primary" /> {t.wateringHistory}
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
                  <p className="text-sm opacity-50 italic">{t.tipEmpty}</p>
                )}
              </div>
            </div>

            <div className="m3-card !p-8 flex flex-col">
              <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-m3-primary" /> {t.activity}
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
              <p className="text-[10px] font-bold text-center opacity-40 mt-4 uppercase tracking-widest">{t.wateringEvents} (last 7)</p>
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
              referrerPolicy="no-referrer"
            />
            <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full">
              <X className="w-8 h-8" />
            </button>
          </div>
        )}
      </AnimatePresence>

      {/* AI Chat Overlay */}
      <AnimatePresence>
        {isAIChatOpen && (
          <AICareAssistant 
            plant={plant} 
            language={language} 
            onClose={() => setIsAIChatOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* AI Analysis Result Modal */}
      <AnimatePresence>
        {aiResult && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setAiResult(null)} 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="relative bg-m3-surface w-full max-w-lg rounded-[28px] sm:rounded-[40px] overflow-hidden border border-m3-outline/10 shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-4 sm:p-8 bg-m3-primary text-m3-on-primary flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <Bot className="w-6 h-6" />
                  <h3 className="font-display font-black text-lg sm:text-xl">
                    {aiResult.type === 'health' ? t.aiHealthCheck : 
                     aiResult.type === 'growth' ? t.aiGrowthPrediction : t.aiWateringSuggestion}
                  </h3>
                </div>
                <button onClick={() => setAiResult(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 scrollbar-hide">
                {aiResult.type === 'health' && (
                  <>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">{t.healthStatus}</h4>
                      <p className="font-bold text-lg text-m3-primary">{aiResult.data.status}</p>
                    </div>
                    {aiResult.data.indicators?.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">{t.indicators}</h4>
                        <ul className="space-y-1">
                          {aiResult.data.indicators.map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-m3-primary mt-1.5 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiResult.data.deficiencies?.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">{t.deficiencies}</h4>
                        <ul className="space-y-1">
                          {aiResult.data.deficiencies.map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-rose-600">
                              <Info className="w-4 h-4 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">{t.careTips}</h4>
                      <ul className="space-y-2">
                        {aiResult.data.tips.map((tip: string, i: number) => (
                          <li key={i} className="p-3 bg-m3-surface-container rounded-xl text-sm italic">
                            "{tip}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {aiResult.type === 'growth' && (
                  <>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">{t.projection}</h4>
                      <p className="text-sm leading-relaxed">{aiResult.data.projection}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">{t.milestones}</h4>
                      <div className="space-y-4">
                        {aiResult.data.milestones.map((m: any, i: number) => (
                          <div key={i} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full bg-m3-primary text-m3-on-primary flex items-center justify-center text-[10px] font-black">
                                {i + 1}
                              </div>
                              {i < aiResult.data.milestones.length - 1 && <div className="w-0.5 flex-1 bg-m3-outline/10 my-1" />}
                            </div>
                            <div className="pb-4">
                              <p className="font-bold text-m3-primary text-sm">{m.month}</p>
                              <p className="text-xs opacity-60">{m.expectation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-700 mb-2">{t.careAdjustments}</h4>
                      <p className="text-xs text-purple-900 italic">{aiResult.data.careAdjustments}</p>
                    </div>
                  </>
                )}

                {aiResult.type === 'water' && (
                  <>
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <Droplets className="w-8 h-8 text-blue-600" />
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-700">{t.optimalTime}</h4>
                        <p className="font-bold text-blue-900">{aiResult.data.optimalTime}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">{t.nextWatering}</h4>
                      <p className="text-sm leading-relaxed font-medium">{aiResult.data.schedule}</p>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-m3-surface-container rounded-2xl border border-m3-outline/5">
                        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">{t.weatherContext}</h4>
                        <p className="text-xs italic">{aiResult.data.weatherContext}</p>
                      </div>
                      <div className="p-4 bg-m3-surface-container rounded-2xl border border-m3-outline/5">
                        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">{t.historicalPatterns}</h4>
                        <p className="text-xs italic">{aiResult.data.historicalPatterns}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="p-6 bg-m3-surface-container-low border-t border-m3-outline/5 shrink-0">
                <button 
                  onClick={() => setAiResult(null)}
                  className="m3-btn-primary w-full justify-center"
                >
                  {t.ok}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Garden Map Component ---

function MapPlantItem({ 
  plant, 
  mapRef, 
  onDragEnd, 
  isDragging, 
  setIsDragging,
  t,
  zoom
}: { 
  plant: Plant, 
  mapRef: React.RefObject<HTMLDivElement | null>, 
  onDragEnd: (id: string, info: any) => void,
  isDragging: string | null,
  setIsDragging: (id: string | null) => void,
  t: any,
  zoom: number
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleDragEnd = (event: any, info: any) => {
    onDragEnd(plant.id, info);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={mapRef}
      onDragStart={() => setIsDragging(plant.id)}
      onDragEnd={handleDragEnd}
      animate={{ 
        left: plant.mapPosition ? `${plant.mapPosition.x}%` : '50%', 
        top: plant.mapPosition ? `${plant.mapPosition.y}%` : '50%',
      }}
      transition={{ 
        left: { type: 'spring', stiffness: 300, damping: 30 },
        top: { type: 'spring', stiffness: 300, damping: 30 }
      }}
      style={{ 
        x,
        y,
        position: 'absolute',
        zIndex: isDragging === plant.id ? 50 : 20,
        scale: 1 / Math.sqrt(zoom) // Counter-scale slightly so icons don't get too huge but still feel zoomed
      }}
      className="cursor-grab active:cursor-grabbing group"
    >
      <div className="flex flex-col items-center gap-2 -translate-x-1/2 -translate-y-1/2">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-m3-outline/10 transition-all duration-300 ${
          isDragging === plant.id ? 'scale-125 rotate-12 bg-m3-primary text-m3-on-primary shadow-xl' : 'bg-white text-m3-primary hover:scale-110 shadow-md'
        }`}>
          {plant.type === 'Baum' ? <TreeDeciduous className="w-6 h-6" /> : 
           plant.type === 'Blume' ? <Leaf className="w-6 h-6" /> : 
           <Sprout className="w-6 h-6" />}
        </div>
        <div className="bg-m3-surface-container-high px-3 py-1 rounded-full border border-m3-outline/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-sm">
          <p className="text-[10px] font-bold">{plant.name}</p>
        </div>
      </div>
    </motion.div>
  );
}

function MapZoneItem({
  zone,
  mapRef,
  onDragEnd,
  onTap,
  isEditing,
  t,
  zoom
}: {
  zone: Zone,
  mapRef: React.RefObject<HTMLDivElement | null>,
  onDragEnd: (id: string, info: any) => void,
  onTap: () => void,
  isEditing: boolean,
  t: any,
  zoom: number
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleDragEnd = (event: any, info: any) => {
    onDragEnd(zone.id, info);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={mapRef}
      onDragEnd={handleDragEnd}
      onTap={onTap}
      animate={{ 
        left: `${zone.x}%`, 
        top: `${zone.y}%`,
      }}
      transition={{ 
        left: { type: 'spring', stiffness: 300, damping: 30 },
        top: { type: 'spring', stiffness: 300, damping: 30 }
      }}
      style={{ 
        x,
        y,
        position: 'absolute', 
        width: `${zone.width}%`, 
        height: `${zone.height}%`,
        backgroundColor: zone.color,
        border: `2px solid ${zone.color}`,
        zIndex: 10,
        opacity: 0.3
      }}
      className={`cursor-move rounded-xl transition-all ${isEditing ? 'opacity-60 border-white ring-4 ring-white/20' : ''}`}
    >
      <div className="absolute top-2 left-2 bg-black/40 text-white px-2 py-0.5 rounded text-[8px] font-bold whitespace-nowrap" style={{ scale: 1/zoom, transformOrigin: 'top left' }}>
        {zone.name}
      </div>
    </motion.div>
  );
}

function GardenMap({ 
  plants, 
  setPlants, 
  zones,
  setZones,
  mapBackground, 
  setMapBackground,
  language,
  dbStatus
}: { 
  plants: Plant[], 
  setPlants: React.Dispatch<React.SetStateAction<Plant[]>>,
  zones: Zone[],
  setZones: React.Dispatch<React.SetStateAction<Zone[]>>,
  mapBackground: string | null,
  setMapBackground: (bg: string | null) => void,
  language: Language,
  dbStatus: 'connected' | 'disconnected' | 'connecting'
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const t = translations[language];

  const handleDragEnd = async (id: string, info: any) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    
    // Calculate relative position accounting for zoom and pan
    const leftOffset = (rect.width * (1 - zoom)) / 2 + pan.x;
    const topOffset = (rect.height * (1 - zoom)) / 2 + pan.y;
    
    let x = ((info.point.x - rect.left - leftOffset) / (rect.width * zoom)) * 100;
    let y = ((info.point.y - rect.top - topOffset) / (rect.height * zoom)) * 100;
    
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));
    
    const zone = zones.find(z => 
      x >= z.x && x <= z.x + z.width &&
      y >= z.y && y <= z.y + z.height
    );

    const updatedMapPosition = { x, y };
    const updatedZoneId = zone?.id;

    setPlants(prev => prev.map(p => p.id === id ? { ...p, mapPosition: updatedMapPosition, zoneId: updatedZoneId } : p));
    setIsDragging(null);

    if (dbStatus === 'connected') {
      const plant = plants.find(p => p.id === id);
      if (plant) {
        try {
          await fetch(`/api/plants/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...plant, mapPosition: updatedMapPosition, zoneId: updatedZoneId })
          });
        } catch (err) {
          console.error("Failed to sync plant position:", err);
        }
      }
    }
  };

  const handleZoneDragEnd = (id: string, info: any) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const zone = zones.find(z => z.id === id);
    if (!zone) return;

    const leftOffset = (rect.width * (1 - zoom)) / 2 + pan.x;
    const topOffset = (rect.height * (1 - zoom)) / 2 + pan.y;

    let x = ((info.point.x - rect.left - leftOffset) / (rect.width * zoom)) * 100 - (zone.width / 2);
    let y = ((info.point.y - rect.top - topOffset) / (rect.height * zoom)) * 100 - (zone.height / 2);
    
    x = Math.max(0, Math.min(100 - zone.width, x));
    y = Math.max(0, Math.min(100 - zone.height, y));
    
    const updatedZones = zones.map(z => z.id === id ? { ...z, x, y } : z);
    setZones(updatedZones);
    updatePlantsInZones(updatedZones);
  };

  const updatePlantsInZones = (currentZones: Zone[]) => {
    setPlants(prev => prev.map(p => {
      if (!p.mapPosition) return p;
      const zone = currentZones.find(z => 
        p.mapPosition!.x >= z.x && p.mapPosition!.x <= z.x + z.width &&
        p.mapPosition!.y >= z.y && p.mapPosition!.y <= z.y + z.height
      );
      return { ...p, zoneId: zone?.id };
    }));
  };

  const handleAddZone = () => {
    const newZone: Zone = {
      id: crypto.randomUUID(),
      name: t.addZone,
      color: '#10b981',
      x: 25,
      y: 25,
      width: 20,
      height: 20
    };
    setZones([...zones, newZone]);
    setEditingZoneId(newZone.id);
  };

  const handleDeleteZone = (id: string) => {
    setZones(zones.filter(z => z.id !== id));
    setPlants(plants.map(p => p.zoneId === id ? { ...p, zoneId: undefined } : p));
    setEditingZoneId(null);
  };

  const handleUpdateZone = (id: string, updates: Partial<Zone>) => {
    const updatedZones = zones.map(z => z.id === id ? { ...z, ...updates } : z);
    setZones(updatedZones);
    updatePlantsInZones(updatedZones);
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
          <h2 className="text-4xl font-display font-extrabold tracking-tight text-m3-primary">{t.gardenMap}</h2>
          <p className="text-m3-on-surface-variant mt-2">{t.tipMap}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleAddZone}
            className="m3-btn-primary"
          >
            <Plus className="w-5 h-5" />
            {t.addZone}
          </button>
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
            {t.uploadMap}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div 
            ref={mapRef}
            className="relative w-full aspect-square md:aspect-video bg-m3-surface-container-highest rounded-[40px] border border-m3-outline/10 overflow-hidden bg-[radial-gradient(#00000010_1px,transparent_1px)] [background-size:20px_20px]"
          >
            <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2">
              <button 
                onClick={() => setZoom(prev => Math.min(prev + 0.5, 4))}
                className="m3-btn-secondary !p-3 rounded-2xl shadow-lg"
                title={t.zoomIn}
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setZoom(prev => Math.max(prev - 0.5, 1))}
                className="m3-btn-secondary !p-3 rounded-2xl shadow-lg"
                title={t.zoomOut}
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button 
                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                className="m3-btn-secondary !p-3 rounded-2xl shadow-lg"
                title={t.resetZoom}
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            <motion.div
              ref={contentRef}
              drag={zoom > 1}
              dragMomentum={false}
              onDrag={(e, info) => setPan(prev => ({ x: prev.x + info.delta.x, y: prev.y + info.delta.y }))}
              animate={{ 
                scale: zoom,
                x: pan.x,
                y: pan.y
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute inset-0 w-full h-full"
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

              <AnimatePresence>
                {zones.map((zone) => (
                  <MapZoneItem
                    key={zone.id}
                    zone={zone}
                    mapRef={contentRef}
                    onDragEnd={handleZoneDragEnd}
                    onTap={() => setEditingZoneId(zone.id)}
                    isEditing={editingZoneId === zone.id}
                    t={t}
                    zoom={zoom}
                  />
                ))}
              </AnimatePresence>

              {/* Overlay for better contrast if background exists */}
              {mapBackground && <div className="absolute inset-0 bg-black/5 pointer-events-none" />}

              {plants.map((plant) => (
                <MapPlantItem
                  key={plant.id}
                  plant={plant}
                  mapRef={contentRef}
                  onDragEnd={handleDragEnd}
                  isDragging={isDragging}
                  setIsDragging={setIsDragging}
                  t={t}
                  zoom={zoom}
                />
              ))}

              {plants.length === 0 && !mapBackground && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-m3-on-surface-variant/40" style={{ scale: 1/zoom }}>
                  <MapIcon className="w-24 h-24 mb-4 opacity-20" />
                  <p className="font-display font-bold text-xl">{t.noPlantsFound}</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          {editingZoneId ? (
            <div className="m3-card !p-6 border-m3-primary/20 bg-m3-primary-container/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-black text-m3-primary">{t.editZone}</h3>
                <button onClick={() => setEditingZoneId(null)} className="m3-btn-ghost !p-2"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-black opacity-40 mb-1 block">{t.zoneName}</label>
                  <input 
                    type="text" 
                    className="m3-input"
                    value={zones.find(z => z.id === editingZoneId)?.name || ''}
                    onChange={(e) => handleUpdateZone(editingZoneId, { name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black opacity-40 mb-1 block">{t.zoneColor}</label>
                  <div className="flex gap-2 flex-wrap">
                    {['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map(color => (
                      <button 
                        key={color}
                        onClick={() => handleUpdateZone(editingZoneId, { color })}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${zones.find(z => z.id === editingZoneId)?.color === color ? 'border-m3-primary scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-black opacity-40 mb-1 block">Width %</label>
                    <input 
                      type="number" 
                      className="m3-input"
                      value={zones.find(z => z.id === editingZoneId)?.width || 0}
                      onChange={(e) => handleUpdateZone(editingZoneId, { width: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-black opacity-40 mb-1 block">Height %</label>
                    <input 
                      type="number" 
                      className="m3-input"
                      value={zones.find(z => z.id === editingZoneId)?.height || 0}
                      onChange={(e) => handleUpdateZone(editingZoneId, { height: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteZone(editingZoneId)}
                  className="m3-btn-ghost w-full text-rose-500 hover:bg-rose-500/10 mt-4"
                >
                  <Trash2 className="w-4 h-4" /> {t.deleteZone}
                </button>
              </div>
            </div>
          ) : (
            <div className="m3-card !p-6">
              <h3 className="font-display font-black text-m3-primary mb-4 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5" /> {t.zones}
              </h3>
              <div className="space-y-2">
                {zones.map(zone => (
                  <button 
                    key={zone.id}
                    onClick={() => setEditingZoneId(zone.id)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-m3-surface-container-high transition-colors border border-m3-outline/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
                      <span className="font-bold text-sm">{zone.name}</span>
                    </div>
                    <span className="text-[10px] font-black opacity-30">
                      {plants.filter(p => p.zoneId === zone.id).length} {t.totalPlants}
                    </span>
                  </button>
                ))}
                {zones.length === 0 && (
                  <p className="text-xs opacity-40 italic py-4">{t.tipMap}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Main App Component ---

export default function App() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [mapBackground, setMapBackground] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<PlantType | 'Alle'>('Alle');
  const [selectedZoneId, setSelectedZoneId] = useState<string | 'Alle'>('Alle');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('myplant_language') as Language) || 'en';
  });
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(() => {
    return (localStorage.getItem('myplant_theme') as any) || 'auto';
  });

  const [dbConfig, setDbConfig] = useState(() => {
    const saved = localStorage.getItem('myplant_db_config');
    return saved ? JSON.parse(saved) : { host: '', user: '', password: '', database: '', port: '3306' };
  });

  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  useEffect(() => {
    localStorage.setItem('myplant_theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('myplant_language', language);
  }, [language]);

  // Initial DB connection check
  useEffect(() => {
    const checkDb = async () => {
      if (dbConfig.host) {
        setDbStatus('connecting');
        try {
          const res = await fetch('/api/config/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dbConfig)
          });
          const result = await res.json();
          setDbStatus(result.success ? 'connected' : 'disconnected');
        } catch (e) {
          setDbStatus('disconnected');
        }
      }
    };
    checkDb();
  }, []);
  const [modalStep, setModalStep] = useState(1);
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
    const savedLang = localStorage.getItem('myplant_lang');
    const savedZones = localStorage.getItem('myplant_zones');
    if (savedBg) setMapBackground(savedBg);
    if (savedLang) setLanguage(savedLang as Language);
    if (savedZones) setZones(JSON.parse(savedZones));
    
    if (dbStatus === 'connected') {
      fetch('/api/plants')
        .then(res => res.json())
        .then(data => {
          const parsedData = data.map((p: any) => ({
            ...p,
            images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
            history: typeof p.history === 'string' ? JSON.parse(p.history) : p.history,
            aiInsights: typeof p.aiInsights === 'string' ? JSON.parse(p.aiInsights) : p.aiInsights,
            position: typeof p.position === 'string' ? JSON.parse(p.position) : p.position,
            isOutdoor: !!p.isOutdoor
          }));
          setPlants(parsedData);
        })
        .catch(err => console.error("Failed to fetch plants:", err));
    } else if (saved) {
      try {
        const parsed = JSON.parse(saved);
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
  }, [dbStatus]);

  useEffect(() => {
    localStorage.setItem('myplant_data', JSON.stringify(plants));
  }, [plants]);

  useEffect(() => {
    if (mapBackground) {
      localStorage.setItem('myplant_map_bg', mapBackground);
    }
  }, [mapBackground]);

  useEffect(() => {
    localStorage.setItem('myplant_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('myplant_zones', JSON.stringify(zones));
  }, [zones]);

  const filteredPlants = useMemo(() => {
    return plants
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             p.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'Alle' || p.type === filterType;
        const matchesZone = selectedZoneId === 'Alle' || p.zoneId === selectedZoneId;
        return matchesSearch && matchesFilter && matchesZone;
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

  const handleWaterPlant = async (id: string) => {
    const now = new Date().toISOString();
    const updatedPlants = plants.map(p => p.id === id ? { 
      ...p, 
      lastWatered: now.split('T')[0],
      history: [...(p.history || []), { date: now }]
    } : p);
    setPlants(updatedPlants);

    if (dbStatus === 'connected') {
      const plant = updatedPlants.find(p => p.id === id);
      await fetch(`/api/plants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plant)
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let newPlant: Plant;
    if (editingPlant) {
      newPlant = { ...formData, id: editingPlant.id, history: editingPlant.history || [], diary: editingPlant.diary || [] };
      setPlants(plants.map(p => p.id === editingPlant.id ? newPlant : p));
      if (dbStatus === 'connected') {
        await fetch(`/api/plants/${editingPlant.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPlant)
        });
      }
    } else {
      newPlant = { ...formData, id: crypto.randomUUID(), history: [], diary: [] };
      setPlants([...plants, newPlant]);
      if (dbStatus === 'connected') {
        await fetch('/api/plants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPlant)
        });
      }
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
    setModalStep(1);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Löschen?')) {
      setPlants(plants.filter(p => p.id !== id));
      if (dbStatus === 'connected') {
        await fetch(`/api/plants/${id}`, {
          method: 'DELETE'
        });
      }
    }
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
  const t = translations[language];

  return (
    <Router>
      <div className="min-h-screen bg-m3-surface font-sans text-m3-on-surface flex">
        <Sidebar 
          onExport={exportData} 
          onImport={importData} 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
          language={language}
          setLanguage={setLanguage}
        />
        
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'md:pl-20' : 'md:pl-72'} pb-24 md:pb-0`}>
          <MobileHeader language={language} />
          <Routes>
            <Route path="/" element={<Dashboard stats={stats} plants={plants} language={language} />} />
            <Route path="/plants" element={
              <PlantOverview 
                plants={plants}
                filteredPlants={filteredPlants}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterType={filterType}
                setFilterType={setFilterType}
                zones={zones}
                selectedZoneId={selectedZoneId}
                setSelectedZoneId={setSelectedZoneId}
                sortBy={sortBy}
                setSortBy={setSortBy}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                handleWaterPlant={handleWaterPlant}
                language={language}
              />
            } />
            <Route path="/map" element={
              <GardenMap 
                plants={plants} 
                setPlants={setPlants} 
                zones={zones}
                setZones={setZones}
                mapBackground={mapBackground}
                setMapBackground={setMapBackground}
                language={language}
                dbStatus={dbStatus}
              />
            } />
            <Route path="/insights" element={<AIInsightsView stats={stats} language={language} />} />
            <Route path="/plant/:id" element={<PlantDetailPage plants={plants} setPlants={setPlants} onWater={handleWaterPlant} onEdit={handleEdit} language={language} />} />
            <Route path="/settings" element={
              <Settings 
                language={language} 
                theme={theme} 
                setTheme={setTheme} 
                dbConfig={dbConfig} 
                setDbConfig={setDbConfig}
                dbStatus={dbStatus}
              />
            } />
          </Routes>
        </div>

        <BottomNav language={language} />

        <button onClick={() => { setEditingPlant(null); setIsModalOpen(true); }} className="m3-fab">
          <Plus className="w-6 h-6" /> <span className="hidden sm:inline">{t.addPlant}</span>
        </button>

        {/* Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-m3-surface w-full max-w-2xl rounded-[28px] sm:rounded-[40px] overflow-hidden max-h-[90vh] flex flex-col border border-m3-outline/10 shadow-2xl">
                
                {/* Modal Header */}
                <div className="p-4 sm:p-8 border-b border-m3-outline/5 flex justify-between items-center bg-m3-surface-container-low">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-display font-black text-m3-primary">{editingPlant ? t.editPlant : t.addPlant}</h2>
                    <div className="flex gap-2 mt-2">
                      {[1, 2, 3].map(step => (
                        <div key={step} className={`h-1.5 rounded-full transition-all duration-500 ${modalStep >= step ? 'w-8 bg-m3-primary' : 'w-4 bg-m3-outline/20'}`} />
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="m3-btn-ghost !p-2 sm:!p-3"><X className="w-5 h-5 sm:w-6 sm:h-6" /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 p-4 sm:p-8 overflow-y-auto scrollbar-hide">
                    <AnimatePresence mode="wait">
                      {modalStep === 1 && (
                        <motion.div 
                          key="step1"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-6"
                        >
                          <div className="space-y-4">
                            <label className="text-xs font-black uppercase opacity-40 px-2">{t.step1}</label>
                            <div 
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full h-40 sm:h-56 rounded-[24px] sm:rounded-[32px] border-2 border-dashed border-m3-outline/20 flex flex-col items-center justify-center cursor-pointer hover:bg-m3-primary/5 transition-all overflow-hidden relative group"
                            >
                              {formData.images && formData.images.length > 0 ? (
                                <div className="flex w-full h-full">
                                  {formData.images.map((img, idx) => (
                                    <img key={idx} src={img} className="h-full object-cover flex-1 border-r border-white/10 last:border-0" style={{ maxWidth: '33.33%' }} referrerPolicy="no-referrer" />
                                  ))}
                                  <div className="absolute inset-0 bg-m3-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                    <Camera className="w-10 h-10 text-white" />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <div className="w-16 h-16 bg-m3-surface-container-high rounded-3xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Camera className="w-8 h-8 opacity-40 text-m3-primary" />
                                  </div>
                                  <p className="text-sm font-bold text-m3-primary">{t.addPhotos}</p>
                                  <p className="text-[10px] opacity-40 mt-1 uppercase font-black tracking-widest">Max 6 Photos</p>
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
                              <div className="flex items-center gap-3 text-m3-primary py-3 px-5 bg-m3-primary-container/30 rounded-2xl border border-m3-primary/10">
                                <div className="w-4 h-4 border-2 border-m3-primary border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-bold">{t.analyzing}</span>
                              </div>
                            )}
                            
                            {analysisSuccess && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 text-emerald-600 py-3 px-5 bg-emerald-50 rounded-2xl border border-emerald-100"
                              >
                                <Check className="w-4 h-4" />
                                <span className="text-xs font-bold">{t.identified}</span>
                              </motion.div>
                            )}

                            {formData.images.length > 0 && !isAnalyzing && (
                              <div className="flex gap-4 px-2">
                                <button 
                                  type="button" 
                                  onClick={() => analyzeImage(formData.images[0])}
                                  className="text-[10px] font-black uppercase text-m3-primary hover:underline flex items-center gap-1.5"
                                >
                                  <TrendingUp className="w-3 h-3" /> {t.restartAnalysis}
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => setFormData({...formData, images: []})}
                                  className="text-[10px] font-black uppercase text-rose-500 hover:underline flex items-center gap-1.5"
                                >
                                  <Trash2 className="w-3 h-3" /> {t.deleteAllPhotos}
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {modalStep === 2 && (
                        <motion.div 
                          key="step2"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-8"
                        >
                          <div className="space-y-6">
                            <div className="flex items-center gap-4 p-5 bg-m3-surface-container-high rounded-[24px] border border-m3-outline/5">
                              <div className={`p-3 rounded-2xl ${formData.isOutdoor ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                {formData.isOutdoor ? <TreeDeciduous className="w-6 h-6" /> : <Leaf className="w-6 h-6" />}
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-sm">{t.outdoorPlant}</p>
                                <p className="text-[10px] opacity-60 uppercase font-black tracking-wider">{formData.isOutdoor ? t.outdoor : t.indoor}</p>
                              </div>
                              <button 
                                type="button"
                                onClick={() => setFormData({...formData, isOutdoor: !formData.isOutdoor})}
                                className={`w-14 h-8 rounded-full transition-colors relative ${formData.isOutdoor ? 'bg-m3-primary' : 'bg-m3-outline/20'}`}
                              >
                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${formData.isOutdoor ? 'left-7' : 'left-1'}`} />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                              <div className="space-y-2">
                                <label className="text-xs font-black uppercase opacity-40 px-2">{t.plantName}</label>
                                <div className="relative">
                                  <input required placeholder={t.plantName} className="m3-input pl-12" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                  <Info className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-xs font-black uppercase opacity-40 px-2">{t.plantType}</label>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {PLANT_TYPES.map(type => (
                                      <button 
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData({...formData, type})}
                                        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${formData.type === type ? 'bg-m3-primary text-m3-on-primary border-m3-primary' : 'bg-m3-surface-container hover:bg-m3-surface-container-high border-m3-outline/10'}`}
                                      >
                                        {type === 'Baum' ? <TreeDeciduous className="w-6 h-6" /> : 
                                         type === 'Strauch' ? <Sprout className="w-6 h-6" /> : 
                                         type === 'Blume' ? <Flower2 className="w-6 h-6" /> : 
                                         type === 'Gemüse' ? <Carrot className="w-6 h-6" /> : <Leaf className="w-6 h-6" />}
                                        <span className="text-xs font-bold">
                                          {type === 'Baum' ? t.tree : 
                                           type === 'Strauch' ? t.shrub : 
                                           type === 'Blume' ? t.flower : 
                                           type === 'Gemüse' ? t.vegetable : t.other}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-black uppercase opacity-40 px-2">{t.location}</label>
                                  <input placeholder={t.location} className="m3-input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {modalStep === 3 && (
                        <motion.div 
                          key="step3"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-8"
                        >
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-xs font-black uppercase opacity-40 px-2">{t.health}</label>
                                <input placeholder={`${t.health} (AI)`} className="m3-input" value={formData.health} onChange={e => setFormData({...formData, health: e.target.value})} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-black uppercase opacity-40 px-2">{t.size}</label>
                                <input placeholder={`${t.size} (AI)`} className="m3-input" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-xs font-black uppercase opacity-40 px-2">{t.age}</label>
                                <input placeholder={`${t.age} (AI)`} className="m3-input" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-black uppercase opacity-40 px-2">{t.planted}</label>
                                <input type="date" className="m3-input" value={formData.datePlanted} onChange={e => setFormData({...formData, datePlanted: e.target.value})} />
                              </div>
                            </div>

                            {!formData.isOutdoor && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-5 bg-m3-surface-container rounded-[24px] border border-m3-outline/5">
                                <div className="space-y-2">
                                  <label className="text-xs font-black uppercase opacity-40 px-2">{t.wateringInterval}</label>
                                  <div className="relative">
                                    <input type="number" className="m3-input pl-12" value={formData.wateringInterval} onChange={e => setFormData({...formData, wateringInterval: parseInt(e.target.value) || 7})} />
                                    <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 opacity-40" />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-black uppercase opacity-40 px-2">{t.lastWatered}</label>
                                  <input type="date" className="m3-input" value={formData.lastWatered} onChange={e => setFormData({...formData, lastWatered: e.target.value})} />
                                </div>
                              </div>
                            )}

                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase opacity-40 px-2">{t.notes}</label>
                              <textarea placeholder={t.notes} rows={4} className="m3-input resize-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 sm:p-8 bg-m3-surface-container-low border-t border-m3-outline/5 flex gap-4">
                    {modalStep > 1 && (
                      <button 
                        type="button" 
                        onClick={() => setModalStep(prev => prev - 1)}
                        className="m3-btn-ghost h-14 sm:h-16 px-4 sm:px-8 text-base sm:text-lg"
                      >
                        <ChevronLeft className="w-5 h-5 mr-1 sm:mr-2" /> {t.previous}
                      </button>
                    )}
                    {modalStep < 3 ? (
                      <button 
                        type="button" 
                        onClick={() => setModalStep(prev => prev + 1)}
                        className="m3-btn-primary flex-1 h-14 sm:h-16 text-base sm:text-lg justify-center"
                      >
                        {t.next} <ChevronRight className="w-5 h-5 ml-1 sm:ml-2" />
                      </button>
                    ) : (
                      <button 
                        type="submit" 
                        className="m3-btn-primary flex-1 h-14 sm:h-16 text-base sm:text-lg justify-center"
                      >
                        <Check className="w-6 h-6 mr-1 sm:mr-2" /> {t.save}
                      </button>
                    )}
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Router>
  );
}
