import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart
} from 'recharts';
import { 
  LayoutDashboard, Activity, Zap, Target, Users, Sun, FileText, MessageSquare, 
  Settings, Bell, Search, Moon, Sun as SunIcon, Menu, X, ChevronRight, 
  TrendingUp, TrendingDown, AlertTriangle, Download, Send, Bot, User, Check, Square, CheckSquare
} from 'lucide-react';

// API CONSTANTS
const API_BASE_URL = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000/ws/live-meter';

// Helper to parse LLM nested JSON responses
const parseLlmJson = (data) => {
  try {
    // Case 1: Direct Array
    if (Array.isArray(data)) return data;
    
    // Case 2: LangChain/LLM Object with 'content' string containing markdown
    if (data && data.content) {
      // Extract JSON block from markdown ```json ... ``` or just find [ ... ]
      const jsonMatch = data.content.match(/```json\n([\s\S]*?)\n```/) || data.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
    }
    return [];
  } catch (e) {
    console.error("Failed to parse LLM JSON:", e);
    return [];
  }
};

/**
 * MAIN COMPONENT
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global State for Configuration
  const [userGoals, setUserGoals] = useState({ kw_limit_threshold: 5.0, monthly_kwh_goal: 300.0 });
  const [appliances, setAppliances] = useState(["Fridge", "AC", "TV", "Washing Machine"]);

  // Theme Handling
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Render Content Switcher
  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard isDarkMode={isDarkMode} />;
      case 'analysis': return <Analytics isDarkMode={isDarkMode} />;
      case 'simulation': return <Simulation isDarkMode={isDarkMode} />;
      case 'gamification': return <Gamification isDarkMode={isDarkMode} />;
      case 'reports': return <Reports isDarkMode={isDarkMode} />;
      case 'chat': return <AIChat isDarkMode={isDarkMode} />;
      case 'settings': return <SettingsPage appliances={appliances} setAppliances={setAppliances} goals={userGoals} setGoals={setUserGoals} />;
      default: return <Dashboard isDarkMode={isDarkMode} />;
    }
  };

  return (
    <div className={`flex h-screen w-full transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'} font-sans`}>
      
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} ${isDarkMode ? 'bg-slate-950 border-r border-slate-800' : 'bg-white border-r border-slate-200'} shadow-xl lg:shadow-none`}>
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-indigo-600 dark:text-indigo-400">
            <Zap className="h-6 w-6" />
            <span>Energy<span className="text-slate-800 dark:text-white">Detective</span></span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          <NavItem icon={<LayoutDashboard />} label="Live Monitor" id="dashboard" activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem icon={<Activity />} label="Analysis & History" id="analysis" activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem icon={<Target />} label="Simulation & Forecast" id="simulation" activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem icon={<Users />} label="Community" id="gamification" activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem icon={<FileText />} label="Reports" id="reports" activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem icon={<MessageSquare />} label="AI Assistant" id="chat" activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
            <NavItem icon={<Settings />} label="Configuration" id="settings" activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-200 dark:border-slate-800">
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-900' : 'bg-indigo-50'}`}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                JD
              </div>
              <div>
                <p className="text-sm font-semibold">John Doe</p>
                <p className="text-xs opacity-70">Premium Plan</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className={`h-16 flex items-center justify-between px-6 border-b ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold capitalize hidden sm:block">
              {activeTab.replace('_', ' ')}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`hidden md:flex items-center px-3 py-1.5 rounded-full border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
              <Search className="h-4 w-4 opacity-50 mr-2" />
              <input type="text" placeholder="Search..." className="bg-transparent border-none focus:outline-none text-sm w-40" />
            </div>
            
            <button className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Bell className="h-5 w-5 opacity-70" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {isDarkMode ? <SunIcon className="h-5 w-5 opacity-70 text-yellow-400" /> : <Moon className="h-5 w-5 opacity-70" />}
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

/**
 * REUSABLE UI COMPONENTS
 */
