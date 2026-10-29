import api from './axiosInstance'

/**
 * Generate a new mystery case
 * @param {string} premise - The scenario premise (10-500 chars)
 * @param {'easy'|'medium'|'hard'} difficulty - Game difficulty
 */
export const createCase = async (premise, difficulty) => {
  const response = await api.post('/cases', { premise, difficulty })
  return response.data
}

/**
 * Retrieve an active mystery case (public case view)
 * @param {string} id - Case ID
 */
export const getCase = async (id) => {
  const response = await api.get(`/cases/${id}`)
  return response.data
}

/**
 * Discover a clue in an active mystery
 * @param {string} caseId - Case ID
 * @param {string} clueId - Clue ID (e.g., 'c1')
 */
export const discoverClue = async (caseId, clueId) => {
  const response = await api.post(`/cases/${caseId}/clues/${clueId}/discover`)
  return response.data
}

/**
 * Request the next progressive hint
 * @param {string} caseId - Case ID
 */
export const requestHint = async (caseId) => {
  const response = await api.post(`/cases/${caseId}/hints`)
  return response.data
}

/**
 * Accuse a suspect and solve the case
 * @param {string} caseId - Case ID
 * @param {string} suspectId - Selected suspect ID (e.g., 's1')
 */
export const accuseCase = async (caseId, suspectId) => {
  const response = await api.post(`/cases/${caseId}/accuse`, { suspectId })
  return response.data
}

/**
 * Retrieve the final results of a completed case
 * @param {string} caseId - Case ID
 */
export const getResult = async (caseId) => {
  const response = await api.get(`/cases/${caseId}/result`)
  return response.data
}
