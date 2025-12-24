"use client"

import { RoleGuard } from "@/components/RoleGuard"
import React from "react"

export default function OrgAdminGroupLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['ORG_ADMIN']}>
            {children}
        </RoleGuard>
    )
}
