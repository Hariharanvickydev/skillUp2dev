"use client"

import { PeopleManager } from "@/components/PeopleManager"

export function PeopleTab({ orgId, orgType = 'COLLEGE' }: { orgId: string, orgType?: string }) {
    return <PeopleManager orgId={orgId} orgType={orgType} apiMode="ADMIN" />
}
