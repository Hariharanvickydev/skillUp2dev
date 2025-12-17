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

export const getProfile = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

export const createCourse = async (data: any) => {
    const response = await api.post('/courses/', data);
    return response.data;
};

export const updateCourse = async (courseId: string, data: any) => {
    const response = await api.patch(`/courses/${courseId}`, data);
    return response.data;
};

export const submitCourse = async (courseId: string) => {
    const response = await api.post(`/courses/${courseId}/submit`);
    return response.data;
};

export const approveCourseReq = async (courseId: string) => {
    const response = await api.post(`/courses/${courseId}/approve`);
    return response.data;
};

export const rejectCourse = async (courseId: string, reason: string) => {
    const response = await api.post(`/courses/${courseId}/reject`, null, { params: { reason } });
    return response.data;
};

export const getCourses = async (params?: any) => {
    const response = await api.get('/courses/', { params });
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

export const generateContent = async (topicId: string, feedback?: string) => {
    const response = await api.post(`/topics/${topicId}/generate-content`, { feedback });
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

export const requestTopicApproval = async (topicId: string) => {
    const response = await api.post(`/topics/${topicId}/request-approval`);
    return response.data;
};

export const rejectTopic = async (topicId: string, reason: string) => {
    const response = await api.post(`/topics/${topicId}/reject`, { reason });
    return response.data;
};

export const republishModule = async (moduleId: string) => {
    const response = await api.post(`/topics/${moduleId}/republish`);
    return response.data;
};

export const updateTopic = async (topicId: string, data: { title?: string; description?: string; order?: number }) => {
    const response = await api.put(`/topics/${topicId}`, data);
    return response.data;
};

export const updateTopicContent = async (topicId: string, content: string) => {
    const response = await api.put(`/topics/${topicId}/content`, { content });
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

export const getOrganizations = async () => {
    const response = await api.get('/organizations/');
    return response.data;
};

export const getOrganization = async (id: string) => {
    const response = await api.get(`/organizations/${id}`);
    return response.data;
};



export const getUsers = async (orgId?: string, orgGroupId?: string, role?: string, search?: string, skip = 0, limit = 100) => {
    const params = new URLSearchParams();
    if (orgId) params.append('organization_id', orgId);
    if (orgGroupId) params.append('org_group_id', orgGroupId);
    if (role) params.append('role', role);
    if (search) params.append('search', search);
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());

    const response = await api.get(`/users/?${params.toString()}`);
    return response.data;
};

export const createUser = async (userData: any) => {
    const response = await api.post('/users/', userData);
    return response.data;
};

export const deleteUser = async (userId: string) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
};

export const updateUser = async (userId: string, data: any) => {
    const response = await api.put(`/users/${userId}`, data);
    return response.data;
};

export const userResetPassword = async (userId: string, password: string) => {
    const response = await api.put(`/users/${userId}/reset-password`, { new_password: password });
    return response.data;
};

export default api;

// --- Analytics ---
export const getGlobalMetrics = async () => {
    const response = await api.get('/analytics/global');
    return response.data;
};

export const getOrganizationMetrics = async () => {
    const response = await api.get('/analytics/organizations');
    return response.data;
};

export const getLearningMetrics = async () => {
    const response = await api.get('/analytics/learning');
    return response.data;
};

// --- Super Admin Organization Management ---
export const getAdminOrganizations = async (skip = 0, limit = 100) => {
    const response = await api.get(`/admin/organizations/?skip=${skip}&limit=${limit}`);
    return response.data;
};

export const getAdminOrganization = async (id: string) => {
    const response = await api.get(`/admin/organizations/${id}`);
    return response.data;
};

export const updateOrganizationStatus = async (id: string, isActive: boolean) => {
    const response = await api.put(`/admin/organizations/${id}/status?is_active=${isActive}`);
    return response.data;
};

export const updateOrganizationLimits = async (id: string, limits: any) => {
    const response = await api.put(`/admin/organizations/${id}/limits`, null, { params: limits });
    return response.data;
};

export const createOrganization = async (orgData: any) => {
    const response = await api.post('/admin/organizations/', orgData)
    return response.data
}

export const getAdminOrganizationDashboard = async (id: string) => {
    const response = await api.get(`/admin/organizations/${id}/dashboard`);
    return response.data;
};

export const getOrganizationUsers = async (orgId: string, role?: string, search?: string, skip = 0, limit = 100) => {
    const params = new URLSearchParams()
    if (role) params.append('role', role)
    if (search) params.append('search', search)
    params.append('skip', skip.toString())
    params.append('limit', limit.toString())

    const response = await api.get(`/admin/organizations/${orgId}/users?${params.toString()}`);
    return response.data;
};

export const createOrganizationUser = async (orgId: string, userData: any) => {
    const response = await api.post(`/admin/organizations/${orgId}/users`, userData);
    return response.data;
};

export const updateOrganizationUser = async (userId: string, data: any) => {
    const response = await api.put(`/admin/organizations/users/${userId}`, data);
    return response.data;
};

export const resetUserPassword = async (userId: string, password: string) => {
    const response = await api.put(`/admin/organizations/users/${userId}/reset-password`, { new_password: password });
    return response.data;
};

export const deleteOrganizationUser = async (userId: string) => {
    const response = await api.delete(`/admin/organizations/users/${userId}`);
    return response.data;
};

// --- Org Hierarchy (Groups) ---
export const getOrgGroupTree = async (orgId?: string) => {
    const params = new URLSearchParams();
    if (orgId) params.append('organization_id', orgId);

    const response = await api.get(`/org/groups/tree?${params.toString()}`);
    return response.data;
};

export const createOrgGroup = async (data: any, orgId?: string) => {
    const params = new URLSearchParams();
    if (orgId) params.append('organization_id', orgId);

    const response = await api.post(`/org/groups/?${params.toString()}`, data);
    return response.data;
};

export const updateOrgGroup = async (groupId: string, data: any) => {
    const response = await api.put(`/org/groups/${groupId}`, data);
    return response.data;
};

export const deleteOrgGroup = async (groupId: string) => {
    const response = await api.delete(`/org/groups/${groupId}`);
    return response.data;
};

// --- Department Management ---
// Sync API
export const getSyncStatus = async (courseId: string) => {
    const response = await api.get(`/library/courses/${courseId}/sync-status`)
    return response.data
}

export const syncCourse = async (courseId: string, updates: any[]) => {
    // updates: { library_topic_id, action }[]
    const response = await api.post(`/library/courses/${courseId}/sync`, { items: updates })
    return response.data
}



export const importCourse = async (courseId: string, targetOrgId: string) => {
    const response = await api.post(`/library/courses/${courseId}/import?target_org_id=${targetOrgId}`);
    return response.data;
};

// --- Org Admin Self-Management ---
export const updateOrgProfile = async (data: any) => {
    const response = await api.put('/org/info', data);
    return response.data;
};

export const uploadOrgLogo = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/org/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const reviewCourse = async (courseId: string, flags: any) => {
    const response = await api.patch(`/library/courses/${courseId}/review`, flags);
    return response.data;
};

export const changePassword = async (newPassword: string) => {
    const response = await api.post('/auth/change-password', { new_password: newPassword });
    return response.data;
};

export const getLibraryCourses = async (params?: any) => {
    const response = await api.get('/library/courses', { params });
    return response.data;
};

export const importLibraryCourse = async (courseId: string, targetOrgId: string) => {
    const response = await api.post(`/library/courses/${courseId}/import?target_org_id=${targetOrgId}`);
    return response.data;
};
