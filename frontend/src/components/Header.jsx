import React, { useState } from 'react';
import { toggleDemo, setScenario, resetDemo, manualTick } from '../services/api';

export default function Header({ data, refresh }) {
  const [toggling, setToggling] = useState(false);

  const handleToggleDemo = async () => {
    setToggling(true);
    try {
      await toggleDemo(!data.demo_mode);
      await refresh();
    } finally {
      setToggling(false);
    }
  };

  const handleScenario = async (s) => {
    await setScenario(s);
    await refresh();
  };

  const handleReset = async () => {
    await resetDemo();
    await refresh();
  };

  const handleTick = async () => {
    await manualTick();
    await refresh();
  };

  return (
    <header className="app-header">
      <h1>
        Sangati
        <span>by Intuiserve</span>
      </h1>
      <div className="header-controls">
        {data?.demo_mode && data?.current_scenario && (
          <div className="scenario-selector">
            {['quiet', 'steady', 'rush', 'wind_down'].map(s => (
              <button
                key={s}
                className={`scenario-btn ${data.current_scenario.name === s ? 'active' : ''}`}
                onClick={() => handleScenario(s)}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
        {data?.demo_mode && (
          <>
            <button className="btn btn-sm" onClick={handleTick} title="Manual pipeline tick">
              Tick
            </button>
            <button className="btn btn-sm btn-danger" onClick={handleReset} title="Reset simulation">
              Reset
            </button>
          </>
        )}
        <div className="toggle-container">
          <span className="toggle-label">Demo</span>
          <button
            className={`toggle ${data?.demo_mode ? 'active' : ''}`}
            onClick={handleToggleDemo}
            disabled={toggling}
          >
            <div className="toggle-knob" />
          </button>
        </div>
      </div>
    </header>
  );
}
