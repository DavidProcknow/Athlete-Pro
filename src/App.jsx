import React, { useState, useEffect } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { 
  Dumbbell, CheckCircle2, TrendingUp, Calendar, User, ChevronRight, 
  ArrowLeft, Activity, Zap, Moon, List, Sparkles, Trophy, 
  History as HistoryIcon, Scale, FileText, Brain, Edit2, X, 
  Save, Timer, FastForward, Info
} from 'lucide-react';

// --- Constants & Program ---
const WORKOUT_KEYS = ['Day 1', 'Day 2', 'Day 3', 'Day 4'];
const LOWER_BODY_EXERCISES = ['squat', 'rdl', 'split-squat', 'calf-raises', 'deadlift', 'leg-press', 'nordic-curls'];

const PROGRAM = {
  'Day 1': {
    name: "Lower Body A (Squat Focus)",
    exercises: [
      { id: 'squat', name: 'Squat', base: 'squat', sets: 3, minReps: 6, maxReps: 8, isPrimary: true },
      { id: 'rdl', name: 'Romanian Deadlift', defaultWeight: 155, sets: 3, minReps: 6, maxReps: 8 },
      { id: 'split-squat', name: 'Split Squats', defaultWeight: 0, sets: 3, minReps: 10, maxReps: 12 },
      { id: 'calf-raises', name: 'Calf Raises', defaultWeight: 100, sets: 3, minReps: 10, maxReps: 12 }
    ]
  },
  'Day 2': {
    name: "Upper Body A (Bench Focus)",
    exercises: [
      { id: 'bench', name: 'Bench Press', base: 'bench', sets: 3, minReps: 6, maxReps: 8, isPrimary: true },
      { id: 'tbar-row', name: 'T-Bar Row', defaultWeight: 135, sets: 3, minReps: 8, maxReps: 10 },
      { id: 'pull-ups', name: 'Pull Ups', defaultWeight: 0, sets: 4, isAMRAP: true },
      { id: 'face-pulls', name: 'Face Pulls', defaultWeight: 60, sets: 3, minReps: 10, maxReps: 12 },
      { id: 'cuban-press', name: 'Cuban Press', defaultWeight: 40, sets: 2, minReps: 15, maxReps: 15 }
    ]
  },
  'Day 3': {
    name: "Lower Body B (Deadlift Focus)",
    exercises: [
      { id: 'deadlift', name: 'Conventional Deadlift', base: 'deadlift', sets: 3, minReps: 6, maxReps: 8, isPrimary: true },
      { id: 'leg-press', name: 'Leg Press', defaultWeight: 360, sets: 3, minReps: 10, maxReps: 12 },
      { id: 'nordic-curls', name: 'Nordic Curls', defaultWeight: 0, sets: 3, isAMRAP: true },
      { id: 'core', name: 'Core Work', defaultWeight: 0, sets: 3, minReps: 12, maxReps: 15 }
    ]
  },
  'Day 4': {
    name: "Upper Body B (OHP Focus)",
    exercises: [
      { id: 'ohp', name: 'Standing Barbell OHP', base: 'ohp', sets: 3, minReps: 8, maxReps: 10, isPrimary: true },
      { id: 'bb-row', name: 'Bent Over Barbell Row', defaultWeight: 135, sets: 3, minReps: 6, maxReps: 8 },
      { id: 'close-grip-incline', name: 'Close Grip Incline Press', defaultWeight: 145, sets: 3, minReps: 8, maxReps: 10 },
      { id: 'rev-pec-deck', name: 'Reverse Pec Deck', defaultWeight: 60, sets: 3, minReps: 20, maxReps: 20 }
    ]
  }
};

// --- Logic Helpers ---

