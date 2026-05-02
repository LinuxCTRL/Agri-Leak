import axios from 'axios'

const API_URL = 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
})

export const getTonnageSummary = (params) => api.get('/api/tonnage/summary', { params })
export const getGroups = (params) => api.get('/api/tonnage/groups', { params })
export const getClubs = (params) => api.get('/api/tonnage/clubs', { params })
export const getFarms = (params) => api.get('/api/tonnage/farms', { params })
export const getTonnage = (params) => api.get('/api/tonnage', { params })
export const getCropTypes = (params) => api.get('/api/crop-types', { params })
export const getCosts = () => api.get('/api/costs')
export const getCostsSummary = () => api.get('/api/costs/summary')
export const getCostPerTon = (params) => api.get('/api/cost-per-ton', { params })
export const getGroupDetails = (group, params) => api.get(`/api/group/${group}`, { params })
export const getClubDetails = (club, params) => api.get(`/api/club/${club}`, { params })
export const getDomainDetails = (ferme, params) => api.get(`/api/domain/${ferme}`, { params })

// New endpoints
export const getCostTrend = (farm) => api.get('/api/cost-trend', { params: farm ? { farm } : {} })
export const getProductivity = (params) => api.get('/api/productivity', { params })
export const getVarieties = (params) => api.get('/api/varieties', { params })
export const getCostBreakdown = (qnzId) => api.get('/api/cost-breakdown', { params: qnzId ? { qnz_id: qnzId } : {} })