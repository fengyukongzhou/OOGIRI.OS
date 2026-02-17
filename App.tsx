import React, { useState, useEffect, useRef } from 'react';
import * as Gemini from './services/geminiService';
import { MemeCanvas } from './components/MemeCanvas';
import { AppState, AnalysisData, EvaluationItem } from './types';

// System log messages for "Fake" terminal output while waiting
const SYSTEM_LOGS = [
  "Initializing neural link...",
  "Bypassing humor inhibitors...",
  "Loading cultural context database...",
  "Analyzing pixel density...",
  "Connecting to comedy subnet...",
  "Optimizing punchline vectors...",
  "Refining sarcasm parameters...",
  "Dropping packet loss on cringe frames...",
  "Injecting absurdity serum..."
];

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Pipeline Data
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [strategy, setStrategy] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [finalCaptions, setFinalCaptions] = useState<string[]>([]);

  // Terminal UI State
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
    setLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  const handleError = (e: any) => {
    console.error(e);
    let msg = e.message || "Unknown error";
    if (msg.includes("permission denied") || msg.includes("Requested entity was not found")) {
      msg = "ACCESS DENIED: API KEY INVALID OR RESTRICTED.";
    }
    setErrorMessage(msg);
    addLog(`[ERROR] ${msg}`);
    setAppState(AppState.ERROR);
  };

  // --- Automatic Pipeline Logic ---

  // NOTE: Removed auto-trigger useEffect. Now handled by startPipeline.

  // 2. Trigger Strategy when Analysis is done
  useEffect(() => {
    if (appState === AppState.ANALYZED) {
      addLog(">> VISUAL DATA EXTRACTED");
      runStep2();
    }
  }, [appState]);

  // 3. Trigger Strategy when Analysis is done
  useEffect(() => {
    if (appState === AppState.STRATEGIZED) {
      addLog(">> HUMOR STRATEGY MAPPED");
      runStep3();
    }
  }, [appState]);

  // 4. Trigger Evaluation when Divergence is done
  useEffect(() => {
    if (appState === AppState.DIVERGED) {
      addLog(`>> GENERATED ${candidates.length} CANDIDATES`);
      runStep4();
    }
  }, [appState]);

  // 5. Trigger Ranking when Evaluation is done
  useEffect(() => {
    if (appState === AppState.EVALUATED) {
      addLog(">> AUDIT COMPLETE. CALCULATING FINAL RANKING...");
      runStep5();
    }
  }, [appState]);


  // --- Async Runners ---

  const startPipeline = () => {
    if (!imageSrc) return;
    setAppState(AppState.ANALYZING);
    addLog(">> MANUAL OVERRIDE: INITIATING OOGIRI PROTOCOL");
    runStep1();
  };

  const runStep1 = async () => {
    try {
      addLog("EXEC: visual_analysis_agent.exe");
      const b64 = imageSrc!.split(',')[1];
      const res = await Gemini.runAnalysis(b64, mimeType);
      setAnalysis(res);
      setAppState(AppState.ANALYZED);
    } catch (e: any) { handleError(e); }
  };

  const runStep2 = async () => {
    setAppState(AppState.STRATEGIZING);
    try {
      addLog("EXEC: dual_path_strategist.exe --mode=boke_tsukkomi");
      const b64 = imageSrc!.split(',')[1];
      const res = await Gemini.runStrategy(b64, mimeType, analysis!);
      setStrategy(res);
      setAppState(AppState.STRATEGIZED);
    } catch (e: any) { handleError(e); }
  };

  const runStep3 = async () => {
    setAppState(AppState.DIVERGING);
    try {
      addLog("EXEC: creative_divergence.py --temp=1.0");
      const b64 = imageSrc!.split(',')[1];
      const res = await Gemini.runDivergence(b64, mimeType, analysis!, strategy!);
      setCandidates(res);
      setAppState(AppState.DIVERGED);
    } catch (e: any) { handleError(e); }
  };

  const runStep4 = async () => {
    setAppState(AppState.EVALUATING);
    try {
      addLog("EXEC: logic_critic.wasm --audit");
      const b64 = imageSrc!.split(',')[1];
      const res = await Gemini.runEvaluation(b64, mimeType, candidates);
      setEvaluations(res);
      setAppState(AppState.EVALUATED);
    } catch (e: any) { handleError(e); }
  };

  const runStep5 = async () => {
    setAppState(AppState.RANKING);
    try {
      addLog("EXEC: final_selection.sh");
      const b64 = imageSrc!.split(',')[1];
      const res = await Gemini.runFinalRanking(b64, mimeType, evaluations);
      setFinalCaptions(res);
      setAppState(AppState.SUCCESS);
      addLog(">> PROCESS COMPLETE. RENDERING OUTPUT.");
    } catch (e: any) { handleError(e); }
  };


  // --- Helpers ---

  const processFile = (file: File) => {
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageSrc(e.target.result as string);
        resetState(); // Reset but wait for user to click start
      }
    };
    reader.readAsDataURL(file);
  };

  const resetState = () => {
    setAppState(AppState.IDLE);
    setAnalysis(null);
    setStrategy(null);
    setCandidates([]);
    setEvaluations([]);
    setFinalCaptions([]);
    setErrorMessage(null);
    setLogs([]);
  };

  const downloadReport = () => {
    const report = {
        metadata: {
            app: "OOGIRI.OS v2.0",
            timestamp: new Date().toISOString(),
            status: appState
        },
        pipeline_logs: {
            "1_analysis": analysis,
            "2_strategy": strategy,
            "3_candidates_pool": candidates,
            "4_audit_evaluations": evaluations,
            "5_final_output": finalCaptions
        },
        system_terminal_history: logs
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MISSION_REPORT_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Random ambient logs during processing
  useEffect(() => {
    if (appState !== AppState.IDLE && appState !== AppState.SUCCESS && appState !== AppState.ERROR) {
      const interval = setInterval(() => {
        if (Math.random() > 0.7) {
          addLog(`[SYS] ${SYSTEM_LOGS[Math.floor(Math.random() * SYSTEM_LOGS.length)]}`);
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [appState]);

  // Global Paste Handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processFile(file);
            break; 
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);


  // --- Render ---

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-mono selection:bg-green-500 selection:text-black overflow-x-hidden">
      
      {/* HEADER */}
      <nav className="border-b border-neutral-900 px-6 py-4 flex justify-between items-center bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
           <h1 className="text-xl font-bold tracking-tighter">OOGIRI<span className="text-neutral-600">.OS</span></h1>
        </div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-widest hidden md:block">
           v2.0.1_BETA [CONNECTED]
        </div>
      </nav>

      <div className="container mx-auto max-w-7xl p-4 lg:p-8">
        
        {/* MAIN LAYOUT: Split for Desktop, Stack for Mobile */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[calc(100vh-140px)] transition-all`}>
          
          {/* LEFT PANEL: VISUAL INPUT (Sticky on PC) */}
          <div className="lg:col-span-5 flex flex-col h-full lg:sticky lg:top-24">
            
            {/* Image Container */}
            <div className={`relative flex-1 rounded-sm border-2 ${imageSrc ? 'border-neutral-800 bg-[#0a0a0a]' : 'border-dashed border-neutral-800 bg-neutral-900/20'} overflow-hidden transition-all flex flex-col items-center justify-center min-h-[300px] lg:min-h-0`}>
                
                {!imageSrc ? (
                    <label className="cursor-pointer group flex flex-col items-center p-8 text-center w-full h-full justify-center">
                        <div className="mb-4 text-6xl opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 group-hover:rotate-12">📂</div>
                        <span className="text-sm font-bold text-neutral-400 group-hover:text-green-400">UPLOAD / PASTE IMAGE</span>
                        <span className="text-[10px] text-neutral-600 mt-2 font-mono">JPG / PNG SUPPORTED</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
                    </label>
                ) : (
                    <>
                       {/* Source Image Display */}
                       <img src={imageSrc} alt="Target" className={`w-full h-full object-contain p-2 transition-all duration-700 ${appState === AppState.IDLE ? 'opacity-80 blur-none' : 'opacity-50 blur-sm grayscale'}`} />
                       
                       {/* Overlay Status Badge */}
                       {appState !== AppState.IDLE && (
                           <div className="absolute top-4 left-4">
                              <div className={`px-3 py-1 text-[10px] font-bold tracking-widest uppercase border ${appState === AppState.SUCCESS ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-yellow-500 text-yellow-500 bg-yellow-500/10'} backdrop-blur-md`}>
                                 {appState === AppState.SUCCESS ? 'TARGET_ACQUIRED' : 'PROCESSING...'}
                              </div>
                           </div>
                       )}

                        {/* START BUTTON OVERLAY */}
                        {appState === AppState.IDLE && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10 transition-all hover:bg-black/30">
                                <button 
                                    onClick={startPipeline}
                                    className="group relative px-8 py-4 bg-green-500 text-black font-black text-xl tracking-tighter clip-path-polygon hover:bg-white transition-all shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:shadow-[0_0_50px_rgba(255,255,255,0.6)]"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        INITIALIZE <span className="text-xs align-top opacity-50">↵</span>
                                    </span>
                                    <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 mix-blend-difference"></div>
                                </button>
                            </div>
                        )}

                       <button onClick={resetState} className="absolute bottom-4 right-4 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1 text-xs border border-red-500/50 transition-colors uppercase z-20">
                          Reset
                       </button>
                    </>
                )}
            </div>

            {/* Analysis Stats (Only show when data exists) */}
            {analysis && (
              <div className="mt-4 p-4 border border-neutral-800 bg-[#0a0a0a] text-[10px] font-mono text-neutral-400 hidden lg:block">
                  <div className="flex justify-between border-b border-neutral-800 pb-2 mb-2">
                     <span>> SUBJECT_STATE</span>
                     <span className="text-white">{analysis.subject_state.substring(0,20)}...</span>
                  </div>
                  <div className="flex justify-between">
                     <span>> CONFLICT_NODE</span>
                     <span className="text-white">{analysis.scene_conflict.substring(0,20)}...</span>
                  </div>
              </div>
            )}
          </div>


          {/* RIGHT PANEL: TERMINAL & RESULTS */}
          <div className="lg:col-span-7 flex flex-col h-full overflow-hidden relative">
             
             {/* If IDLE: Introduction */}
             {appState === AppState.IDLE && !imageSrc && (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
                   <div className="text-4xl mb-4 font-black tracking-tighter text-neutral-700">WAITING FOR INPUT</div>
                   <p className="text-xs font-mono max-w-md leading-relaxed text-neutral-500">
                      OOGIRI.OS is an automated humor generation pipeline. Upload an image to initiate the 5-stage cognitive process.
                   </p>
                </div>
             )}
             
             {/* If IDLE but image loaded: Prompt to start */}
             {appState === AppState.IDLE && imageSrc && (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                     <div className="w-16 h-16 border-2 border-green-500/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <div className="w-12 h-12 bg-green-500/20 rounded-full"></div>
                     </div>
                     <h3 className="text-xl font-bold text-white mb-2">TARGET LOCKED</h3>
                     <p className="text-neutral-500 text-xs font-mono">Ready to engage neural comedy engine.</p>
                </div>
             )}

             {/* If PROCESSING or ERROR: Show Terminal */}
             {(appState !== AppState.IDLE && appState !== AppState.SUCCESS) && (
                <div className="flex-1 bg-black border border-neutral-800 p-4 font-mono text-xs overflow-y-auto shadow-inner relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500/20 animate-pulse"></div>
                    {logs.map((log, i) => (
                        <div key={i} className={`mb-1 ${log.includes('ERROR') ? 'text-red-500 font-bold' : 'text-green-500/80'}`}>
                           {log}
                        </div>
                    ))}
                    <div ref={logsEndRef} className="animate-blink text-green-500 font-bold">_</div>
                </div>
             )}

             {/* If SUCCESS: Show Results Gallery */}
             {appState === AppState.SUCCESS && (
                <div className="h-full flex flex-col">
                   
                   <div className="shrink-0 mb-4 flex items-baseline justify-between border-b border-neutral-800 pb-2">
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                          <h2 className="text-lg font-bold text-white">GENERATION COMPLETE</h2>
                          <span className="text-xs text-neutral-500 font-mono">3 CANDIDATES SELECTED</span>
                      </div>
                      
                      {/* Download Log Button */}
                      <button 
                        onClick={downloadReport}
                        className="text-[10px] text-green-500 border border-green-500/50 px-2 py-1 hover:bg-green-500 hover:text-black transition-colors uppercase tracking-wider flex items-center gap-1"
                        title="Download full JSON report of the humor generation pipeline"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                         Export Log
                      </button>
                   </div>

                   {/* REFACTORED RESULT LAYOUT: Centered Podium / Gallery Style */}
                   <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                      <div className="flex flex-wrap justify-center items-start gap-8 lg:gap-6 w-full">
                          {finalCaptions.map((caption, idx) => (
                              <div 
                                key={idx} 
                                className="w-full lg:w-[30%] max-w-[380px] min-w-[280px] transform transition-all duration-500 hover:z-20 hover:-translate-y-2 lg:hover:scale-105"
                                style={{
                                    animation: `fadeInUp 0.6s ease-out ${idx * 0.15}s backwards`
                                }}
                              >
                                  <div className="relative group">
                                     <MemeCanvas imageSrc={imageSrc!} caption={caption} rank={idx + 1} />
                                  </div>
                              </div>
                          ))}
                      </div>
                   </div>
                   
                   {/* Mobile Reset Button at bottom of results */}
                   <button onClick={resetState} className="w-full py-4 bg-neutral-900 text-neutral-400 text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 lg:hidden shrink-0 mt-4">
                      Process New Image
                   </button>
                </div>
             )}

          </div>

        </div>
      </div>
      <style>{`
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .clip-path-polygon {
            clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
        }
      `}</style>
    </div>
  );
};

export default App;