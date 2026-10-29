import React from 'react'
import { Link } from 'react-router-dom'
import { Search, Fingerprint, Brain, Trophy, ChevronRight, Sparkles } from 'lucide-react'

const HOW_IT_WORKS = [
  { icon: <Search className="w-6 h-6" />, step: '01', title: 'Set the Scene', desc: 'Describe your mystery premise and pick your difficulty level.' },
  { icon: <Fingerprint className="w-6 h-6" />, step: '02', title: 'Investigate', desc: 'Discover clues, interrogate suspects, and use hints wisely.' },
  { icon: <Brain className="w-6 h-6" />, step: '03', title: 'Accuse & Reveal', desc: 'Name your culprit and see if your deductions were correct.' },
]

export const Home = () => (
  <div className="relative overflow-hidden">
    {/* Ambient glows */}
    <div className="ambient-glow w-[600px] h-[600px] -top-40 -left-20 bg-amber/8" aria-hidden />
    <div className="ambient-glow w-[400px] h-[400px] top-20 right-0 bg-purple-700/6" aria-hidden />

    {/* Hero */}
    <section className="min-h-[92vh] flex flex-col items-center justify-center text-center px-4 py-20 relative">
      {/* Eyebrow */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber/10 border border-amber/20 mb-8 animate-fade-in">
        <Sparkles className="w-3.5 h-3.5 text-amber" />
        <span className="section-label">AI-Generated Mysteries</span>
      </div>

      <h1 className="font-serif text-5xl sm:text-6xl lg:text-8xl font-black text-ghost leading-[1.05] tracking-tight mb-6 animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
        Solve the
        <br />
        <span className="text-amber-gradient">Perfect Crime.</span>
      </h1>

      <p className="text-lg sm:text-xl text-muted max-w-xl leading-relaxed mb-10 animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
        Enter a premise. Gemini builds a complete whodunit — suspects, clues, and a single solvable culprit. Can you crack the case?
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-up" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
        <Link to="/create" className="btn-primary flex items-center gap-2 text-base px-8 py-4 shadow-amber-glow animate-glow-pulse">
          <Search className="w-5 h-5" /> Start Investigation <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-5 h-8 border border-white/20 rounded-full flex items-start justify-center pt-1.5">
          <div className="w-1 h-2 bg-amber/60 rounded-full animate-bounce" />
        </div>
      </div>
    </section>

    {/* How it works */}
    <section className="max-w-5xl mx-auto px-4 py-20">
      <div className="text-center mb-14">
        <p className="section-label mb-3">The Process</p>
        <h2 className="font-serif text-4xl font-bold text-ghost">How It Works</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {HOW_IT_WORKS.map(({ icon, step, title, desc }, i) => (
          <div key={step} className="glass-card p-8 space-y-4 text-center hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="w-14 h-14 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center mx-auto text-amber">{icon}</div>
            <div className="font-mono text-xs text-amber/60 tracking-widest">{step}</div>
            <h3 className="font-serif text-xl font-semibold text-ghost">{title}</h3>
            <p className="text-sm text-muted leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Score section */}
    <section className="max-w-5xl mx-auto px-4 pb-24">
      <div className="glass-card p-10 text-center space-y-6 relative overflow-hidden">
        <div className="ambient-glow w-64 h-64 top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber/10" aria-hidden />
        <Trophy className="w-12 h-12 text-amber mx-auto" />
        <h2 className="font-serif text-3xl font-bold text-ghost">Earn Your Score</h2>
        <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
          {[
            { label: 'Correct Guess', val: '+100–200', color: 'text-emerald' },
            { label: 'Per Clue Found', val: '+5', color: 'text-amber' },
            { label: 'Per Hint Used', val: '−10', color: 'text-crimson' },
          ].map(({ label, val, color }) => (
            <div key={label}>
              <div className={`font-serif text-3xl font-bold ${color}`}>{val}</div>
              <div className="text-xs text-muted mt-1">{label}</div>
            </div>
          ))}
        </div>
        <Link to="/create" className="btn-primary inline-flex items-center gap-2 px-8 py-3">
          Begin Now <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  </div>
)
export default Home