const NavItem = ({ icon, label, id, activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
      activeTab === id 
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
        : 'hover:bg-slate-100 dark:hover:bg-slate-800 opacity-70 hover:opacity-100'
    }`}
  >
    {React.cloneElement(icon, { size: 18 })}
    {label}
  </button>
);

const Card = ({ children, className = "", isDarkMode }) => (
  <div className={`rounded-xl p-6 shadow-sm border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} ${className}`}>
    {children}
  </div>
);

const StatCard = ({ title, value, subtext, icon, trend, trendValue, isDarkMode, color = "indigo" }) => {
  const colorMap = {
    indigo: "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20",
    green: "text-green-500 bg-green-50 dark:bg-green-900/20",
    orange: "text-orange-500 bg-orange-50 dark:bg-orange-900/20",
    red: "text-red-500 bg-red-50 dark:bg-red-900/20",
  };

  return (
    <Card isDarkMode={isDarkMode} className="relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium opacity-60 mb-1">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>
          {React.cloneElement(icon, { size: 20 })}
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        {trend === 'up' && <TrendingUp className="h-4 w-4 text-red-500" />}
        {trend === 'down' && <TrendingDown className="h-4 w-4 text-green-500" />}
        <span className={trend === 'up' ? 'text-red-500 font-medium' : trend === 'down' ? 'text-green-500 font-medium' : 'opacity-60'}>
          {trendValue}
        </span>
        <span className="opacity-60">{subtext}</span>
      </div>
    </Card>
  );
};

/**
 * PAGE COMPONENTS
 */

// 1. DASHBOARD (LIVE METER VIA WEBSOCKET)
const Dashboard = ({ isDarkMode }) => {
  const [data, setData] = useState({
    total_kw: 0,
    cost_per_hour: 0,
    temperature_c: 25,
    weather_condition: "Loading...",
    active_devices_debug: [],
    alert: null
  });
  const [history, setHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let ws;
    let reconnectTimer;
    
    const connect = () => {
      try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const newData = JSON.parse(event.data);
            setData(newData);
            setHistory(prev => {
              const newHistory = [...prev, { time: newData.timestamp, value: newData.total_kw }];
              return newHistory.slice(-20); // Keep last 20 points
            });
          } catch (e) {
            console.warn("WS Message Parse Error", e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Optional: Reconnect logic could go here
        };

        ws.onerror = (error) => {
          // Suppress detailed error logging to avoid console spam when backend is down
          setIsConnected(false);
        };

      } catch (err) {
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (ws) ws.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Operations</h2>
          <p className="text-sm opacity-60">Real-time energy monitoring and status.</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isConnected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'} text-xs font-bold uppercase tracking-wider`}>
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          </span>
          {isConnected ? 'System Online' : 'Offline / Error'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Real-time Load" 
          value={`${data.total_kw.toFixed(2)} kW`} 
          subtext="vs last hour"
          trend={data.total_kw > 2.0 ? "up" : "down"}
          trendValue={data.total_kw > 2.0 ? "High Load" : "Normal"}
          icon={<Zap />}
          isDarkMode={isDarkMode}
          color={data.total_kw > 3.0 ? "red" : "indigo"}
        />
        <StatCard 
          title="Current Cost" 
          value={`₹${data.cost_per_hour.toFixed(2)}/hr`} 
          subtext="Projected hourly"
          trend="up"
          trendValue="Live"
          icon={<Activity />}
          isDarkMode={isDarkMode}
          color="green"
        />
        <StatCard 
          title="Temperature" 
          value={`${data.temperature_c.toFixed(1)}°C`} 
          subtext={data.weather_condition}
          trend="neutral"
          trendValue="Stable"
          icon={<Sun />}
          isDarkMode={isDarkMode}
          color="orange"
        />
         <StatCard 
          title="Active Devices" 
          value={data.active_devices_debug.length} 
          subtext="Drawing power"
          trend="neutral"
          trendValue="Stable"
          icon={<LayoutDashboard />}
          isDarkMode={isDarkMode}
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" isDarkMode={isDarkMode}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-lg">Live Consumption Feed</h3>
            <span className="text-xs font-mono opacity-50">Updates every 2s</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorKw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 'auto']} tick={{fontSize: 12}} stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorKw)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card isDarkMode={isDarkMode}>
          <h3 className="font-semibold text-lg mb-4">Device Status</h3>
          <div className="space-y-4">
            {["Fridge", "AC", "Water Heater", "TV", "PC"].map((device) => {
              const isActive = data.active_devices_debug.includes(device);
              return (
                <div key={device} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                    <span className="text-sm font-medium">{device}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                    {isActive ? 'Drawing Power' : 'Standby'}
                  </span>
                </div>
              )
            })}
          </div>
          
          {data.alert && (
            <div className="mt-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex gap-3 animate-pulse">
              <AlertTriangle className="text-red-600 dark:text-red-400 h-5 w-5 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">{data.alert}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

// 2. ANALYTICS (REAL API)
const Analytics = ({ isDarkMode }) => {
  const [period, setPeriod] = useState('week');
  const [chartData, setChartData] = useState([]);
  const [solarData, setSolarData] = useState(null);
  const [budgetData, setBudgetData] = useState(null);

  // Fetch History
  useEffect(() => {
    fetch(`${API_BASE_URL}/history/data?period=${period}`)
      .then(res => res.json())
      .then(data => {
        // Transform API response to Recharts format
        if (data && data.labels && data.kwh_data && data.cost_data) {
          const formatted = data.labels.map((label, i) => ({
            label: label.split('T')[1] ? label.split('T')[1].substring(0,5) : label, // simple formatting
            kwh_data: data.kwh_data[i],
            cost_data: data.cost_data[i]
          }));
          setChartData(formatted);
        }
      })
      .catch(err => console.error("History fetch error:", err));
  }, [period]);

  // Fetch Solar & Budget
  useEffect(() => {
    fetch(`${API_BASE_URL}/analyze/solar_potential`)
      .then(res => res.json())
      .then(setSolarData)
      .catch(err => console.warn("Solar API not available"));

    fetch(`${API_BASE_URL}/analyze/budget_plan`)
      .then(res => res.json())
      .then(setBudgetData)
      .catch(err => console.warn("Budget API not available"));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Historical Analysis</h2>
          <p className="text-sm opacity-60">Deep dive into your consumption patterns.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {['day', 'week', 'month'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm font-medium rounded-md capitalize transition-all ${period === p ? 'bg-white dark:bg-slate-600 shadow-sm' : 'opacity-60 hover:opacity-100'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <Card isDarkMode={isDarkMode} className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
            <XAxis dataKey="label" stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
            <YAxis yAxisId="left" stroke={isDarkMode ? "#94a3b8" : "#64748b"} label={{ value: 'kWh', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" stroke="#10b981" label={{ value: 'Cost (₹)', angle: 90, position: 'insideRight' }} />
            <RechartsTooltip contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }} />
            <Legend />
            <Bar yAxisId="left" dataKey="kwh_data" fill="#6366f1" radius={[4, 4, 0, 0]} name="Consumption (kWh)" />
            <Line yAxisId="right" type="monotone" dataKey="cost_data" stroke="#10b981" strokeWidth={3} dot={{r: 4}} name="Cost (₹)" />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card isDarkMode={isDarkMode} className="flex flex-col justify-center items-center p-8 text-center">
          <div className="mb-4 p-4 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400">
            <Sun className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold">Solar Potential Analysis</h3>
          {solarData ? (
            <>
              <p className="opacity-70 text-sm mt-2 mb-6 max-w-xs">
                {solarData.weather_adjustment}. Recommended: {solarData.recommended_system_kw} kW system.
              </p>
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm text-left">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                  <p className="text-xs opacity-60">Installation Cost</p>
                  <p className="font-bold">₹{solarData.installation_cost}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <p className="text-xs opacity-60 text-green-700 dark:text-green-400">Annual Savings</p>
                  <p className="font-bold text-green-700 dark:text-green-400">₹{solarData.annual_savings_inr}</p>
                </div>
              </div>
            </>
          ) : <p className="mt-4 opacity-50">Loading solar data... (Backend Offline?)</p>}
        </Card>

        <Card isDarkMode={isDarkMode}>
           <h3 className="font-semibold mb-4">Budget Health</h3>
           {budgetData ? (
             <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Status</span>
                  <span className={`font-bold ${budgetData.status === 'over_budget' ? 'text-red-500' : 'text-green-500'}`}>
                    {budgetData.status === 'over_budget' ? 'Over Budget' : 'On Track'}
                  </span>
                </div>
                {budgetData.gap_kwh && (
                  <p className="text-xs text-red-500 mt-2 font-medium">Exceeding by {budgetData.gap_kwh} kWh</p>
                )}
                {budgetData.message && (
                  <p className="text-xs text-green-500 mt-2 font-medium">{budgetData.message}</p>
                )}
              </div>

              {budgetData.plan_steps && budgetData.plan_steps.length > 0 && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-200">Suggested Action</p>
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                    {budgetData.plan_steps[0].title}: Save {budgetData.plan_steps[0].kwh_save_monthly} kWh
                  </p>
                </div>
              )}
           </div>
           ) : <p className="opacity-50">Analyzing budget...</p>}
        </Card>
      </div>
    </div>
  );
};

// 3. SIMULATION & FORECAST (REAL API)
const Simulation = ({ isDarkMode }) => {
  const [savings, setSavings] = useState(0);
  const [baselineData, setBaselineData] = useState([]);
  const [simulatedData, setSimulatedData] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [appliedSuggestionId, setAppliedSuggestionId] = useState(null);

  // Load baseline & suggestions
  useEffect(() => {
    // FETCH BASELINE
    fetch(`${API_BASE_URL}/forecast/baseline`)
      .then(res => res.json())
      .then(raw => {
        const data = parseLlmJson(raw);
        if (Array.isArray(data)) {
          // Map: hour -> name, load_kw -> val
          const formatted = data.map(d => ({ name: d.hour, val: d.load_kw }));
          setBaselineData(formatted);
          setSimulatedData(formatted); 
        } else {
          console.warn("Baseline data format incorrect or backend offline");
        }
      })
      .catch(console.error);

    // FETCH SUGGESTIONS
    fetch(`${API_BASE_URL}/analyze/suggestions`)
      .then(res => res.json())
      .then(raw => {
        const data = parseLlmJson(raw);
        if (Array.isArray(data)) {
          setSuggestions(data);
        }
      })
      .catch(console.error);
  }, []);

  const handleSimulate = async (suggestion) => {
    // Toggle logic: if already applied, reset. If new, simulate.
    if (appliedSuggestionId === suggestion.id) {
      setAppliedSuggestionId(null);
      setSimulatedData(baselineData);
      setSavings(0);
      return;
    }

    try {
      // POST /forecast/simulate_action
      const payload = {
        baseline_forecast: baselineData.map(d => ({ hour: d.name, load_kw: d.val, cost: d.val * 8 })), 
        suggestion_id: suggestion.id,
        affected_appliance: suggestion.affected_appliance
      };

      const res = await fetch(`${API_BASE_URL}/forecast/simulate_action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      
      if (result.modified_forecast) {
        setSimulatedData(result.modified_forecast.map(d => ({ name: d.hour, val: d.load_kw })));
        setSavings(result.savings_summary.total_savings_amount);
        setAppliedSuggestionId(suggestion.id);
      }
    } catch (err) {
      console.error("Simulation failed:", err);
    }
  };

  const commitAction = async () => {
    if (!appliedSuggestionId) return;
    const sugg = suggestions.find(s => s.id === appliedSuggestionId);
    
    try {
      await fetch(`${API_BASE_URL}/actions/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_title: sugg.title,
          savings_inr: savings
        })
      });
      alert(`Committed: ${sugg.title}!`);
      setAppliedSuggestionId(null);
      setSavings(0);
      // Optionally refresh baseline here
    } catch (err) {
      console.error("Commit failed", err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-2 space-y-6">
        <div>
           <h2 className="text-2xl font-bold">Action Simulator</h2>
           <p className="text-sm opacity-60">Visualize impact before you act.</p>
        </div>
        
        <Card isDarkMode={isDarkMode} className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={simulatedData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
              <XAxis dataKey="name" stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
              <YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
              <RechartsTooltip contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff' }} />
              <Legend />
              <Area type="monotone" dataKey="val" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} name="Projected Usage (kW)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* SUGGESTIONS CHECKLIST UI */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Available Optimization Actions</h3>
          {suggestions.length === 0 ? (
             <div className="p-4 rounded-xl border border-dashed opacity-50 text-center">No suggestions available right now.</div>
          ) : (
            suggestions.map(suggestion => (
              <div 
                key={suggestion.id}
                onClick={() => handleSimulate(suggestion)}
                className={`cursor-pointer flex items-center justify-between p-4 rounded-xl border transition-all ${
                  appliedSuggestionId === suggestion.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                    : `hover:bg-slate-50 dark:hover:bg-slate-800 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 transition-colors ${appliedSuggestionId === suggestion.id ? 'text-indigo-600' : 'text-slate-300'}`}>
                     {appliedSuggestionId === suggestion.id ? <CheckSquare size={20} /> : <Square size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <h4 className="font-bold text-sm">{suggestion.title || suggestion.id}</h4>
                       <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                        suggestion.severity === 'high' ? 'bg-red-100 text-red-600' : 
                        suggestion.severity === 'medium' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {suggestion.severity || 'Normal'}
                      </span>
                    </div>
                    <p className="text-sm opacity-70 mt-1">{suggestion.message}</p>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-2">Targeting: {suggestion.affected_appliance}</p>
                  </div>
                </div>
                {appliedSuggestionId === suggestion.id && (
                  <div className="text-right">
                     <span className="text-xs font-bold text-green-600">Simulating...</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="lg:col-span-1">
        <Card isDarkMode={isDarkMode} className="h-full flex flex-col justify-between sticky top-6">
           <div>
             <h3 className="text-lg font-bold mb-6">Simulation Summary</h3>
             <div className="space-y-4 mb-8">
               <div className="flex justify-between items-center text-sm">
                 <span className="opacity-70">Current Daily Cost</span>
                 <span className="font-bold">₹120.00</span>
               </div>
               <div className="flex justify-between items-center text-sm text-green-600 dark:text-green-400">
                 <span className="flex items-center gap-2"><TrendingDown className="h-4 w-4" /> Potential Savings</span>
                 <span className="font-bold">- ₹{savings.toFixed(2)}</span>
               </div>
               <div className="h-px bg-slate-200 dark:bg-slate-700 my-4"></div>
               <div className="flex justify-between items-center text-lg">
                 <span>New Projection</span>
                 <span className="font-bold text-indigo-600 dark:text-indigo-400">₹{(120 - savings).toFixed(2)}</span>
               </div>
             </div>
           </div>
           
           <button 
             disabled={savings === 0}
             onClick={commitAction}
             className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
           >
             Commit Actions
           </button>
        </Card>
      </div>
    </div>
  );
};

// 4. GAMIFICATION (REAL API)
const Gamification = ({ isDarkMode }) => {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/gamification/leaderboard`)
      .then(res => res.json())
      .then(data => {
          if (Array.isArray(data)) setLeaderboard(data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-2">Community Leaderboard</h2>
        <p className="opacity-60">Compete with neighbors to lower your carbon footprint.</p>
      </div>

      <Card isDarkMode={isDarkMode} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={`bg-slate-50 dark:bg-slate-800/50 text-xs uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <tr>
                <th className="px-6 py-4 font-semibold">Rank</th>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Monthly Cost</th>
                <th className="px-6 py-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {leaderboard.map((user) => (
                <tr key={user.rank} className={`${user.is_user ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''} hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors`}>
                  <td className="px-6 py-4">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      user.rank === 1 ? 'bg-yellow-100 text-yellow-700' : 
                      user.rank === 2 ? 'bg-slate-200 text-slate-700' : 
                      user.rank === 3 ? 'bg-orange-100 text-orange-800' : 'bg-transparent'
                    }`}>
                      {user.rank <= 3 ? user.rank : `#${user.rank}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                       <User size={16} />
                    </div>
                    {user.name} {user.is_user && <span className="text-xs px-2 py-0.5 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">You</span>}
                  </td>
                  <td className="px-6 py-4 text-sm">₹{user.monthly_cost_inr}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {user.rank <= 3 ? "Top 5%" : "Active"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// 5. REPORTS (REAL API LINKS)
const Reports = ({ isDarkMode }) => {
  const handleDownloadPdf = () => {
    window.open(`${API_BASE_URL}/report/generate-pdf`, '_blank');
  };

  const handleDownloadJson = () => {
    window.open(`${API_BASE_URL}/report/download-enhanced`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">Reports & Documentation</h2>
          <p className="opacity-60">Generate PDFs and detailed analysis files.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card isDarkMode={isDarkMode} className="group hover:border-indigo-500 transition-all cursor-pointer">
          <div onClick={handleDownloadPdf}>
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20">
                <FileText size={24} />
              </div>
              <Download className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">Monthly Energy Statement</h3>
            <p className="text-sm opacity-60 mb-4">Comprehensive PDF report including daily breakdown, cost analysis, and anomalies for November 2025.</p>
            <button className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Generate PDF &rarr;</button>
          </div>
        </Card>

        <Card isDarkMode={isDarkMode} className="group hover:border-indigo-500 transition-all cursor-pointer">
          <div onClick={handleDownloadJson}>
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20">
                <Zap size={24} />
              </div>
              <Download className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">AI Enhanced Insights</h3>
            <p className="text-sm opacity-60 mb-4">JSON export containing raw data points and LLM-generated suggestions for further processing.</p>
            <button className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Download JSON &rarr;</button>
          </div>
        </Card>
      </div>

      <Card isDarkMode={isDarkMode}>
         <h3 className="font-bold mb-4">Recent Generated Reports</h3>
         <div className="space-y-2">
           {[1,2,3].map(i => (
             <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
               <div className="flex items-center gap-3">
                 <FileText size={16} className="opacity-50" />
                 <span className="text-sm">Energy_Report_Nov_2025_v{i}.pdf</span>
               </div>
               <span className="text-xs opacity-50">Nov {28-i}, 2025</span>
             </div>
           ))}
         </div>
      </Card>
    </div>
  );
};

// 6. AI CHAT (REAL API)
const AIChat = ({ isDarkMode }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I'm your Energy Assistant. Ask me about your bill, savings, or specific appliance usage." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE_URL}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I'm having trouble reaching the brain currently." }]);
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col max-w-4xl mx-auto">
      <Card isDarkMode={isDarkMode} className="flex-1 flex flex-col overflow-hidden p-0">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
          <Bot className="text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="font-bold text-sm">Energy LLM Assistant</h3>
            <p className="text-xs opacity-60 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> Online
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                m.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : `${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'} rounded-bl-none`
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {isTyping && (
             <div className="flex justify-start">
               <div className={`rounded-2xl px-4 py-3 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'} rounded-bl-none`}>
                 <div className="flex gap-1">
                   <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                   <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                   <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                 </div>
               </div>
             </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your energy usage..."
              className={`flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
            />
            <button 
              onClick={handleSend}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// 7. SETTINGS (REAL API)
const SettingsPage = ({ appliances, setAppliances, goals, setGoals }) => {
  const [newAppliance, setNewAppliance] = useState("");

  const addAppliance = () => {
    if (newAppliance && !appliances.includes(newAppliance)) {
      setAppliances([...appliances, newAppliance]);
      setNewAppliance("");
    }
  };

  const saveConfig = async () => {
    try {
       // Save Goals
       await fetch(`${API_BASE_URL}/config/goals`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(goals)
       });

       // Save Appliances
       await fetch(`${API_BASE_URL}/config/appliances`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ appliances: appliances })
       });

       alert("Configuration Saved Successfully!");
    } catch (err) {
      console.error("Config save failed", err);
      alert("Failed to save configuration.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold">System Configuration</h2>
        <p className="opacity-60">Manage your digital twin parameters.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 dark:border-slate-700">Goals & Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Monthly kWh Goal</label>
            <input 
              type="number" 
              value={goals.monthly_kwh_goal}
              onChange={(e) => setGoals({...goals, monthly_kwh_goal: parseFloat(e.target.value)})}
              className="w-full p-2 rounded border dark:bg-slate-800 dark:border-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Peak Load Threshold (kW)</label>
            <input 
              type="number" 
              value={goals.kw_limit_threshold}
              onChange={(e) => setGoals({...goals, kw_limit_threshold: parseFloat(e.target.value)})}
              className="w-full p-2 rounded border dark:bg-slate-800 dark:border-slate-700"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 dark:border-slate-700">Registered Appliances</h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={newAppliance}
            onChange={(e) => setNewAppliance(e.target.value)}
            placeholder="E.g. Dishwasher"
            className="flex-1 p-2 rounded border dark:bg-slate-800 dark:border-slate-700"
          />
          <button onClick={addAppliance} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Add</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {appliances.map(app => (
            <span key={app} className="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-sm flex items-center gap-2">
              {app}
              <button onClick={() => setAppliances(appliances.filter(a => a !== app))} className="hover:text-red-500"><X size={14}/></button>
            </span>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <button 
          onClick={saveConfig}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg shadow-green-500/30 transition-all"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
};