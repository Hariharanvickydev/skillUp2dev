"use client"

import { RoleGuard } from "@/components/RoleGuard"
import React from "react"

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['TEACHER', 'ORG_ADMIN', 'DEPT_HEAD']}>
            {children}
        </RoleGuard>
    )
}
