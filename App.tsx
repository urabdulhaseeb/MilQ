import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import UploadZone from './components/UploadZone';
import { analyzeTestCards } from './services/geminiService';
import { downloadPDF } from './services/pdfService';
import { TestResult, OverallStatus, AdulterantStatus } from './types';
import { Play, RotateCcw, ChevronRight, CheckCircle2, XCircle, AlertTriangle, FileDown, Plus, Droplets, History, Eye, Info, Loader2, Tag, Mail, MessageSquare, Beaker, Home, Search, Filter } from 'lucide-react';

type Screen = 'home' | 'history' | 'about' | 'help' | 'settings' | 'analyzing' | 'results' | 'contact';
type ResultSubTab = 'summary' | 'details';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Screen>('home');
  const [resultSubTab, setResultSubTab] = useState<ResultSubTab>('summary');
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [testTag, setTestTag] = useState<string>('');
  const [currentResult, setCurrentResult] = useState<TestResult | null>(null);
  const [history, setHistory] = useState<TestResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SAFE' | 'UNSAFE'>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('milko_theme');
    return saved === 'dark';
  });

  useEffect(() => {
    const saved = localStorage.getItem('milko_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('milko_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const saveToHistory = (result: TestResult) => {
    const newHistory = [result, ...history];
    setHistory(newHistory);
    localStorage.setItem('milko_history', JSON.stringify(newHistory));
  };

  const handleAnalyze = async () => {
    if (!beforeImage || !afterImage) return;
    
    setActiveTab('analyzing');
    setError(null);

    try {
      const result = await analyzeTestCards(beforeImage, afterImage);
      const resultWithTag: TestResult = {
        ...result,
        tag: testTag.trim() || undefined
      };
      setCurrentResult(resultWithTag);
      saveToHistory(resultWithTag);
      setResultSubTab('summary');
      setActiveTab('results');
    } catch (err: any) {
      console.error(err);
      setError("Analysis failed. Please try again with clearer photos.");
      setActiveTab('home');
    }
  };

  const handleGeneratePdf = async () => {
    if (!currentResult) return;
    setIsGeneratingPdf(true);
    try {
      await downloadPDF(currentResult);
    } catch (err) {
      console.error("PDF Export failed", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const resetTest = () => {
    setBeforeImage(null);
    setAfterImage(null);
    setTestTag('');
    setCurrentResult(null);
    setActiveTab('home');
  };

  const renderHome = () => (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <section className="text-center space-y-2">
        <h1 className="font-poppins text-2xl font-bold text-[#212529] dark:text-white">Test Your Milk Quality</h1>
        <p className="text-sm text-[#6C757D] dark:text-slate-400">Upload before & after card images for AI analysis</p>
      </section>

      <section className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[#6C757D] dark:text-slate-500 flex items-center gap-1.5 ml-1">
          <Tag size={12} className="text-[#2962FF]" />
          Test Tag / Reference
        </label>
        <input 
          type="text" 
          value={testTag}
          onChange={(e) => setTestTag(e.target.value)}
          placeholder="e.g. Batch 42, Morning Collection"
          className="w-full px-4 py-3.5 rounded-[20px] border border-gray-200 dark:border-slate-800 bg-[#F5F7FA] dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 focus:border-[#2962FF] outline-none text-sm transition-all dark:text-white"
        />
      </section>

      <div className="space-y-3">
        <section className="flex gap-4">
          <UploadZone 
            label="Before Image" 
            subLabel="DRY Card"
            image={beforeImage ? `data:image/jpeg;base64,${beforeImage}` : null} 
            onUpload={setBeforeImage}
            onClear={() => setBeforeImage(null)}
            isDarkMode={isDarkMode}
          />
          <UploadZone 
            label="After Image" 
            subLabel="MILK Card"
            image={afterImage ? `data:image/jpeg;base64,${afterImage}` : null} 
            onUpload={setAfterImage}
            onClear={() => setAfterImage(null)}
            isDarkMode={isDarkMode}
          />
        </section>
        <p className="text-[10px] text-center text-[#6C757D] dark:text-slate-500 leading-tight px-4 italic">
          Ensure photos are taken in bright light, centered, and free of glare or shadows for accurate chemical analysis.
        </p>
      </div>

      <button
        disabled={!beforeImage || !afterImage}
        onClick={handleAnalyze}
        className={`
          w-full py-4 rounded-[20px] flex items-center justify-center gap-2 font-bold transition-all duration-200 shadow-lg active:scale-95
          ${(!beforeImage || !afterImage) 
            ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed shadow-none' 
            : 'bg-[#2962FF] text-white hover:bg-[#1E50D6] shadow-blue-100'}
        `}
      >
        <Play size={20} fill="currentColor" />
        ANALYZE NOW
      </button>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[#212529] dark:text-white flex items-center gap-2">
            <History size={18} className="text-[#2962FF]" />
            Recent Tests
          </h2>
          <button onClick={() => setActiveTab('history')} className="text-xs font-bold text-[#2962FF] uppercase tracking-wider">See All</button>
        </div>
        
        {history.length > 0 ? (
          <div className="space-y-3">
            {history.slice(0, 3).map((test) => (
              <div 
                key={test.id} 
                className="p-4 rounded-[20px] bg-[#F5F7FA] dark:bg-slate-900/50 border border-[#E0E0E0] dark:border-slate-800 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => { 
                  setCurrentResult(test); 
                  setResultSubTab('summary');
                  setActiveTab('results'); 
                }}
              >
                <div className="flex flex-col gap-0.5">
                  <p className="font-bold text-sm truncate max-w-[180px] dark:text-white">
                    {test.tag || `Test #${test.id.split('-')[1]}`}
                  </p>
                  <p className="text-[10px] text-[#6C757D] dark:text-slate-400">{new Date(test.timestamp).toLocaleDateString()} • {new Date(test.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${test.status === 'SAFE' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                    {test.status}
                  </span>
                  <ChevronRight size={16} className="text-[#6C757D] dark:text-slate-600" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-gray-50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
            <p className="text-sm text-gray-400 italic">No tests yet. Start your first analysis!</p>
          </div>
        )}
      </section>
    </div>
  );

  const renderAnalyzing = () => (
    <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-20 animate-in fade-in zoom-in duration-300">
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl bg-[#2962FF]/10 flex items-center justify-center text-[#2962FF] animate-bounce">
          <Droplets size={40} />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg animate-spin">
           <Search size={20} className="text-[#2962FF]" />
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="font-poppins text-2xl font-bold text-[#212529] dark:text-white">Analyzing Milk</h2>
        <p className="text-[#6C757D] dark:text-slate-400 max-w-[200px] mx-auto text-sm">Identifying potential adulterants...</p>
      </div>
      <div className="w-56 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
        <div className="absolute top-0 bottom-0 left-0 bg-[#2962FF] w-1/3 rounded-full animate-loading"></div>
      </div>
    </div>
  );

  const renderResults = () => {
    if (!currentResult) return null;

    const detected = currentResult.results.filter(r => r.status === AdulterantStatus.DETECTED);
    const passed = currentResult.results.filter(r => r.status === AdulterantStatus.PASS);

    return (
      <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <button onClick={() => setActiveTab('home')} className="flex items-center gap-2 text-[#6C757D] dark:text-slate-400 text-sm font-medium">
            <ChevronRight className="rotate-180" size={16} />
            Back to Test
          </button>
          {currentResult.tag && (
            <span className="text-xs font-bold text-[#212529] dark:text-white bg-[#F5F7FA] dark:bg-slate-900/50 px-3 py-1 rounded-full border border-gray-100 dark:border-slate-800 max-w-[150px] truncate">
              {currentResult.tag}
            </span>
          )}
        </div>

        <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-[#E0E0E0] dark:border-slate-800 shadow-sm flex flex-col items-center text-center space-y-4">
          <div className={`flex items-center gap-2 px-8 py-2.5 rounded-full text-sm font-bold shadow-sm ${currentResult.status === 'SAFE' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
            {currentResult.status === 'SAFE' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {currentResult.status}
          </div>
          <div className="text-xl font-mono-roboto font-bold text-[#212529] dark:text-white">
            Adulterant present : {detected.length}/5
          </div>
        </section>

        <div className="flex bg-gray-50 dark:bg-slate-900 p-1 rounded-2xl relative">
          <button 
            onClick={() => setResultSubTab('summary')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${resultSubTab === 'summary' ? 'bg-white dark:bg-slate-800 shadow-sm text-[#2962FF]' : 'text-gray-500 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800/50'}`}
          >
            SUMMARY
          </button>
          <button 
            onClick={() => setResultSubTab('details')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${resultSubTab === 'details' ? 'bg-white dark:bg-slate-800 shadow-sm text-[#2962FF]' : 'text-gray-500 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800/50'}`}
          >
            DETAILS
          </button>
        </div>

        {resultSubTab === 'summary' ? (
          <>
            {detected.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest flex items-center gap-2">
                  <XCircle size={14} />
                  Detected Adulterants
                </h3>
                {detected.map((res, i) => (
                  <div key={i} className="bg-red-50 dark:bg-red-900/10 p-4 rounded-[20px] border border-red-100 dark:border-red-900/20 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#212529] dark:text-white">{res.adulterant}</span>
                      <span className="text-xs font-mono-roboto text-red-600 dark:text-red-400">{res.confidence}% Conf.</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="text-[#6C757D] dark:text-slate-500">Severity: <span className="font-bold text-red-700 dark:text-red-400">{res.severity}</span></div>
                      <div className="text-[#6C757D] dark:text-slate-500">Color: <span className="font-medium dark:text-slate-300">{res.colorChange}</span></div>
                    </div>
                    <div className="text-[11px] p-2 bg-white/50 dark:bg-slate-900/50 rounded-lg text-red-800 dark:text-red-300 leading-relaxed italic">
                      <strong>Action:</strong> {res.recommendation}
                    </div>
                  </div>
                ))}
              </section>
            )}

            <section className="space-y-3">
              <h3 className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 size={14} />
                Negative / Pass
              </h3>
              <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-[20px] border border-green-100 dark:border-green-900/20 grid grid-cols-1 gap-3">
                {passed.length > 0 ? passed.map((res, i) => (
                  <div key={i} className="flex justify-between items-center text-sm border-b border-green-100 dark:border-green-900/10 pb-2 last:border-0 last:pb-0">
                    <span className="font-medium text-green-800 dark:text-green-300">{res.adulterant}</span>
                    <span className="text-[10px] font-mono-roboto text-green-600 dark:text-green-400">PASS ({res.confidence}%)</span>
                  </div>
                )) : (
                   <p className="text-xs text-green-700 dark:text-green-400 italic">No clear adulterants identified.</p>
                )}
              </div>
            </section>
          </>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-3">
               <div className="flex justify-between items-end">
                <h3 className="text-xs font-bold text-[#6C757D] dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Eye size={14} />
                  Visual Comparison
                </h3>
              </div>
              <div className="flex gap-4">
                 <div className="flex-1 space-y-1">
                    <div className="aspect-square bg-gray-100 dark:bg-slate-800 rounded-[20px] overflow-hidden border border-gray-200 dark:border-slate-800">
                       <img src={currentResult.beforeImage} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[10px] text-center font-bold text-[#6C757D] dark:text-slate-500 uppercase">Before</p>
                 </div>
                 <div className="flex-1 space-y-1">
                    <div className="aspect-square bg-gray-100 dark:bg-slate-800 rounded-[20px] overflow-hidden border border-gray-200 dark:border-slate-800">
                       <img src={currentResult.afterImage} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[10px] text-center font-bold text-[#6C757D] dark:text-slate-500 uppercase">After</p>
                 </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#6C757D] dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Info size={14} />
                Chemical Reading Details
              </h3>
              {currentResult.results.map((res, i) => (
                <div key={i} className="p-4 bg-[#F8F9FA] dark:bg-slate-900/50 border border-[#E0E0E0] dark:border-slate-800 rounded-[20px] space-y-2">
                  <div className="flex justify-between items-center">
                     <span className="font-bold text-sm text-[#212529] dark:text-white">{res.adulterant}</span>
                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                       res.status === AdulterantStatus.DETECTED ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 
                       res.status === AdulterantStatus.PASS ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                     }`}>
                       {res.status}
                     </span>
                  </div>
                  <div className="text-[11px] space-y-1">
                    <p className="text-[#6C757D] dark:text-slate-400"><strong>Color Shift:</strong> {res.colorChange}</p>
                    {res.healthRisk && <p className="text-[#6C757D] dark:text-slate-400"><strong>Health Risk:</strong> <span className="text-red-600 dark:text-red-400">{res.healthRisk}</span></p>}
                    <p className="text-[#6C757D] dark:text-slate-400 leading-relaxed"><strong>Guidance:</strong> {res.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4 sticky bottom-4">
          <button 
            disabled={isGeneratingPdf}
            onClick={handleGeneratePdf}
            className={`flex-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 py-4 rounded-[20px] flex items-center justify-center gap-2 font-bold text-sm shadow-md active:scale-95 transition-all
              ${isGeneratingPdf ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-white'}
            `}
          >
            {isGeneratingPdf ? (
              <Loader2 size={18} className="animate-spin text-gray-500" />
            ) : (
              <FileDown size={18} />
            )}
            {isGeneratingPdf ? 'Generating...' : 'PDF Report'}
          </button>
          <button 
            disabled={isGeneratingPdf}
            onClick={resetTest}
            className="flex-1 bg-[#2962FF] text-white py-4 rounded-[20px] flex items-center justify-center gap-2 font-bold text-sm shadow-lg active:scale-95 hover:bg-[#1E50D6] transition-all disabled:opacity-50"
          >
            <RotateCcw size={18} />
            New Test
          </button>
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    const filteredHistory = history.filter(test => {
      const matchesSearch = (test.tag || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            test.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || test.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <h2 className="font-poppins text-2xl font-bold text-[#212529] dark:text-white">Test History</h2>
        
        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search tests by tag or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-[20px] bg-[#F5F7FA] dark:bg-slate-900 border border-[#E0E0E0] dark:border-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-[#2962FF] outline-none text-sm dark:text-white transition-all"
            />
          </div>

          <div className="flex gap-2">
            {(['ALL', 'SAFE', 'UNSAFE'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`flex-1 py-2 text-[10px] font-bold rounded-full border transition-all ${
                  statusFilter === filter 
                    ? 'bg-[#2962FF] border-[#2962FF] text-white' 
                    : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:border-[#2962FF]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {filteredHistory.length > 0 ? (
          <div className="space-y-4">
            {filteredHistory.map((test) => (
              <div 
                key={test.id} 
                className="bg-[#F5F7FA] dark:bg-slate-900/50 border border-[#E0E0E0] dark:border-slate-800 rounded-[20px] p-5 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => { 
                  setCurrentResult(test); 
                  setResultSubTab('summary');
                  setActiveTab('results'); 
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="max-w-[70%]">
                    <h3 className="font-bold text-lg truncate dark:text-white">
                      {test.tag || `Test #${test.id.split('-')[1]}`}
                    </h3>
                    <p className="text-xs text-[#6C757D] dark:text-slate-400">
                      {new Date(test.timestamp).toLocaleDateString()} at {new Date(test.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); downloadPDF(test); }}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-slate-400"
                      title="Download PDF"
                    >
                      <FileDown size={18} />
                    </button>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold h-fit ${test.status === 'SAFE' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                      {test.status}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-white dark:border-slate-700 shadow-sm">
                    <img src={test.beforeImage} className="w-full h-full object-cover" />
                  </div>
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-white dark:border-slate-700 shadow-sm">
                    <img src={test.afterImage} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center pl-2">
                    <p className="text-[10px] text-[#6C757D] dark:text-slate-500 uppercase tracking-widest font-bold">Detected</p>
                    <p className="text-xs font-bold text-[#212529] dark:text-white">
                      {test.results.filter(r => r.status === AdulterantStatus.DETECTED).length || 'None'} found
                    </p>
                  </div>
                  <div className="flex items-center">
                     <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center group-hover:bg-[#2962FF] group-hover:text-white transition-colors">
                       <ChevronRight size={16} className="dark:text-slate-400" />
                     </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center text-gray-200 dark:text-slate-700">
               <History size={40} />
            </div>
            <p className="text-[#6C757D] dark:text-slate-400">
              {searchQuery || statusFilter !== 'ALL' ? 'No matching tests found.' : 'No test history available.'}
            </p>
            {(searchQuery || statusFilter !== 'ALL') && (
              <button onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }} className="text-[#2962FF] font-bold text-sm">Clear Filters</button>
            )}
            {!searchQuery && statusFilter === 'ALL' && (
              <button onClick={() => setActiveTab('home')} className="text-[#2962FF] font-bold">Start First Test</button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderAbout = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="font-poppins text-2xl font-bold text-[#212529] dark:text-white">About the Developer</h2>
      
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-gray-100 dark:border-slate-800 shadow-xl space-y-4">
        <p className="text-sm leading-relaxed text-[#212529] dark:text-white">
          MilQ is a student-developed innovation by <span className="font-bold text-[#2962FF]">Abdul Haseeb</span>, 
          created to combine a paper-based milk adulteration test card with digital image analysis for easy, on-spot screening.
        </p>
        <p className="text-[11px] font-bold text-[#6C757D] dark:text-slate-500 uppercase tracking-widest border-t border-gray-100 dark:border-slate-800 pt-3">
          Student Innovation | Food Safety & Quality Assurance
        </p>
      </div>

      <button 
        onClick={() => setActiveTab('contact')}
        className="w-full bg-[#2962FF] text-white py-4 rounded-[20px] flex items-center justify-center gap-2 font-bold text-sm shadow-lg active:scale-95 hover:bg-[#1E50D6] transition-all"
      >
        <MessageSquare size={18} />
        Get in Touch
      </button>
    </div>
  );

  const renderContact = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="font-poppins text-2xl font-bold text-[#212529] dark:text-white">Get in Touch</h2>
      
      <p className="text-sm text-[#6C757D] dark:text-slate-400 px-1">
        Have questions or feedback about MilQ? I'd love to hear from you.
      </p>

      <a 
        href="mailto:abdulhaseeb0825@gmail.com"
        className="block group"
      >
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-gray-100 dark:border-slate-800 shadow-xl flex items-center justify-between group-hover:border-[#2962FF] transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#2962FF]/10 flex items-center justify-center text-[#2962FF]">
              <Mail size={24} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#6C757D] dark:text-slate-500 uppercase tracking-widest">Email Support</p>
              <p className="text-sm font-bold text-[#212529] dark:text-white break-all">abdulhaseeb0825@gmail.com</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-[#6C757D] dark:text-slate-500 group-hover:text-[#2962FF] transition-colors" />
        </div>
      </a>

      <div className="pt-10 space-y-4">
        <button 
          onClick={() => setActiveTab('home')}
          className="w-full bg-[#2962FF] text-white py-4 rounded-[20px] flex items-center justify-center gap-2 font-bold text-sm shadow-lg active:scale-95 hover:bg-[#1E50D6] transition-all"
        >
          <Home size={18} />
          Back to Home
        </button>
      </div>
    </div>
  );

  return (
    <Layout activeTab={activeTab} onNavigate={(tab) => setActiveTab(tab as Screen)}>
      {activeTab === 'home' && renderHome()}
      {activeTab === 'history' && renderHistory()}
      {activeTab === 'analyzing' && renderAnalyzing()}
      {activeTab === 'results' && renderResults()}
      {activeTab === 'about' && renderAbout()}
      {activeTab === 'contact' && renderContact()}
      {activeTab === 'help' && (
        <div className="space-y-4">
          <h2 className="font-poppins text-2xl font-bold dark:text-white">Help & Guide</h2>
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">Step-by-step instructions for using MilQ.</p>
          <div className="space-y-4 bg-gray-50 dark:bg-slate-900/50 p-6 rounded-[24px] border border-gray-100 dark:border-slate-800">
            {[
              "Take and save a photo of the dry test card before use",
              "Place the card on a flat surface and use the provided dropper",
              "For Water (Section A), place the drop on the left and tilt/drag it to the right to form a trail",
              "Add one drop of milk to each remaining test section",
              "Wait 30 seconds and let the drops absorb naturally",
              "Compare reactions with the reference chart on the box, or",
              "Upload Before & After photos in the MILKO app",
              "View results and download or share the report"
            ].map((step, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="text-[#2962FF] font-bold shrink-0">•</span>
                <p className="text-sm font-medium dark:text-slate-300 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
          <p className="text-xs italic text-gray-500 dark:text-slate-500 mt-2 px-1">
            For screening only. Lab confirmation recommended.
          </p>
        </div>
      )}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h2 className="font-poppins text-2xl font-bold text-[#212529] dark:text-white">Settings</h2>
          <div className="space-y-4">
            <button 
              onClick={() => setActiveTab('contact')}
              className="w-full p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[20px] shadow-sm flex items-center justify-between hover:border-[#2962FF] transition-all"
            >
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-[#2962FF]" />
                <span className="font-medium text-sm dark:text-white">Contact Support</span>
              </div>
              <ChevronRight size={16} className="text-[#6C757D] dark:text-slate-500" />
            </button>
            <div className="p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[20px] shadow-sm flex items-center justify-between">
              <span className="font-medium text-sm dark:text-white">Dark Mode</span>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-12 h-6 rounded-full relative transition-colors duration-300 flex items-center p-1 ${isDarkMode ? 'bg-[#2962FF]' : 'bg-gray-200 dark:bg-slate-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'home' && (
        <button 
          onClick={() => resetTest()}
          className="fixed bottom-24 right-6 w-14 h-14 bg-[#2962FF] text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform md:hidden"
        >
          <Plus size={28} />
        </button>
      )}
    </Layout>
  );
};

export default App;