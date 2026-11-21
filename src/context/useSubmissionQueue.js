import { useContext } from 'react'
import { SubmissionQueueContext } from './submissionQueueContext.js'

export function useSubmissionQueue() {
  const context = useContext(SubmissionQueueContext)
  if (!context) {
    throw new Error('useSubmissionQueue must be used within a SubmissionQueueProvider.')
  }
  return context
}
