
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Wand2, RefreshCw, Info } from 'lucide-react';
import type { PowerUp } from '@/types';
import { usePlayerContext } from '@/contexts/player-context';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { publishData } from '@/app/actions';

export default function RuleGeneratorPage() {
  const { toast } = useToast();
  const { 
    teams, 
    schedule, 
    gameFormat, 
    gameVariant, 
    activeRule, 
    setActiveRule, 
    pointsToWin,
    allPowerUps,
    cosmicScrambleRules
  } = usePlayerContext();

  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isPowerUpRound = gameFormat === 'king-of-the-court' && gameVariant === 'power-up-round';
  const isKingsRansom = gameFormat === 'king-of-the-court' && gameVariant === 'king-s-ransom';
  const validFormat = isPowerUpRound || isKingsRansom;
  const ruleSet = isKingsRansom ? cosmicScrambleRules : allPowerUps;
  const buttonText = isKingsRansom ? 'Generate Cosmic Scramble' : 'Get New Power-Up';
  const cardTitle = isKingsRansom ? 'Active Scramble Rule' : 'Active Power-Up';
  const initialText = isKingsRansom ? 'Click the button to get the first Cosmic Scramble rule!' : 'Click the button to get the first power-up!';

  const handleGenerate = async () => {
    setIsLoading(true);
    
    // Defer the random selection to a timeout to ensure it runs client-side
    // and avoids hydration mismatches.
    setTimeout(async () => {
      const randomIndex = Math.floor(Math.random() * ruleSet.length);
      let selectedRule = ruleSet[randomIndex];

      // Ensure the new rule is different from the current one
      if (activeRule && selectedRule.name === activeRule.name) {
        selectedRule = ruleSet[(randomIndex + 1) % ruleSet.length];
      }
      
      setActiveRule(selectedRule);
      
      toast({
        title: isKingsRansom ? 'New Scramble Rule!' : 'New Power-Up!',
        description: `"${selectedRule.name}" is now in play. Publishing to dashboard...`,
      });

      // After setting the rule locally, publish all data to the dashboard
      const formatToPublish = gameVariant !== 'standard' ? gameVariant : gameFormat;
      const result = await publishData(teams, formatToPublish, schedule, selectedRule, pointsToWin);
      setIsLoading(false);
      
      if (result.success) {
        toast({
          title: 'Rule Published!',
          description: 'The new rule is now visible on the public dashboard.',
        });
      } else {
         toast({
          title: 'Publishing Error',
          description: result.error || 'Could not publish the new rule.',
          variant: 'destructive',
        });
      }

    }, 50); // A small timeout is enough
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex flex-col items-center text-center">
          <Wand2 className="h-12 w-12 text-primary mb-4" />
          <h1 className="text-4xl font-bold">Rule Generator</h1>
          {validFormat ? (
             <p className="text-muted-foreground mt-2">
                Click the button for a new rule when needed! The public dashboard will update automatically.
            </p>
          ) : (
             <p className="text-muted-foreground mt-2">
                This tool is available for the "Power-Up Round" and "King's Ransom" game variants.
            </p>
          )}
        </header>
        
        {validFormat ? (
        <>
            <div className="text-center mb-8">
                <Button onClick={handleGenerate} disabled={isLoading || !isClient} size="lg">
                    {isLoading ? (
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                    <Wand2 className="mr-2 h-5 w-5" />
                    )}
                    {isLoading ? 'Generating...' : buttonText}
                </Button>
            </div>

            <div className="min-h-[200px]">
            {activeRule ? (
                <Card className="shadow-2xl transition-all duration-300 ease-in-out transform scale-100 hover:scale-105 w-full">
                    <CardHeader className="text-center">
                    <CardTitle className="text-4xl font-bold text-primary">{activeRule.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                    <p className="text-xl text-muted-foreground">{activeRule.description}</p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="text-center py-20 border-2 border-dashed">
                <CardContent>
                    <p className="text-lg text-muted-foreground">{initialText}</p>

                </CardContent>
                </Card>
            )}
            </div>
        </>
        ) : (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No Applicable Rules</AlertTitle>
                <AlertDescription>
                    The current game format does not use the rule generator. Please select either <strong>Power-Up Round</strong> or <strong>King's Ransom</strong> from the schedule page to activate this feature.
                </AlertDescription>
            </Alert>
        )}
      </div>
    </div>
  );
}
