import axios from 'axios'

const API_URL = 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
})

export const getTonnageSummary = () => api.get('/api/tonnage/summary')
export const getGroups = () => api.get('/api/tonnage/groups')
export const getClubs = () => api.get('/api/tonnage/clubs')
export const getFarms = () => api.get('/api/tonnage/farms')
export const getTonnage = (params) => api.get('/api/tonnage', { params })
export const getCosts = () => api.get('/api/costs')
export const getCostsSummary = () => api.get('/api/costs/summary')
export const getCostPerTon = () => api.get('/api/cost-per-ton')
export const getGroupDetails = (group) => api.get(`/api/group/${group}`)
export const getClubDetails = (club) => api.get(`/api/club/${club}`)