import { useRef, useState } from "react";
import { NumberField } from "../components/NumberField";
import { Sheet } from "../components/Sheet";
import { useToast } from "../components/Toast";
import { Icon } from "../components/Icon";
import { replaceAll, resetAll, sanitize, actions, getState, useAppState, type ThemeSetting } from "../lib/store";
import { todayISO } from "../lib/dates";

const THEMES: { id: ThemeSetting; label: string }[] = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state = useAppState();
  const s = state.settings;
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState("");

  const exportData = () => {
    const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `iron-plan-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Backup downloaded");
  };

  const importData = async (file: File) => {
    setImportError("");
    try {
      if (file.size > 5_000_000) throw new Error("too large");
      const parsed = sanitize(JSON.parse(await file.text()));
      if (!parsed) throw new Error("invalid");
      if (!window.confirm("Replace everything in the app with this backup? This can’t be undone.")) return;
      replaceAll(parsed);
      toast("Backup restored");
    } catch {
      setImportError("That file isn’t a valid Iron Plan backup. Choose a .json file exported from this app.");
    }
  };

  return (
    <Sheet open={open} title="Settings" onClose={onClose}>
      <div className="stack-lg">
        <fieldset className="fieldset">
          <legend className="display t-sm">Appearance</legend>
          <div className="seg seg-plain" role="radiogroup" aria-label="Theme">
            {THEMES.map((t) => (
              <label key={t.id} className="seg-radio">
                <input type="radio" name="theme" checked={s.theme === t.id} onChange={() => actions.patchSettings({ theme: t.id })} />
                <span>{t.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="display t-sm">Goal</legend>
          <div className="field-row">
            <NumberField label="Starting weight" suffix="kg" value={s.startWeight} min={20} max={300} onChange={(n) => actions.patchSettings({ startWeight: n })} />
            <NumberField label="Goal weight" suffix="kg" value={s.goalWeight} min={20} max={300} onChange={(n) => actions.patchSettings({ goalWeight: n })} />
          </div>
          <div className="field">
            <label htmlFor="start-date">Plan start date</label>
            <input id="start-date" className="input" type="date" value={s.startDate} max={todayISO()} onChange={(e) => e.target.value && actions.patchSettings({ startDate: e.target.value })} />
            <p className="faint small">The planned-pace band on the weight chart starts here.</p>
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="display t-sm">Daily targets</legend>
          <NumberField label="Calories" suffix="kcal" value={s.kcal} min={800} max={6000} hint="The plan suggests starting around 2,300." onChange={(n) => actions.patchSettings({ kcal: n })} />
          <div className="field-row">
            <NumberField label="Protein, low" suffix="g" value={s.proteinMin} min={0} max={s.proteinMax} onChange={(n) => actions.patchSettings({ proteinMin: n })} />
            <NumberField label="Protein, high" suffix="g" value={s.proteinMax} min={s.proteinMin} max={400} onChange={(n) => actions.patchSettings({ proteinMax: n })} />
          </div>
          <div className="field-row">
            <NumberField label="Fat, low" suffix="g" value={s.fatMin} min={0} max={s.fatMax} onChange={(n) => actions.patchSettings({ fatMin: n })} />
            <NumberField label="Fat, high" suffix="g" value={s.fatMax} min={s.fatMin} max={400} onChange={(n) => actions.patchSettings({ fatMax: n })} />
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="display t-sm">Workouts</legend>
          <NumberField label="Rest timer" suffix="sec" value={s.restSeconds} min={0} max={600} hint="Starts when you complete a set. Set to 0 to turn it off." onChange={(n) => actions.patchSettings({ restSeconds: n })} />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="display t-sm">Your data</legend>
          <p className="muted small">Everything is stored in this browser only. Download a backup before clearing browser data or switching devices.</p>
          <div className="btn-row">
            <button className="btn btn-quiet" onClick={exportData}>
              <Icon name="download" size={20} /> Download backup
            </button>
            <button className="btn btn-quiet" onClick={() => fileRef.current?.click()}>
              <Icon name="upload" size={20} /> Restore backup
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importData(f);
                e.target.value = "";
              }}
            />
          </div>
          {importError && (
            <p className="error small" role="alert">
              {importError}
            </p>
          )}
          <button
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm("Delete all workouts, weights and meals from this browser? This can’t be undone.")) {
                resetAll();
                toast("All data cleared");
                onClose();
              }
            }}
          >
            <Icon name="trash" size={20} /> Clear all data
          </button>
        </fieldset>
      </div>
    </Sheet>
  );
}
