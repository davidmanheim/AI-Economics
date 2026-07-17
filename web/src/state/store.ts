import { create } from 'zustand'
import type { DynamicsParams, Firm, Params } from '../model/types'
import { ILLUSTRATIVE, NORMALIZED, clonePreset } from '../model/presets'

export type Calibration = 'normalized' | 'illustrative'

interface AppState {
  // --- Calibration display mode (unchanged; used by CalibrationToggle) -------
  calibration: Calibration
  setCalibration: (calibration: Calibration) => void

  // --- Global parameter set (the plan's §2 shared store; read/written only by
  //     the S8 explorer — the seven narrative sections keep their own local
  //     state). Defaults to the Normalized preset. --------------------------
  params: Params
  /** Replace the whole parameter object (used by URL-hash restore, presets). */
  setParams: (params: Params) => void
  /** Patch one or more of the market scalars (c, K, N, thetaMax). */
  setMarket: (patch: Partial<Pick<Params, 'c' | 'K' | 'N' | 'thetaMax'>>) => void
  /** Patch a single firm's q / a / b. */
  setFirm: (index: number, patch: Partial<Firm>) => void
  /** Patch the dynamics parameters (r, Lambda). */
  setDynamics: (patch: Partial<DynamicsParams>) => void
  /**
   * Load a named preset into `params` AND move the calibration display mode to
   * match, so the two stay in sync when the explorer switches presets.
   */
  applyPreset: (preset: Calibration) => void
}

export const useAppStore = create<AppState>((set) => ({
  calibration: 'normalized',
  setCalibration: (calibration) => set({ calibration }),

  params: clonePreset(NORMALIZED),
  setParams: (params) => set({ params }),
  setMarket: (patch) =>
    set((s) => ({ params: { ...s.params, ...patch } })),
  setFirm: (index, patch) =>
    set((s) => ({
      params: {
        ...s.params,
        firms: s.params.firms.map((f, i) => (i === index ? { ...f, ...patch } : f)),
      },
    })),
  setDynamics: (patch) =>
    set((s) => ({
      params: { ...s.params, dynamics: { ...s.params.dynamics, ...patch } },
    })),
  applyPreset: (preset) =>
    set({
      params: clonePreset(preset === 'illustrative' ? ILLUSTRATIVE : NORMALIZED),
      calibration: preset,
    }),
}))
