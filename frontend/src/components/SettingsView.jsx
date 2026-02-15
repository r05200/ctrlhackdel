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
            <div className="settings-item-title">Display Name (Optional)</div>
            <div className="settings-item-desc">
              Used in your greeting. Leave blank to use Explorer.
            </div>
          </div>
          <input
            className="settings-text-input"
            type="text"
            maxLength={25}
            value={settings?.userName || ''}
            onChange={(e) => onChange?.({ userName: e.target.value })}
            placeholder="Enter your name"
          />
        </label>

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
              Turn off animated star background and keep a plain black background.
            </div>
          </div>
          <input
            type="checkbox"
            checked={!!settings?.disableBackgroundElements}
            onChange={(e) => onChange?.({ disableBackgroundElements: e.target.checked })}
          />
        </label>

        <label className="settings-item">
          <div className="settings-copy">
            <div className="settings-item-title">Background Star Color</div>
            <div className="settings-item-desc">
              Choose the color used for stars in the animated background.
            </div>
          </div>
          <div className="settings-color-wrap">
            <input
              className="settings-color-input"
              type="color"
              value={settings?.starColor || '#ffffff'}
              onChange={(e) => onChange?.({ starColor: e.target.value })}
              disabled={!!settings?.disableBackgroundElements}
            />
            <span className="settings-color-code">{settings?.starColor || '#ffffff'}</span>
          </div>
        </label>

        <label className="settings-item">
          <div className="settings-copy">
            <div className="settings-item-title">Constellation Node Color</div>
            <div className="settings-item-desc">
              Sets the base color of constellation nodes.
            </div>
          </div>
          <div className="settings-color-wrap">
            <input
              className="settings-color-input"
              type="color"
              value={settings?.nodeColor || '#ffffff'}
              onChange={(e) => onChange?.({ nodeColor: e.target.value })}
            />
            <span className="settings-color-code">{settings?.nodeColor || '#ffffff'}</span>
          </div>
        </label>

        <label className="settings-item">
          <div className="settings-copy">
            <div className="settings-item-title">Stargaze Star Cap</div>
            <div className="settings-item-desc">
              Maximum stars generated for each new Stargaze constellation (1-12).
            </div>
          </div>
          <select
            className="settings-text-input"
            value={settings?.stargazeNodeCap ?? 12}
            onChange={(e) => onChange?.({ stargazeNodeCap: e.target.value })}
          >
            {Array.from({ length: 12 }, (_, idx) => idx + 1).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="settings-item">
          <div className="settings-copy">
            <div className="settings-item-title">DEBUG: Guarantee Star Trial Completion</div>
            <div className="settings-item-desc">
              Automatically passes Star Trials when submitting an attempt.
            </div>
          </div>
          <input
            type="checkbox"
            checked={!!settings?.debugGuaranteeStarTrialCompletion}
            onChange={(e) => onChange?.({ debugGuaranteeStarTrialCompletion: e.target.checked })}
          />
        </label>
      </div>
    </div>
  );
}
