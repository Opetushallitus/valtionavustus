type PendingSave = {
  save: () => Promise<unknown>
  delayMs: number
  readyAt: number
}

type HakuSaveState = {
  running: boolean
  pending?: PendingSave
  timer?: ReturnType<typeof setTimeout>
}

export function createHakuSaveQueue() {
  const saves = new Map<number, HakuSaveState>()

  async function runReadySave(id: number, state: HakuSaveState): Promise<void> {
    if (state.running || !state.pending || state.pending.readyAt > Date.now()) return

    const { save } = state.pending
    state.pending = undefined
    state.running = true
    try {
      await save()
    } catch (error) {
      console.error(`Failed to save avustushaku ${id}`, error)
    } finally {
      state.running = false
      if (state.pending) {
        void runReadySave(id, state)
      } else {
        saves.delete(id)
      }
    }
  }

  function schedule(id: number, delayMs: number, save: () => Promise<unknown>): void {
    let state = saves.get(id)
    if (!state) {
      state = { running: false }
      saves.set(id, state)
    }

    // A normal edit must not postpone an already scheduled immediate save (e.g. publishing).
    const pending = state.pending
    if (pending && pending.delayMs < delayMs) {
      state.pending = { ...pending, save }
    } else {
      state.pending = { save, delayMs, readyAt: Date.now() + delayMs }
    }

    clearTimeout(state.timer)
    const currentState = state
    state.timer = setTimeout(
      () => {
        currentState.timer = undefined
        void runReadySave(id, currentState)
      },
      Math.max(0, state.pending.readyAt - Date.now())
    )
  }

  return { schedule }
}
