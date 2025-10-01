

'use client';

import { TeamGenerator } from '@/components/team-generator';

export default function TeamsPage() {
    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 mb-4">
                <h2 className="text-3xl font-bold tracking-tight">Team Management</h2>
            </div>
            <TeamGenerator />
        </div>
    );
}
