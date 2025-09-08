
'use client';

import Simulation from '@/components/simulation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SimulationPage() {
    return (
        <div className="min-h-screen bg-muted/40">
            <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-background px-4 sm:px-6 md:px-8">
                <Button asChild variant="outline">
                <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
                </Button>
                <div className='text-center'>
                    <h1 className="text-3xl font-bold">Simulate Standings</h1>
                     <p className="text-muted-foreground">Project the final results based on completed games.</p>
                </div>
                <div className="w-48"></div>
            </header>
            <main className="p-4 sm:p-6 md:p-8">
                <Simulation />
            </main>
        </div>
    );
}
