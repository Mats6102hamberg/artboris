'use client'

import { useState, useCallback, useRef } from 'react'

interface CreditsGateState {
  modalOpen: boolean
  neededCredits: number
  actionLabel: string
}

interface UseCreditsGateReturn {
  modalOpen: boolean
  neededCredits: number
  actionLabel: string
  setModalOpen: (open: boolean) => void
  requireCredits: (
    cost: number,
    action: () => Promise<void>,
    meta: { actionLabel: string; balance: number }
  ) => Promise<void>
  resumeAction: () => Promise<void>
}

export function useCreditsGate(): UseCreditsGateReturn {
  const [state, setState] = useState<CreditsGateState>({
    modalOpen: false,
    neededCredits: 0,
    actionLabel: '',
  })

  const pendingAction = useRef<(() => Promise<void>) | null>(null)

  const requireCredits = useCallback(
    async (
      cost: number,
      action: () => Promise<void>,
      meta: { actionLabel: string; balance: number }
    ) => {
      if (meta.balance >= cost) {
        // Enough credits — run action directly
        await action()
      } else {
        // Not enough — store action and open modal
        pendingAction.current = action
        setState({
          modalOpen: true,
          neededCredits: cost - meta.balance,
          actionLabel: meta.actionLabel,
        })
      }
    },
    []
  )

  const setModalOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, modalOpen: open }))
    if (!open) {
      pendingAction.current = null
    }
  }, [])

  const resumeAction = useCallback(async () => {
    setState(prev => ({ ...prev, modalOpen: false }))
    if (pendingAction.current) {
      const action = pendingAction.current
      pendingAction.current = null
      await action()
    }
  }, [])

  return {
    modalOpen: state.modalOpen,
    neededCredits: state.neededCredits,
    actionLabel: state.actionLabel,
    setModalOpen,
    requireCredits,
    resumeAction,
  }
}
