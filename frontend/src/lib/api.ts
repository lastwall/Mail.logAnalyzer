import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getOverview = async (days: number = 0) => {
  const response = await api.get(`/api/stats/overview?days=${days}`);
  return response.data;
};

export const getVolume = async (days: number = 7) => {
  const response = await api.get(`/api/stats/volume?days=${days}`);
  return response.data;
};

export const getTopSenders = async (limit: number = 10, days: number = 0) => {
  const response = await api.get(`/api/stats/top-senders?limit=${limit}&days=${days}`);
  return response.data;
};

export const getBouncesBySender = async (limit: number = 10, days: number = 0) => {
  const response = await api.get(`/api/stats/bounces-by-sender?limit=${limit}&days=${days}`);
  return response.data;
};

export const getIssues = async () => {
  const response = await api.get("/api/stats/issues");
  return response.data;
};

export const getAllLogs = async (page = 1, limit = 50, search = "", status = "", days = 0, sort_by = "timestamp", order = "desc") => {
  let url = `/api/logs?page=${page}&limit=${limit}&days=${days}&sort_by=${sort_by}&order=${order}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (status) url += `&status=${status}`;
  const response = await api.get(url);
  return response.data;
};

export const getSuspicious = async (page = 1, limit = 50, days: number = 0) => {
  const response = await api.get(`/api/logs/suspicious?page=${page}&limit=${limit}&days=${days}`);
  return response.data;
};

export const processLogs = async () => {
  const response = await api.post("/api/logs/process");
  return response.data;
};

export const getSystemStatus = async () => {
  const response = await api.get("/api/system/status");
  return response.data;
};

export default api;
