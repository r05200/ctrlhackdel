import React from 'react';
import './SettingsView.css';

export default function SettingsView({ settings, onChange }) {
  return (
    <div className="settings-view">
      <div className="settings-header">
        <h2 className="settings-title">Settings</h2>
        <p className="settings-subtitle">Control launch and background visuals.</p>
      </div>

      <div className="settings-list">
        <label className="settings-item">
          <div className="settings-copy">
            <div className="settings-item-title">Disable Starting Animation</div>
            <div className="settings-item-desc">
              Skip the splash/starting animation on app load.
            </div>
          </div>
          <input
            type="checkbox"
            checked={!!settings?.disableStartingAnimation}
            onChange={(e) => onChange?.({ disableStartingAnimation: e.target.checked })}
          />
        </label>

        <label className="settings-item">
          <div className="settings-copy">
            <div className="settings-item-title">Disable Background Elements</div>
            <div className="settings-item-desc">
              Turn off animated star/aurora background and keep a plain black background.
            </div>
          </div>
          <input
            type="checkbox"
            checked={!!settings?.disableBackgroundElements}
            onChange={(e) => onChange?.({ disableBackgroundElements: e.target.checked })}
          />
        </label>
      </div>
    </div>
  );
}
