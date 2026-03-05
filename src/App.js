import React, { useState, useEffect } from 'react';
import { Home, Trophy, Zap, BarChart3, ChevronLeft, Star, TrendingUp, Loader2 } from 'lucide-react';

export default function App() {
  // --- 1. ALL HOOKS ---
  const TOTAL_QUIZ_TIME = 120; // 2 minutes for the whole thing
const [timeLeft, setTimeLeft] = useState(TOTAL_QUIZ_TIME);
  const [view, setView] = useState('HOME'); 
  const [score, setScore] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [activeCategory, setActiveCategory] = useState('General');
  const [timeLeft, setTimeLeft] = useState(15);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]); // DYNAMIC LIST
  
  const [totalXP, setTotalXP] = useState(() => {
    const saved = localStorage.getItem('userXP');
    return saved ? parseInt(saved) : 0;
  });

  // --- 2. THE DYNAMIC FETCH LOGIC ---
  const startQuiz = async (catName) => {
    setLoading(true);
    setActiveCategory(catName);

    // Map names to API IDs
    const catIds = { "History": 23, "Sports": 21, "Movies": 11, "Tech": 18, "Science": 17 };
    const id = catIds[catName] || 9;

    try {
      // We fetch 10 questions at once!
      const res = await fetch(`https://opentdb.com/api.php?amount=10&category=${id}&type=multiple`);
      const data = await res.json();
      
      const formatted = data.results.map(q => {
        const choices = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);
        return {
          question: decodeHTMLEntities(q.question),
          options: choices.map(c => decodeHTMLEntities(c)),
          correct: choices.indexOf(q.correct_answer)
        };
      });

      setQuestions(formatted); // NOW WE HAVE 10 QUESTIONS
      setScore(0);
  setCurrentIdx(0);
  setTimeLeft(TOTAL_QUIZ_TIME); // Start the global clock
  setView('QUIZ');
    } catch (e) {
      alert("Check your internet connection!");
    } finally {
      setLoading(false);
    }
  };

  // Helper to fix weird text like &quot;
  const decodeHTMLEntities = (text) => {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
  };

  // --- 3. TIMER ENGINE ---
useEffect(() => {
  let timer;
  if (view === 'QUIZ' && timeLeft > 0) {
    timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
  } else if (view === 'QUIZ' && timeLeft === 0) {
    // TIME IS UP: Force the user to the results screen immediately
    handleFinish(score); 
  }
  return () => clearTimeout(timer);
}, [timeLeft, view]);

  const handleNext = (currentScore) => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      
    } else {
      const earned = currentScore * 100;
      const newTotal = totalXP + earned;
      setTotalXP(newTotal);
      localStorage.setItem('userXP', newTotal);
      setView('RESULTS');
    }
  };

  // --- 4. VIEWS ---
  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
      <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
      <h2 className="text-xl font-bold animate-pulse">Loading 10 Fresh Questions...</h2>
    </div>
  );

  const HomeView = () => (
    <div className="pt-8 pb-32 px-6 max-w-5xl mx-auto text-white font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black text-indigo-400 tracking-tighter italic">QUIZ.COM</h1>
        <div className="bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700 flex items-center gap-2">
          <Star size={16} className="text-yellow-400" fill="currentColor"/>
          <span className="font-bold">{totalXP} XP</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-10 bg-slate-800 rounded-2xl p-4 border border-slate-700">
        <div className="flex justify-between text-[10px] font-black uppercase mb-2 text-slate-500">
          <span>Level {Math.floor(totalXP/500)+1}</span>
          <span>{500 - (totalXP % 500)} XP to Next Level</span>
        </div>
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
          <div className="bg-indigo-500 h-full transition-all duration-1000" style={{width: `${(totalXP % 500) / 5}%`}} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {["History", "Sports", "Movies", "Tech", "Science"].map(cat => (
          <button key={cat} onClick={() => startQuiz(cat)} className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 hover:border-indigo-500 transition-all font-black text-lg active:scale-95">
            {cat}
          </button>
        ))}
      </div>
    </div>
  );

  const QuizView = () => {
  const q = questions[currentIdx];
  if (!q) return null;

  // 1. Calculate Minutes and Seconds for the Global Clock
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const TOTAL_TIME = 120; // Ensure this matches your TOTAL_QUIZ_TIME variable

  return (
    <div className="min-h-screen bg-indigo-950 flex flex-col items-center justify-center p-6 font-sans">
      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl">
        
        {/* Header: Global Timer Display */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <span className={`text-2xl font-black leading-none ${timeLeft < 20 ? 'text-red-500 animate-pulse' : 'text-indigo-600'}`}>
              {mins}:{secs < 10 ? `0${secs}` : secs}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remaining</span>
          </div>
          <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
            Q {currentIdx + 1}/10
          </span>
        </div>

        {/* 2. Progress Bar: Updated math for TOTAL_TIME */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full mb-8 overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${timeLeft < 20 ? 'bg-red-500' : 'bg-indigo-500'}`} 
            style={{ width: `${(timeLeft / TOTAL_TIME) * 100}%` }} 
          />
        </div>

        <h2 className="text-xl font-bold mb-8 text-slate-800 leading-snug">{q.question}</h2>
        
        <div className="grid gap-3">
          {q.options.map((opt, i) => (
            <button 
              key={i} 
              onClick={() => {
                const isCorrect = i === q.correct;
                const nextScore = isCorrect ? score + 1 : score;
                if (isCorrect) setScore(nextScore);
                // Note: handleNext should no longer call setTimeLeft(15)
                handleNext(nextScore);
              }} 
              className="p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 text-left font-bold text-slate-600 transition-all active:bg-indigo-50"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

  const ResultsView = () => (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center font-sans">
      <Trophy size={64} className="text-yellow-500 mb-4" />
      <h2 className="text-4xl font-black mb-2">Quiz Over!</h2>
      <p className="text-slate-400 text-xl mb-8">Score: {score} / 10</p>
      <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-2xl mb-8 w-full max-w-xs">
        <p className="text-indigo-400 font-black">+{score * 100} XP EARNED</p>
      </div>
      <button onClick={() => setView('HOME')} className="bg-indigo-500 px-12 py-4 rounded-2xl font-black shadow-[0_6px_0_0_#4338ca] active:translate-y-1 active:shadow-none transition-all">PLAY AGAIN</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900">
      {view === 'HOME' && <HomeView />}
      {view === 'QUIZ' && <QuizView />}
      {view === 'RESULTS' && <ResultsView />}
    </div>
  );
}