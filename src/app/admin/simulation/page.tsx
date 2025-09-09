
'use client';

import Simulation from '@/components/simulation';

export default function SimulationPage() {
    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className='text-center mb-8'>
                <h1 className="text-3xl font-bold">Simulate Standings</h1>
                 <p className="text-muted-foreground">Project the final results based on completed games.</p>
            </div>
            <main className="p-4 sm:p-6 md:p-8">
                <Simulation />
            </main>
        </div>
    );
}
