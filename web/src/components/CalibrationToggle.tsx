import { useAppStore } from '../state/store'

export function CalibrationToggle() {
  // Drive the SAME action S8's preset buttons use (applyPreset), not the
  // display-only `setCalibration`. Toggling the header therefore loads the
  // matching preset into the shared param store as well, so the header label and
  // the explorer's actual parameters can never contradict each other (e.g. badge
  // saying "Illustrative" while the numbers on screen are still Normalized).
  const { calibration, applyPreset } = useAppStore()
  return (
    <div className="calibration-toggle" role="group" aria-label="Calibration mode">
      <button
        className={calibration === 'normalized' ? 'active' : ''}
        aria-pressed={calibration === 'normalized'}
        onClick={() => applyPreset('normalized')}
      >
        Normalized
      </button>
      <button
        className={calibration === 'illustrative' ? 'active' : ''}
        aria-pressed={calibration === 'illustrative'}
        onClick={() => applyPreset('illustrative')}
      >
        Illustrative
      </button>
    </div>
  )
}
