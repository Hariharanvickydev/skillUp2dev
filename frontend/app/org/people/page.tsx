"use client";
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PeopleManager } from '@/components/PeopleManager';

export default function PeoplePage() {
    const { token, user: currentUser } = useAuth(); // Get currentUser to know Org Type
    const orgId = currentUser?.organization_id;
    const orgType = currentUser?.organization?.type || 'COLLEGE';

    if (!token || !orgId) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8 text-white shadow-2xl shadow-indigo-900/20">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl"></div>

                <div className="relative z-10">
                    <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200 mb-2">
                        People Directory
                    </h1>
                    <p className="text-indigo-200 text-lg max-w-2xl">
                        Manage your organization's teachers, students, and department heads.
                    </p>
                </div>
            </div>

            <PeopleManager
                orgId={orgId}
                orgType={orgType}
                apiMode="ORG"
            />
        </div>
    );
}
