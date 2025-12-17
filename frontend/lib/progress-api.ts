// Progress tracking API functions

const API_BASE = 'http://localhost:8000';

export async function markTopicComplete(topicId: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/progress/topics/${topicId}/complete`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to mark topic as complete');
    }

    return response.json();
}

export async function unmarkTopicComplete(topicId: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/progress/topics/${topicId}/complete`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to unmark topic');
    }

    return response.json();
}

export async function getCourseProgress(courseId: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/progress/courses/${courseId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch progress');
    }

    return response.json();
}

export async function getCourseProgressStats(courseId: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/progress/courses/${courseId}/stats`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch progress stats');
    }

    return response.json();
}
