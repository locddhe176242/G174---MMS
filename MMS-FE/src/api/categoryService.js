import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/category";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken") || "eyJhbGciOiJIUzUxMiJ9.eyJyb2xlcyI6IiIsInRva2VuVHlwZSI6ImFjY2VzcyIsInVzZXJJZCI6NSwiZW1haWwiOiJqb2huLmRvZUBtbXMuY29tIiwidXNlcm5hbWUiOiJqb2huX2RvZSIsImVtcGxveWVlQ29kZSI6IkVNUDAwMSIsInN1YiI6ImpvaG4uZG9lQG1tcy5jb20iLCJpc3MiOiJNTVMgU3lzdGVtIiwiaWF0IjoxNzYwMjExOTEzLCJleHAiOjE3NjAyOTgzMTN9.FeOCbpiVxY4xlT4mSzmMVZaApUu992A689D75AdUnVUpEDZzT3UU9ZncQ65O_SLx4V3ZkHmh2X3hLwlkMRZuBQ";
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Lấy danh sách tất cả category
export const getCategories = async () => {
  const response = await api.get("");
  return response.data;
};

// Lấy danh sách categories đã xóa
export const getDeletedCategories = async () => {
  const response = await api.get("/deleted");
  return response.data;
};

// Lấy 1 category theo id
export const getCategory = async (id) => {
  const response = await api.get(`/${id}`);
  return response.data;
};

// Tạo category mới
export const createCategory = async (categoryData) => {
  const response = await api.post("", categoryData);
  return response.data;
};

// Cập nhật category
export const updateCategory = async (id, categoryData) => {
  const response = await api.put(`/${id}`, categoryData);
  return response.data;
};

// Xóa category (soft delete)
export const deleteCategory = async (id) => {
  const response = await api.delete(`/${id}`);
  return response.data;
};

// Khôi phục category đã xóa
export const restoreCategory = async (id) => {
  const response = await api.put(`/${id}/restore`);
  return response.data;
};

export default {
  getCategories,
  getDeletedCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory
};
