import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/product";

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

export const getProductById = async (id) => {
  const response = await api.get(`/${id}`);
  return response.data;
};

export const getProducts = async ({
  page = 0,
  size = 5,
  sortBy = "createdAt",
  sortOrder = "desc",
  fieldSearch = "",
  workspaceId = "",
}) => {
  const response = await api.get("", {
    params: {
      page,
      size,
      sortBy,
      sortOrder,
      fieldSearch,
      workspaceId,
    },
  });
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await api.post("", productData);
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const response = await api.put(`/${id}`, productData);
  return response.data;
};

export default {
  getProductById,
  getProducts,
  createProduct,
  updateProduct,
};
