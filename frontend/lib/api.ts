import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000',
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const createCourse = async (title: string, description?: string) => {
    const response = await api.post('/courses/', { title, description });
    return response.data;
};

export const getCourses = async () => {
    const response = await api.get('/courses/');
    return response.data;
};

export const getCourse = async (id: string) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
};

export const generateTopics = async (courseId: string) => {
    const response = await api.post(`/courses/${courseId}/generate-topics`);
    return response.data;
};

export const generateContent = async (topicId: string) => {
    const response = await api.post(`/topics/${topicId}/generate`);
    return response.data;
};

export const getContent = async (topicId: string) => {
    const response = await api.get(`/topics/${topicId}/content`);
    return response.data;
};

export const approveTopic = async (topicId: string) => {
    const response = await api.post(`/topics/${topicId}/approve`);
    return response.data;
};

export const updateTopic = async (topicId: string, data: { title?: string; description?: string; order?: number }) => {
    const response = await api.put(`/topics/${topicId}`, data);
    return response.data;
};

export const deleteTopic = async (topicId: string) => {
    const response = await api.delete(`/topics/${topicId}`);
    return response.data;
};

export const addTopic = async (courseId: string, data: { title: string; description?: string; order: number }) => {
    const response = await api.post(`/courses/${courseId}/topics`, data);
    return response.data;
};

export const deleteCourse = async (courseId: string) => {
    const response = await api.delete(`/courses/${courseId}`);
    return response.data;
};

export default api;
