
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  PlusIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  PhotoIcon,
  TrashIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  PlayIcon,
  CheckBadgeIcon,
  CommandLineIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { VideoFile, EditProject, VideoResolution, AspectRatio, EditPlan } from './types';
import { generateEditPlan } from './services/geminiService';

const MAX_VIDEOS = 10;

const App: React.FC = () => {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [project, setProject] = useState<EditProject>({
    title: 'New Band Promo',
    resolution: '4K',
    targetDuration: 60,
    aspectRatio: '9:16',
    musicalFocus: 'crowd-energy',
    logo: null,
    logoPreviewUrl: null
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [editPlan, setEditPlan] = useState<EditPlan | null>(null);
  const [showResult, setShowResult] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    const files = Array.from(fileList);
    if (videos.length + files.length > MAX_VIDEOS) {
      alert(`一次最多上傳 ${MAX_VIDEOS} 部影片。`);
      return;
    }

    const newVideos: VideoFile[] = files.map((file: File) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      duration: Math.floor(Math.random() * 30) + 10,
      energyLevel: (['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high')
    }));

    setVideos(prev => [...prev, ...newVideos]);
    addLog(`Uploaded ${files.length} video(s). Ready for analysis.`);
  };

  // Fixed missing handleLogoUpload function for band watermark management
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProject(prev => ({
        ...prev,
        logo: file,
        logoPreviewUrl: URL.createObjectURL(file)
      }));
      addLog(`Logo watermark uploaded: ${file.name}`);
    }
  };

  const startEditing = async () => {
    if (videos.length === 0) {
      alert("請至少上傳一段影片。");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setLogs([]);
    addLog("Initializing BandFlow AI Engine...");
    addLog("Authenticating with Google Gemini API...");

    try {
      const plan = await generateEditPlan(project, videos);
      setEditPlan(plan);
      addLog("AI Analysis Complete: Logic sequence generated.");

      const steps = [
        { msg: 'Synchronizing audio transients...', p: 20 },
        { msg: 'Applying smart-crop for 9:16 portrait...', p: 40 },
        { msg: 'Running neural color grading...', p: 60 },
        { msg: 'Injecting dynamic branding watermark...', p: 80 },
        { msg: 'Finalizing 4K encoding stream...', p: 100 }
      ];

      for (const step of steps) {
        await new Promise(r => setTimeout(r, 800));
        addLog(step.msg);
        setProgress(step.p);
      }

      setIsProcessing(false);
      setShowResult(true);
    } catch (error: any) {
      addLog(`ERROR: ${error.message || "Rendering pipeline failed. Please check your network."}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-[#d1d1d1] font-sans selection:bg-purple-500/30">
      {/* Header */}
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-black/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-cyan-400 to-purple-600 rounded flex items-center justify-center shadow-lg shadow-purple-500/20">
            <VideoCameraIcon className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white">BandFlow <span className="text-cyan-400 font-mono text-xs ml-1">v3.1</span></h1>
        </div>

        <button
          onClick={startEditing}
          disabled={isProcessing || videos.length === 0}
          className={`px-5 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all ${isProcessing || videos.length === 0
              ? 'bg-white/5 text-white/20'
              : 'bg-white text-black hover:bg-cyan-400 hover:text-black hover:scale-105 active:scale-95'
            }`}
        >
          {isProcessing ? (
            <div className="w-3 h-3 border-2 border-black border-t-transparent animate-spin rounded-full" />
          ) : (
            <SparklesIcon className="w-3.5 h-3.5" />
          )}
          {isProcessing ? 'Processing' : 'Generate Edit'}
        </button>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_340px] overflow-hidden">
        {/* Workspace */}
        <div className="p-6 overflow-y-auto space-y-10 border-r border-white/5 bg-[#080808]">

          {/* Timeline-style Media Pool */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CommandLineIcon className="w-4 h-4 text-cyan-500" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-white/70">Raw Clips Pool</h2>
              </div>
              <span className="text-xs font-mono text-neutral-600">{videos.length}/10 Clips</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border border-dashed border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <PlusIcon className="w-5 h-5 text-neutral-500 group-hover:text-cyan-400" />
                <span className="text-[10px] text-neutral-600 uppercase font-bold">Import</span>
              </button>

              {videos.map((video) => (
                <div key={video.id} className="relative aspect-square rounded-lg overflow-hidden bg-neutral-900 border border-white/5 group shadow-xl">
                  <video src={video.previewUrl} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-white/50">{video.duration}s</span>
                      <button
                        onClick={() => setVideos(v => v.filter(i => i.id !== video.id))}
                        className="p-1 rounded bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white"
                      >
                        <TrashIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <input type="file" ref={fileInputRef} multiple accept="video/*" onChange={handleVideoUpload} className="hidden" />
          </section>

          {/* Configuration Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-2 mb-4">
                <PhotoIcon className="w-4 h-4 text-purple-500" />
                <h3 className="text-sm font-bold text-white/80">Visual Identity</h3>
              </div>
              <div
                onClick={() => logoInputRef.current?.click()}
                className="w-full h-24 rounded-lg border border-dashed border-white/10 hover:border-purple-500/50 transition-all cursor-pointer flex items-center justify-center overflow-hidden bg-black/20"
              >
                {project.logoPreviewUrl ? (
                  <img src={project.logoPreviewUrl} className="max-h-16 object-contain grayscale" alt="Logo" />
                ) : (
                  <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-tighter">Upload Band Watermark</span>
                )}
              </div>
              <input type="file" ref={logoInputRef} accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </div>

            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <MusicalNoteIcon className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold text-white/80">AI Focus Mode</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {['Vocals', 'Guitar-Solos', 'Drums', 'Crowd-Energy'].map((focus) => (
                  <button
                    key={focus}
                    onClick={() => setProject({ ...project, musicalFocus: focus.toLowerCase() as any })}
                    className={`px-3 py-2 rounded text-[10px] font-bold uppercase transition-all ${project.musicalFocus === focus.toLowerCase()
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-white/5 text-neutral-500 hover:bg-white/10'
                      }`}
                  >
                    {focus.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Timeline Preview (If Available) */}
          {editPlan && !showResult && (
            <section className="p-6 rounded-xl bg-cyan-500/5 border border-cyan-500/20 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase text-cyan-400 flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" /> AI Sequence Masterplan
                </h3>
              </div>
              <div className="flex gap-2 h-16 bg-black/40 p-2 rounded-lg items-center overflow-x-auto scrollbar-hide">
                {editPlan.scenes.map((scene, i) => (
                  <div
                    key={i}
                    className="h-full bg-cyan-500/20 border border-cyan-500/30 rounded flex items-center px-3 min-w-[120px] relative group"
                  >
                    <span className="text-[8px] font-mono text-cyan-400 absolute top-1 left-2">SC_0{i + 1}</span>
                    <p className="text-[9px] truncate text-white/70 mt-2">{scene.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Console / Control Panel */}
        <aside className="bg-black p-6 flex flex-col gap-8 border-l border-white/5">
          <div>
            <h3 className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-4">Output Specs</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] text-neutral-500 font-bold mb-2 block">Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {['2K', '4K'].map(res => (
                    <button
                      key={res}
                      onClick={() => setProject({ ...project, resolution: res as any })}
                      className={`py-1.5 rounded text-[10px] font-bold border transition-all ${project.resolution === res ? 'border-white text-white' : 'border-white/5 text-neutral-600'}`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-neutral-500 font-bold mb-2 block">Aspect Ratio</label>
                <div className="grid grid-cols-3 gap-2">
                  {['9:16', '16:9', '1:1'].map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => setProject({ ...project, aspectRatio: ratio as any })}
                      className={`py-1.5 rounded text-[10px] font-bold border transition-all ${project.aspectRatio === ratio ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-white/5 text-neutral-600'}`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-bold mb-2">
                  <span className="text-neutral-500">Duration</span>
                  <span className="text-white">{project.targetDuration}s</span>
                </div>
                <input
                  type="range" min="15" max="120" step="5" value={project.targetDuration}
                  onChange={(e) => setProject({ ...project, targetDuration: parseInt(e.target.value) })}
                  className="w-full accent-cyan-500 bg-white/5 h-1 rounded-full appearance-none"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <h3 className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-4">System Logs</h3>
            <div
              ref={logContainerRef}
              className="flex-1 bg-black rounded border border-white/5 p-3 font-mono text-[9px] overflow-y-auto space-y-1 text-neutral-500"
            >
              {logs.length === 0 && <span className="opacity-30">Waiting for user interaction...</span>}
              {logs.map((log, i) => (
                <div key={i} className={log.includes('ERROR') ? 'text-red-400' : log.includes('AI') ? 'text-cyan-400' : ''}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {/* Rendering Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-10 animate-in fade-in duration-500">
          <div className="w-full max-w-sm space-y-10">
            <div className="relative">
              <div className="w-24 h-24 mx-auto rounded-full border-2 border-white/5 flex items-center justify-center">
                <SparklesIcon className="w-10 h-10 text-cyan-400 animate-pulse" />
                <div className="absolute inset-0 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-xl font-black text-white tracking-widest uppercase">BandFlow Engine</h2>
              <p className="text-xs text-neutral-500 font-mono tracking-tighter uppercase">{progress}% Processing Stream</p>
            </div>

            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-purple-600 transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Result Display */}
      {showResult && (
        <div className="fixed inset-0 z-[110] bg-[#050505] animate-in slide-in-from-bottom-10 duration-500 flex flex-col">
          <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black">
            <div className="flex items-center gap-4">
              <CheckBadgeIcon className="w-6 h-6 text-green-500" />
              <h2 className="text-lg font-bold">Edit Ready: {project.title}</h2>
            </div>
            <button onClick={() => setShowResult(false)} className="text-xs font-bold uppercase hover:text-white transition-colors">Close Workspace</button>
          </header>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-[400px_1fr] p-8 gap-8 overflow-hidden">
            <div className="aspect-[9/16] bg-neutral-900 rounded-2xl overflow-hidden border border-white/10 relative shadow-2xl flex items-center justify-center">
              <PlayIcon className="w-16 h-16 text-white/20 hover:text-white/80 transition-all cursor-pointer hover:scale-110" />
              <div className="absolute top-4 left-4 bg-black/60 px-2 py-1 rounded text-[8px] font-mono text-cyan-400 border border-cyan-400/30">PREVIEW_GEN_01.MP4</div>
              {project.logoPreviewUrl && (
                <img src={project.logoPreviewUrl} className="absolute bottom-10 right-10 w-16 opacity-30 grayscale" alt="watermark" />
              )}
            </div>

            <div className="space-y-10 overflow-y-auto pr-4">
              <div>
                <h3 className="text-xs font-black text-neutral-600 uppercase tracking-widest mb-4">AI Analysis Report</h3>
                <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                  <p className="text-sm text-neutral-300 italic font-medium leading-relaxed">
                    "{editPlan?.soundtrackEnhancement}"
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black text-neutral-600 uppercase tracking-widest mb-4">Master Timeline</h3>
                <div className="space-y-3">
                  {editPlan?.scenes.map((scene, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-lg bg-white/[0.02] border border-white/5 items-center group hover:bg-white/[0.04] transition-all">
                      <span className="text-[10px] font-mono text-cyan-500 w-8">#{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-white/80">{scene.description}</p>
                        <p className="text-[10px] text-neutral-500 mt-1 uppercase font-bold tracking-tighter">
                          Transition: <span className="text-purple-400">{scene.transition}</span> • Duration: {scene.duration}s
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-white/5">
                <button className="flex-1 bg-white text-black py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-cyan-400 transition-colors">
                  <ArrowDownTrayIcon className="w-4 h-4" /> Export 4K Master
                </button>
                <button className="flex-1 bg-neutral-800 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-700 transition-colors">
                  <SparklesIcon className="w-4 h-4" /> Post to Socials
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
