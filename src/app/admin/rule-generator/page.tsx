
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getGeneratedPowerUps } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Wand2, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { PowerUp } from '@/types';

export default function RuleGeneratorPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setPowerUps([]);
    try {
      const result = await getGeneratedPowerUps({ gameType: 'Power-Up Round' });
      if (result.success && result.data) {
        setPowerUps(result.data.powerUps);
        toast({
          title: 'Power-Ups Generated!',
          description: 'Here are some fresh ideas for your game.',
        });
      } else {
        throw new Error(result.error || 'Failed to generate power-ups.');
      }
    } catch (error: any) {
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderSkeletons = () => (
    Array.from({ length: 4 }).map((_, index) => (
      <Card key={index}>
        <CardHeader>
          <Skeleton className="h-6 w-1/2 rounded-md" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2 rounded-md" />
          <Skeleton className="h-4 w-5/6 rounded-md" />
        </CardContent>
      </Card>
    ))
  );

  return (
    <div className="min-h-screen bg-muted/40 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-col items-center text-center">
          <Wand2 className="h-12 w-12 text-primary mb-4" />
          <h1 className="text-4xl font-bold">Rule Generator</h1>
          <p className="text-muted-foreground mt-2">
            Generate creative power-ups for your tournament to keep things exciting!
          </p>
        </header>

        <div className="text-center mb-8">
          <Button onClick={handleGenerate} disabled={isLoading} size="lg">
            {isLoading ? (
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-5 w-5" />
            )}
            {isLoading ? 'Generating Ideas...' : 'Generate New Power-Ups'}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {isLoading ? (
            renderSkeletons()
          ) : powerUps.length > 0 ? (
            powerUps.map((powerUp, index) => (
              <Card key={index} className="shadow-lg transition-transform hover:scale-105">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">{powerUp.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{powerUp.description}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="md:col-span-2 text-center py-12">
              <CardContent>
                <p className="text-lg text-muted-foreground">Click the button to generate some power-up ideas!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
