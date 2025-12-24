"use client";
import DashboardLayout from '@/components/DashboardLayout';
import { RoleGuard } from '@/components/RoleGuard';

export default function ManageLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RoleGuard allowedRoles={['ORG_ADMIN', 'DEPT_HEAD', 'TEACHER']}>
            <DashboardLayout>{children}</DashboardLayout>
        </RoleGuard>
    );
}