const calculateProgression = (exercise, sessionHistory, baselines) => {
  if (exercise.isAMRAP) return { weight: 0, reps: Array(exercise.sets).fill('AMRAP'), weekNum: '-' };
  const min = exercise.minReps;
  const flattened = [];
  sessionHistory.forEach(s => {
    const exData = s.exercises?.find(e => e.id === exercise.id);
    if (exData) flattened.push({ ...exData, date: s.date });
  });

  if (flattened.length === 0) {
    let weight = exercise.defaultWeight || 0;
    if (exercise.base && baselines[exercise.base]) {
      weight = Math.round((baselines[exercise.base] * 0.9) / 5) * 5;
    }
    return { weight, reps: Array(exercise.sets).fill(min), weekNum: 1 };
  }

  const last = flattened[0];
  const lastW = last.finalWeight;
  const lastRpe = last.rpe || 8;
  const count = new Set(flattened.filter(f => f.finalWeight === lastW).map(f => f.date)).size;

  if (lastRpe >= 10) return { weight: Math.max(0, lastW - 5), reps: Array(exercise.sets).fill(min), weekNum: 1 };
  if (count === 1) return { weight: lastW, reps: Array(exercise.sets).fill(0).map((_, i) => i === 0 ? min + 1 : min), weekNum: 2 };
  if (count === 2) return { weight: lastW, reps: Array(exercise.sets).fill(0).map((_, i) => i === 0 ? min + 2 : i === 1 ? min + 1 : min), weekNum: 3 };
  
  const inc = LOWER_BODY_EXERCISES.includes(exercise.id) ? 10 : 5;
  if (lastRpe < 9) return { weight: lastW + inc, reps: Array(exercise.sets).fill(min), weekNum: 1 };
  return { weight: lastW, reps: Array(exercise.sets).fill(min), weekNum: 1 };
};

