import React, { useState } from 'react';
import { Calendar, User, Clock, Heart, ShieldCheck, Moon, Coffee, Dumbbell, Sparkles, Loader } from 'lucide-react';

const LifestyleConsole = () => {
  const [step, setStep] = useState(1);
  const [sleepingHours, setSleepingHours] = useState(6);
  const [sleepTime, setSleepTime] = useState('11:30 PM');
  const [dinnerTime, setDinnerTime] = useState('10:30 PM');
  const [breakfastTime, setBreakfastTime] = useState('09:00 AM');
  const [activityLevel, setActivityLevel] = useState('sedentary');
  const [location, setLocation] = useState('Koramangala, Bengaluru');

  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  const handleWizardSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      sleepingHours: parseInt(sleepingHours),
      sleepTime,
      dinnerTime,
      breakfastTime,
      activityLevel,
      location,
    };

    try {
      // POST request to backend Express lifestyle personalization engine
      const response = await fetch('/api/ai/lifestyle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        setRecommendations(data);
      } else {
        alert(data.message || 'Error generating lifestyle recommendations.');
      }
    } catch (err) {
      console.error(err);
      alert('Internal Server Error connecting to AI lifestyle engine.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Page Header */}
      <section style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 style={{ fontSize: '2rem', color: '#fff', fontWeight: 800 }}>
          AI Personalized Lifestyle & Diet Console
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Input your sleeping hours, meal timings, and activity levels. Gemini will analyze your routine and map out a custom 24-hour healthy schedule.
        </p>
      </section>

      {/* 🧙‍♂️ Multi-Step Glassmorphic Wizard Form */}
      {!recommendations && !isLoading && (
        <form onSubmit={handleWizardSubmit} className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Step 1: Sleeping Schedule */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 600, borderBottom: '1px solid var(--card-border)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Moon size={18} style={{ color: 'var(--primary-neon)' }} />
                Step 1: Sleep Schedule
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Average Sleeping Hours</label>
                  <input 
                    type="number" 
                    value={sleepingHours}
                    onChange={(e) => setSleepingHours(e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Bedtime Schedule</label>
                  <input 
                    type="text" 
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                    placeholder="e.g. 11:30 PM"
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => setStep(2)}
                style={{ alignSelf: 'flex-end', background: 'var(--primary-neon)', border: 'none', borderRadius: '8px', padding: '10px 20px', color: '#000', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Next Step
              </button>
            </div>
          )}

          {/* Step 2: Meal Timings */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 600, borderBottom: '1px solid var(--card-border)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coffee size={18} style={{ color: 'var(--primary-neon)' }} />
                Step 2: Nutrition Timings
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Breakfast Time</label>
                  <input 
                    type="text" 
                    value={breakfastTime}
                    onChange={(e) => setBreakfastTime(e.target.value)}
                    placeholder="e.g. 08:30 AM"
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Dinner Time</label>
                  <input 
                    type="text" 
                    value={dinnerTime}
                    onChange={(e) => setDinnerTime(e.target.value)}
                    placeholder="e.g. 10:30 PM"
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  style={{ background: 'none', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px 20px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Back
                </button>
                <button 
                  type="button" 
                  onClick={() => setStep(3)}
                  style={{ background: 'var(--primary-neon)', border: 'none', borderRadius: '8px', padding: '10px 20px', color: '#000', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Habits & Location */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 600, borderBottom: '1px solid var(--card-border)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Dumbbell size={18} style={{ color: 'var(--primary-neon)' }} />
                Step 3: Habits & City Context
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Daily Activity Level</label>
                  <select 
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                  >
                    <option value="sedentary">Sedentary (Office job, minimal walk)</option>
                    <option value="moderate">Moderate (Normal walk, light tasks)</option>
                    <option value="active">Active (Frequent exercise/cardio)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>General Location (City/Area)</label>
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Indiranagar, Bengaluru"
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button 
                  type="button" 
                  onClick={() => setStep(2)}
                  style={{ background: 'none', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px 20px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Back
                </button>
                
                <button 
                  type="submit"
                  style={{ background: 'var(--secondary-neon)', border: 'none', borderRadius: '8px', padding: '10px 20px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
                >
                  Compile AI Lifestyle Plan
                </button>
              </div>
            </div>
          )}

        </form>
      )}

      {/* Loading HUD spinner */}
      {isLoading && (
        <div className="glass-panel" style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <Loader size={36} className="glow-indicator" style={{ color: 'var(--primary-neon)', animation: 'spin 2s linear infinite' }} />
          <span style={{ fontSize: '0.9rem', color: 'var(--primary-neon)' }}>Gemini compiling personalized health adjustments...</span>
        </div>
      )}

      {/* 🚀 Dynamic Lifestyle Routine Timeline Renders */}
      {recommendations && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main Summary Header */}
          <div className="glass-panel" style={{ padding: '30px', position: 'relative' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} style={{ color: 'var(--primary-neon)' }} />
                Your Customized Lifestyle Rx Profile
              </h3>
              <button 
                onClick={() => setRecommendations(null)}
                style={{ background: 'none', border: '1px solid var(--card-border)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '0.72rem', padding: '6px 12px', cursor: 'pointer' }}
              >
                Reset survey
              </button>
            </div>

            {/* Hydration Goal Alert banner */}
            <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--primary-neon)', fontWeight: 600, display: 'block' }}>DAILY HYDRATION TARGET</span>
              <strong style={{ fontSize: '1.1rem', color: '#fff' }}>{recommendations.hydrationGoal}</strong>
            </div>

            {/* Step-by-Step Chronological Timeline */}
            <h4 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600, marginBottom: '16px' }}>Optimal Daily Healthy Timeline</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '20px', borderLeft: '2px stroke rgba(255,255,255,0.05)' }}>
              
              {/* Plot chronological sequence */}
              {recommendations.dailySchedule.map((slot, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  {/* Neon timeline dot node */}
                  <span style={{ position: 'absolute', left: '-25px', top: '5px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-neon)', border: '2px solid #070913' }} />
                  
                  <div style={{ fontSize: '0.72rem', color: 'var(--primary-neon)', fontWeight: 'bold' }}>{slot.time}</div>
                  <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600, marginTop: '2px' }}>{slot.activity}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{slot.rationale}</div>
                </div>
              ))}

            </div>

          </div>

          {/* Side-by-Side Habital tips grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            
            {/* Dietary */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--secondary-neon)', fontWeight: 600, marginBottom: '10px' }}>Dietary Adjustments</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {recommendations.dietaryAdjustments.map((tip, i) => (
                  <span key={i}>• {tip}</span>
                ))}
              </div>
            </div>

            {/* Sleep hygiene */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--primary-neon)', fontWeight: 600, marginBottom: '10px' }}>Sleep Hygiene Tips</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {recommendations.sleepHygieneTips.map((tip, i) => (
                  <span key={i}>• {tip}</span>
                ))}
              </div>
            </div>

            {/* Activity tips */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-alert)', fontWeight: 600, marginBottom: '10px' }}>Activity Guidelines</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {recommendations.activityTips.map((tip, i) => (
                  <span key={i}>• {tip}</span>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
};

export default LifestyleConsole;
