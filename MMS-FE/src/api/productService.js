import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/product";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
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

export const getProducts = async (keyword = "") => {
  const response = await api.get("", {
    params: keyword ? { keyword } : {},
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

export const deleteProduct = async (id) => {
  const response = await api.delete(`/${id}`);
  return response.data;
};

export const uploadProductImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export default {
  getProductById,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
};