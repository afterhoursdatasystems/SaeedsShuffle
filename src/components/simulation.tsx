
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bot, RefreshCw } from 'lucide-react';
// import { getSimulatedStandings } from '@/app/actions'; // AI functionality removed
import { Skeleton } from './ui/skeleton';
import { usePlayerContext } from '@/contexts/player-context';

export default function Simulation() {
  const { schedule } = usePlayerContext();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);

  const completedMatches = schedule.filter(m => m.resultA !== null && m.resultB !== null);
  const matchResultsString = completedMatches
    .map(m => `${m.teamA} vs ${m.teamB}: ${m.resultA}-${m.resultB}`)
    .join('\n');

  const handleRunSimulation = async () => {
    // AI simulation functionality removed during Supabase migration
    toast({
      title: 'Simulation Unavailable',
      description: 'AI simulation feature has been temporarily disabled.',
      variant: 'destructive',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Round Robin Simulation</CardTitle>
        <CardDescription>
          Based on the results so far, simulate the final standings in a round robin format.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="mb-2 font-semibold">Completed Match Results</h3>
          <Textarea
            readOnly
            value={matchResultsString || 'No completed matches yet.'}
            className="h-40 font-mono text-xs bg-muted/50"
            aria-label="Completed match results"
          />
        </div>
        
        <Button onClick={handleRunSimulation} disabled={isLoading}>
          {isLoading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Bot className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Simulating...' : 'Run Simulation'}
        </Button>

        {(isLoading || simulationResult) && (
          <div className="space-y-4 rounded-lg border bg-card p-4">
            <h3 className="font-semibold">Projected Final Standings</h3>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-4 w-3/6" />
              </div>
            ) : (
              <p className="whitespace-pre-wrap font-mono text-sm">{simulationResult}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