const RestTimer = ({ seconds, onFinish }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  useEffect(() => {
    if (timeLeft <= 0) { onFinish(); return; }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  return (
    <div className="fixed inset-0 bg-indigo-600 z-[200] flex items-center justify-center p-8">
      <div className="text-center space-y-12">
        <Timer className="w-20 h-20 text-white animate-pulse mx-auto" />
        <div className="text-9xl font-black text-white tabular-nums tracking-tighter">
          {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2, '0')}
        </div>
        <button onClick={onFinish} className="bg-white text-indigo-600 px-12 py-6 rounded-full font-black text-xl flex items-center gap-2 active:scale-95 transition-all">
          <FastForward /> SKIP REST
        </button>
      </div>
    </div>
  );
};

const BaselineModal = ({ editingKey, currentVal, onClose, onSave }) => {
  const [val, setVal] = useState(currentVal || '');
  if (!editingKey) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-[40px] w-full max-w-sm shadow-2xl p-8 space-y-6">
        <div className="flex justify-between items-center font-black">
          <span>SET {editingKey.toUpperCase()}</span>
          <button onClick={onClose}><X className="text-slate-400" /></button>
        </div>
        <div className="relative">
          <input 
            type="number" 
            autoFocus 
            className="w-full bg-slate-50 p-6 rounded-3xl outline-none font-black text-4xl text-indigo-600 shadow-inner" 
            value={val} 
            onChange={e => setVal(e.target.value)}
          />
          <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300">LBS</span>
        </div>
        <button 
          onClick={() => { onSave(parseFloat(val)); onClose(); }} 
          className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black shadow-xl"
        >
          UPDATE BASELINE
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState('dashboard');
  const [baselines, setBaselines] = useState({ squat: 225, bench: 185, deadlift: 315, ohp: 95, weight: 180, lastWeighIn: null });
  const [history, setHistory] = useState([]);
  const [selectedDay, setSelectedDay] = useState('Day 1');
  const [activeW, setActiveW] = useState(null);
  const [editKey, setEditKey] = useState(null);
  const [timer, setTimer] = useState(null);
  const [warmIdx, setWarmIdx] = useState(0);
  const [readiness, setReadiness] = useState({ sleep: 'OK', stress: 'Medium', energy: 7 });
  const [amrapInput, setAmrapInput] = useState('');

  useEffect(() => {
    const b = localStorage.getItem('atpro_react_v3_b');
    const h = localStorage.getItem('atpro_react_v3_h');
    if (b) setBaselines(JSON.parse(b));
    if (h) {
      const pH = JSON.parse(h);
      setHistory(pH);
      const lastSession = pH.find(s => s.dayKey);
      if (lastSession) {
        const nextIdx = (WORKOUT_KEYS.indexOf(lastSession.dayKey) + 1) % WORKOUT_KEYS.length;
        setSelectedDay(WORKOUT_KEYS[nextIdx]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('atpro_react_v3_b', JSON.stringify(baselines));
    localStorage.setItem('atpro_react_v3_h', JSON.stringify(history));
  }, [baselines, history]);

  const getBestLift = (id, baseVal) => {
    let max = baseVal;
    history.forEach(s => {
      const ex = s.exercises?.find(e => e.id === id);
      if (ex && ex.finalWeight > max) max = ex.finalWeight;
    });
    return max;
  };

  const handleStartWorkout = (sessionType) => {
    const config = PROGRAM[selectedDay];
    setActiveW({
      dayKey: selectedDay,
      type: sessionType,
      readinessData: readiness,
      exercises: config.exercises.map(ex => {
        const tg = calculateProgression(ex, history, baselines);
        let fw = tg.weight;
        let fr = tg.reps;
        if (sessionType === 'Micro Deload') {
          fw = Math.round((fw * 0.8) / 5) * 5;
          fr = fr.slice(0, 1);
        } else if (sessionType === 'Lower Volume') {
          fr = fr.slice(0, Math.max(1, fr.length - 1));
        }
        const w = ex.isPrimary ? [
          { weight: Math.round((fw * 0.5) / 5) * 5, reps: 5 },
          { weight: Math.round((fw * 0.7) / 5) * 5, reps: 3 },
          { weight: Math.round((fw * 0.85) / 5) * 5, reps: 1 }
        ] : [];
        return { ...ex, targetWeight: fw, targetReps: fr, warmups: w, weekNum: tg.weekNum, completed: false, logs: [] };
      })
    });
    setView('workout');
  };

  // --- Views ---

  if (view === 'readiness') return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-[40px] shadow-2xl mt-12 space-y-8 animate-in zoom-in border border-slate-100">
      <div className="text-center space-y-2"><Activity className="w-12 h-12 text-indigo-600 mx-auto" /><h2 className="text-2xl font-black italic uppercase">Readiness</h2></div>
      <div className="space-y-6">
        {['sleep', 'stress'].map(k => (
          <div key={k}>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">{k}</label>
            <div className="grid grid-cols-3 gap-2">
              {(k === 'sleep' ? ['Poor', 'OK', 'Good'] : ['High', 'Medium', 'Low']).map(opt => (
                <button key={opt} onClick={() => setReadiness({...readiness, [k]: opt})} className={`py-3 rounded-2xl font-bold border-2 transition-all ${readiness[k] === opt ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400'}`}>{opt}</button>
              ))}
            </div>
          </div>
        ))}
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Energy (1-10): {readiness.energy}</label>
          <input type="range" min="1" max="10" value={readiness.energy} onChange={e => setReadiness({...readiness, energy: e.target.value})} className="w-full accent-indigo-600" />
        </div>
        <button onClick={() => {
           let score = 0;
           if (readiness.sleep === 'Good') score += 3; else if (readiness.sleep === 'OK') score += 2; else score += 1;
           if (readiness.stress === 'Low') score += 3; else if (readiness.stress === 'Medium') score += 2; else score += 1;
           const total = score + (parseInt(readiness.energy) >= 7 ? 3 : 1);
           let type = 'Full Programming';
           if (total <= 4) type = 'Micro Deload'; else if (total <= 6) type = 'Lower Volume';
           handleStartWorkout(type);
        }} className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black shadow-xl active:scale-95 uppercase italic">Initialize session</button>
        <button onClick={() => setView('dashboard')} className="w-full text-slate-400 font-bold uppercase text-xs">Back</button>
      </div>
    </div>
  );

  if (view === 'workout' && activeW) {
    const step = activeW.exercises.findIndex(ex => !ex.completed);
    if (step === -1) return (
      <div className="max-w-2xl mx-auto p-12 text-center space-y-8 mt-12 bg-white rounded-[56px] shadow-2xl animate-in fade-in">
        <Trophy className="w-24 h-24 text-amber-400 mx-auto" />
        <h2 className="text-4xl font-black italic uppercase tracking-tighter">Session Complete!</h2>
        <div className="text-left space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Training Notes</label>
          <textarea id="fNotes" placeholder="Personal observations..." className="w-full p-6 bg-slate-50 border rounded-[32px] outline-none min-h-[120px]" />
        </div>
        <button onClick={() => {
          const s = { id: Date.now(), date: new Date().toISOString(), dayKey: activeW.dayKey, workoutName: PROGRAM[activeW.dayKey].name, readiness: activeW.readinessData, notes: document.getElementById('fNotes').value, exercises: activeW.exercises.map(ex => ({ id: ex.id, name: ex.name, finalWeight: ex.logs[ex.logs.length-1]?.weight || 0, finalReps: ex.logs[ex.logs.length-1]?.reps || 0, rpe: ex.finalRpe })) };
          setHistory([s, ...history]); setView('dashboard'); setActiveW(null); setWarmIdx(0); setTimer(null);
          setSelectedDay(WORKOUT_KEYS[(WORKOUT_KEYS.indexOf(activeW.dayKey) + 1) % WORKOUT_KEYS.length]);
        }} className="w-full bg-green-600 text-white py-6 rounded-[32px] font-black uppercase italic shadow-xl">Complete Session</button>
      </div>
    );

    const ex = activeW.exercises[step];
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6 relative pb-32">
        {timer && <RestTimer seconds={timer} onFinish={() => setTimer(null)} />}
        <div className="flex justify-between items-center"><button onClick={() => setView('dashboard')} className="p-3 bg-white rounded-2xl shadow-sm"><ArrowLeft/></button><div className="text-right leading-none font-black text-indigo-600 text-xs uppercase">{activeW.dayKey} Protocol</div></div>
        <div className="bg-white rounded-[48px] p-10 shadow-sm border border-slate-100 space-y-8 animate-in slide-in-from-bottom-4">
          <h2 className="text-4xl font-black italic tracking-tighter">{ex.name}</h2>
          {ex.warmups?.length > warmIdx && (
            <div className="bg-amber-50 rounded-[32px] p-7 border border-amber-100 flex justify-between items-center">
              <div><div className="text-3xl font-black text-amber-900 leading-none">{ex.warmups[warmIdx].reps} Reps @ {ex.warmups[warmIdx].weight} lbs</div><div className="text-amber-700 font-bold uppercase text-[10px] mt-1">Ramp set {warmIdx+1}</div></div>
              <button onClick={() => { setWarmIdx(warmIdx + 1); setTimer(60); }} className="bg-amber-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg uppercase text-xs italic">Done</button>
            </div>
          )}
          <div className="space-y-4">
            {ex.logs.map((l, i) => (<div key={i} className="flex justify-between items-center p-6 bg-slate-50 rounded-[32px] border border-slate-100 font-black text-xl shadow-sm"><span className="text-slate-400 text-xs uppercase font-bold">SET {i+1}</span><span>{ex.isAMRAP && l.weight === 0 ? '' : `${l.weight} lbs x `}{l.reps} reps</span><CheckCircle2 className="text-green-500" /></div>))}
            {ex.logs.length < ex.targetReps.length ? (
              <div className={`p-8 rounded-[40px] border-2 border-dashed ${ex.warmups?.length > warmIdx ? 'opacity-20 pointer-events-none' : 'border-indigo-200 bg-indigo-50/20'}`}>
                <div className="text-center mb-6">
                   <div className="text-4xl font-black text-indigo-600 italic leading-none">{ex.isAMRAP ? 'AMRAP Effort' : `${ex.targetWeight} lbs x ${ex.targetReps[ex.logs.length]} reps`}</div>
                   <div className="text-[10px] font-black uppercase text-slate-400 mt-2">Target for Set {ex.logs.length + 1}</div>
                </div>
                {ex.isAMRAP ? (
                   <div className="space-y-4">
                      <input type="number" placeholder="Actual Reps?" className="w-full p-6 rounded-3xl bg-white border-2 border-indigo-100 text-center font-black text-3xl shadow-inner outline-none" value={amrapInput} onChange={e => setAmrapInput(e.target.value)} />
                      <button onClick={() => { if(!amrapInput) return; const nW = {...activeW}; nW.exercises[step].logs.push({ weight: 0, reps: parseInt(amrapInput) }); setAmrapInput(''); if(nW.exercises[step].logs.length < ex.targetReps.length) setTimer(120); setActiveW(nW); }} className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black uppercase shadow-xl italic active:scale-95 transition-all">Log Reps</button>
                   </div>
                ) : (
                  <button onClick={() => { const nW = {...activeW}; nW.exercises[step].logs.push({ weight: ex.targetWeight, reps: ex.targetReps[ex.logs.length] }); if(nW.exercises[step].logs.length < ex.targetReps.length) setTimer(120); setActiveW(nW); }} className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black uppercase shadow-xl italic active:scale-95 transition-all">Log Working Set</button>
                )}
              </div>
            ) : (
              <div className="p-10 bg-slate-900 rounded-[48px] text-white text-center space-y-8 animate-in zoom-in border border-slate-800 shadow-2xl">
                <div className="space-y-2"><Activity className="w-10 h-10 text-indigo-400 mx-auto" /><h3 className="text-xl font-black uppercase tracking-tight italic">Movement Complete</h3><p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-none mt-2">Rate relative effort (RPE)</p></div>
                <div className="flex gap-2 justify-center">
                  {[7, 8, 9, 10].map(v => (<button key={v} onClick={() => { const nW = {...activeW}; nW.exercises[step].finalRpe = v; nW.exercises[step].completed = true; setWarmIdx(0); setActiveW(nW); }} className="w-14 h-14 rounded-2xl bg-slate-800 font-black hover:bg-indigo-500 transition-all border border-slate-700 text-2xl font-bold">{v}</button>))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Default Logic Helpers ---
  const bw = baselines.weight || 180;
  const goals = [
    { key: 'deadlift', name: 'Deadlift', m: 2.0 }, { key: 'squat', name: 'Squat', m: 1.5 },
    { key: 'bench', name: 'Bench', m: 1.0 }, { key: 'ohp', name: 'OHP', m: 0.75 }
  ].map(g => ({ ...g, cur: getBestLift(g.key, baselines[g.key]), tar: Math.round((bw * g.m) / 5) * 5 }));

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-900">
      {editKey && <BaselineModal editingKey={editKey} currentVal={baselines[editKey]} onClose={() => setEditKey(null)} onSave={(v) => { if(editKey === 'weight') setBaselines(p => ({...p, weight: v, lastWeighIn: new Date().toISOString().split('T')[0]})); else setBaselines(p => ({...p, [editKey]: v})); }} />}
      
      {view === 'history' && (
        <div className="max-w-4xl mx-auto p-8 space-y-8 pb-32 animate-in fade-in">
           <button onClick={() => setView('dashboard')} className="p-3 bg-white rounded-2xl shadow-sm border"><ArrowLeft/></button>
           <h2 className="text-3xl font-black italic uppercase tracking-tighter">History</h2>
           {history.map(s => (
             <div key={s.id} className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div><span className="text-indigo-600 font-black text-xs uppercase bg-indigo-50 px-3 py-1 rounded-full">{s.dayKey}</span><h3 className="text-2xl font-black leading-none mt-2">{s.workoutName}</h3><p className="text-slate-400 text-xs font-bold uppercase mt-2">{new Date(s.date).toLocaleDateString()}</p></div>
                  <div className="flex gap-3">
                    <div className="text-center px-4 py-2 bg-slate-50 rounded-2xl border min-w-[60px]"><Moon className="w-4 h-4 mx-auto mb-1 text-slate-400"/><div className="text-[8px] font-black uppercase text-slate-400">Sleep</div><div className="text-xs font-black">{s.readiness?.sleep || 'OK'}</div></div>
                    <div className="text-center px-4 py-2 bg-slate-50 rounded-2xl border min-w-[60px]"><Brain className="w-4 h-4 mx-auto mb-1 text-slate-400"/><div className="text-[8px] font-black uppercase text-slate-400">Stress</div><div className="text-xs font-black">{s.readiness?.stress || 'Med'}</div></div>
                    <div className="text-center px-4 py-2 bg-indigo-50 rounded-2xl border border-indigo-100 min-w-[60px]"><TrendingUp className="w-4 h-4 mx-auto mb-1 text-indigo-400"/><div className="text-[8px] font-black uppercase text-indigo-400">Ready</div><div className="text-xs font-black text-indigo-600">{s.readiness?.energy || '7'}/10</div></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {s.exercises?.map((e, i) => (<div key={i} className="p-5 bg-slate-50 rounded-[32px] flex justify-between items-center border border-slate-100 shadow-sm"><span className="font-bold text-slate-700">{e.name}</span><span className="font-black text-slate-900">{e.finalWeight > 0 ? `${e.finalWeight} lbs x ` : ''}{e.finalReps} <span className="text-indigo-400 text-xs ml-1 font-bold">RPE {e.rpe}</span></span></div>))}
                </div>
                {s.notes && <div className="p-5 bg-indigo-50/30 rounded-3xl text-sm italic font-medium text-slate-600 border border-indigo-100">Notes: {s.notes}</div>}
             </div>
           ))}
        </div>
      )}

      {view === 'program' && (
        <div className="max-w-4xl mx-auto p-8 space-y-8 pb-32 animate-in fade-in">
          <button onClick={() => setView('dashboard')} className="p-3 bg-white rounded-2xl shadow-sm border"><ArrowLeft/></button>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Training Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(PROGRAM).map(([k,v]) => (
              <div key={k} className="bg-white p-12 rounded-[56px] border border-slate-100 space-y-6 shadow-sm">
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full uppercase tracking-widest">{k}</span>
                <h3 className="text-2xl font-black leading-tight italic">{v.name}</h3>
                <div className="space-y-4">
                  {v.exercises.map(e => <div key={e.id} className="flex justify-between text-sm border-b border-slate-50 pb-3 last:border-0"><span className="text-slate-700 font-bold">{e.name}</span><span className="text-slate-400 font-black uppercase tracking-tighter">{e.sets} SETS • {e.isAMRAP ? 'AMRAP' : `${e.minReps}-${e.maxReps} Reps`}</span></div>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'dashboard' && (
        <div className="max-w-4xl mx-auto p-8 space-y-10 animate-in fade-in">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none italic">Athlete<span className="text-indigo-600">Pro</span></h1>
            <div className="flex gap-2">
              <button onClick={() => setView('program')} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm active:bg-slate-50 transition-colors"><List/></button>
              <button onClick={() => setView('history')} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm active:bg-slate-50 transition-colors"><HistoryIcon/></button>
              <button onClick={() => setEditKey('weight')} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm active:bg-slate-50 transition-colors"><Scale/></button>
            </div>
          </div>

          <div className="flex bg-slate-200/50 p-1.5 rounded-[28px] gap-1 shadow-inner">
            {WORKOUT_KEYS.map(d => (
              <button key={d} onClick={() => setSelectedDay(d)} className={`flex-1 py-4 rounded-[22px] font-black text-[10px] uppercase tracking-widest transition-all ${selectedDay === d ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>{d}</button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {goals.map(g => (
              <button key={g.key} onClick={() => setEditKey(g.key)} className="bg-white p-7 rounded-[40px] border border-slate-100 text-left hover:border-indigo-300 group relative active:scale-95 transition-all shadow-sm">
                <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{g.name}</span><Edit2 className="w-3 h-3 text-indigo-100 opacity-0 group-hover:opacity-100 transition-all" /></div>
                <div className="text-2xl font-black leading-none italic">{g.cur}<span className="text-xs text-slate-400 ml-1 font-bold not-italic">/{g.tar}</span></div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden"><div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${Math.max(2, Math.min(100, (g.cur / g.tar) * 100))}%` }} /></div>
              </button>
            ))}
          </div>

          <div className="bg-slate-900 rounded-[64px] p-16 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 space-y-10">
              <span className="inline-flex gap-2 px-5 py-2 bg-indigo-500/20 rounded-full border border-indigo-400/30 text-[10px] font-black uppercase tracking-widest text-indigo-100 italic font-bold leading-none"><Zap className="w-4 h-4" />{selectedDay} Protocol</span>
              <h2 className="text-7xl font-black italic leading-none tracking-tighter uppercase leading-none italic">{PROGRAM[selectedDay].name}</h2>
              <button onClick={() => setView('readiness')} className="flex items-center gap-5 bg-white text-slate-900 px-14 py-7 rounded-[32px] font-black hover:bg-indigo-50 active:scale-95 uppercase tracking-widest transition-all text-xl italic shadow-2xl">Initialize Session <ChevronRight/></button>
            </div>
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px]" />
          </div>

          <div className="bg-white p-12 rounded-[64px] border border-slate-100 shadow-sm space-y-10">
            <h3 className="text-3xl font-black flex items-center gap-5 italic tracking-tighter italic font-bold uppercase tracking-tight uppercase"><Sparkles className="text-indigo-500" /> Forecast</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['squat', 'bench', 'deadlift', 'ohp'].map(k => {
                const dayKeyFound = Object.keys(PROGRAM).find(d => PROGRAM[d]?.exercises.some(e => e.base === k));
                if (!dayKeyFound) return null;
                const targets = calculateProgression(PROGRAM[dayKeyFound].exercises.find(e => e.base === k), history, baselines);
                return (
                  <div key={k} className="flex items-center justify-between p-8 bg-slate-50 rounded-[48px] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-6"><div className="p-6 bg-white rounded-[32px] shadow-sm"><Dumbbell className="w-8 h-8 text-slate-800" /></div><div><div className="font-black text-slate-900 capitalize text-2xl leading-none italic">{k}</div><div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">W{targets.weekNum} • {targets.reps.join(',')} reps</div></div></div>
                    <div className="text-right font-black text-4xl text-indigo-600 italic leading-none">{targets.weight}<span className="text-sm ml-1 uppercase font-bold not-italic">lbs</span></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-slate-100 p-8 flex justify-around items-center z-[100] shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
        <button onClick={() => setView('dashboard')} className={`p-3 transition-all ${view === 'dashboard' || view === 'workout' || view === 'readiness' ? 'text-indigo-600 scale-150' : 'text-slate-400'}`}><Activity/></button>
        <button onClick={() => setView('program')} className={`p-3 transition-all ${view === 'program' ? 'text-indigo-600 scale-150' : 'text-slate-400'}`}><List/></button>
        <button onClick={() => setView('history')} className={`p-3 transition-all ${view === 'history' ? 'text-indigo-600 scale-150' : 'text-slate-400'}`}><HistoryIcon/></button>
      </nav>
    </div>
  );
}