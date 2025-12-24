"use client"

import { RoleGuard } from "@/components/RoleGuard"
import React from "react"

export default function OrgAdminDashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['ORG_ADMIN']}>
            {children}
        </RoleGuard>
    )
}
