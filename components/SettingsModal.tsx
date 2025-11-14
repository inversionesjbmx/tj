import React, { useState, useEffect } from 'react';
import { Settings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newSettings: Settings) => void;
  currentSettings: Settings;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentSettings }) => {
  const [settings, setSettings] = useState<Settings>(currentSettings);

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings, isOpen]);

  const handleSave = () => {
    onSave(settings);
  };

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setSettings(prev => ({
      ...prev,
      auditMilestoneFrequency: isNaN(value) || value < 1 ? 1 : value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-surface rounded-xl border border-border shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-text_primary">Settings</h2>
          <p className="text-sm text-text_secondary mt-1">Customize your journal experience.</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-text_primary mb-3">AI Audit Reminders</h3>
            <div className="flex items-center justify-between bg-secondary p-4 rounded-lg">
              <div>
                <label htmlFor="auditRemindersEnabled" className="font-medium text-text_primary">Enable Reminders</label>
                <p className="text-xs text-text_secondary">Get suggestions to run an AI audit after losing streaks or trade milestones.</p>
              </div>
              <label htmlFor="auditRemindersEnabled" className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="auditRemindersEnabled"
                  className="sr-only peer"
                  checked={settings.auditRemindersEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, auditRemindersEnabled: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-surface_hover peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
          
          <div className={!settings.auditRemindersEnabled ? 'opacity-50 pointer-events-none' : ''}>
            <label htmlFor="auditMilestoneFrequency" className="block text-sm font-medium text-text_secondary mb-2">Remind me to audit every...</label>
            <div className="relative">
              <input
                type="number"
                id="auditMilestoneFrequency"
                value={settings.auditMilestoneFrequency}
                onChange={handleFrequencyChange}
                min="1"
                className="bg-secondary p-2.5 rounded-md w-full border border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!settings.auditRemindersEnabled}
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-text_secondary">trades</span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-end space-x-4">
          <button type="button" onClick={onClose} className="bg-secondary hover:bg-secondary_hover text-text_primary font-bold py-2.5 px-5 rounded-lg transition-colors duration-200">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="bg-primary hover:bg-primary_hover text-white font-bold py-2.5 px-5 rounded-lg transition-colors duration-200"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;