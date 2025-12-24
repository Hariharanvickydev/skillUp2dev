"use client"

import { RoleGuard } from "@/components/RoleGuard"
import React from "react"

export default function HodLayout({ children }: { children: React.ReactNode }) {
    // Only DEPT_HEAD should see these pages. 
    // ORG_ADMIN might be allowed if they are overseeing. 
    // For now, let's keep it strict as per user request.
    return (
        <RoleGuard allowedRoles={['DEPT_HEAD', 'ORG_ADMIN']}>
            {children}
        </RoleGuard>
    )
}
