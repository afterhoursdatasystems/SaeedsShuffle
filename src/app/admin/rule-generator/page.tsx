
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Wand2, RefreshCw, Info, ListChecks } from 'lucide-react';
import type { PowerUp, Handicap } from '@/types';
import { usePlayerContext } from '@/contexts/player-context';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { publishData } from '@/app/actions';
import { generateLevelUpHandicaps } from '@/ai/flows/generate-level-up-handicaps';

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
    cosmicScrambleRules,
    levelUpHandicaps,
    setLevelUpHandicaps,
  } = usePlayerContext();

  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const isPowerUpRound = gameFormat === 'king-of-the-court' && gameVariant === 'power-up-round';
  const isKingsRansom = gameFormat === 'king-of-the-court' && gameVariant === 'king-s-ransom';
  const isLevelUp = gameFormat === 'level-up';
  
  const validFormat = isPowerUpRound || isKingsRansom || isLevelUp;

  const getRuleSetConfig = useCallback(() => {
    if (isPowerUpRound) {
        return {
            ruleSet: allPowerUps,
            buttonText: 'Get New Power-Up',
            cardTitle: 'Active Power-Up',
            initialText: 'Click the button to get the first power-up!',
            type: 'powerup'
        }
    }
    if(isKingsRansom) {
        return {
            ruleSet: cosmicScrambleRules,
            buttonText: 'Generate Cosmic Scramble',
            cardTitle: 'Active Scramble Rule',
            initialText: 'Click the button to get the first Cosmic Scramble rule!',
            type: 'powerup'
        }
    }
    if (isLevelUp) {
         return {
            ruleSet: levelUpHandicaps,
            buttonText: 'Generate New Handicaps',
            cardTitle: 'Level-Up Handicaps',
            initialText: 'Click the button to generate handicaps for each level.',
            type: 'handicap'
         }
    }
    return null;
  }, [isPowerUpRound, isKingsRansom, isLevelUp, allPowerUps, cosmicScrambleRules, levelUpHandicaps]);

  const config = getRuleSetConfig();

  const handleGenerateHandicaps = async () => {
    setIsLoading(true);
    try {
      const result = await generateLevelUpHandicaps({ gameType: 'Level Up' });
      if (result.handicaps) {
        const sortedHandicaps = result.handicaps.sort((a,b) => a.level - b.level);
        setLevelUpHandicaps(sortedHandicaps);
        
        // Also publish the new handicaps
        const formatToPublish = gameVariant !== 'standard' ? gameVariant : gameFormat;
        await publishData(teams, formatToPublish, schedule, activeRule, pointsToWin, sortedHandicaps);
        
        toast({
          title: 'Handicaps Generated & Published!',
          description: 'The new Level Up handicaps are now live on the public dashboard.',
        });
      }
    } catch(e) {
        toast({
            title: 'Error Generating Handicaps',
            description: 'Could not generate new handicaps. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
    }
  }


  const handleGeneratePowerUp = async () => {
    if (!config || !config.ruleSet) return;
    setIsLoading(true);
    
    setTimeout(async () => {
      const ruleSet = config.ruleSet as PowerUp[];
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

      const formatToPublish = gameVariant !== 'standard' ? gameVariant : gameFormat;
      const result = await publishData(teams, formatToPublish, schedule, selectedRule, pointsToWin, levelUpHandicaps);
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

    }, 50);
  };
  
  const handleGenerate = () => {
    if (!config) return;
    if (config.type === 'handicap') {
        handleGenerateHandicaps();
    } else {
        handleGeneratePowerUp();
    }
  }


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
                This tool is available for "Power-Up Round", "King's Ransom", and "Level Up" game formats.
            </p>
          )}
        </header>
        
        {validFormat && config ? (
        <>
            <div className="text-center mb-8">
                <Button onClick={handleGenerate} disabled={isLoading || !isClient} size="lg">
                    {isLoading ? (
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                    <Wand2 className="mr-2 h-5 w-5" />
                    )}
                    {isLoading ? 'Generating...' : config.buttonText}
                </Button>
            </div>

            <div className="min-h-[200px]">
                {config.type === 'powerup' && (
                    activeRule ? (
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
                            <p className="text-lg text-muted-foreground">{config.initialText}</p>
                        </CardContent>
                        </Card>
                    )
                )}
                {config.type === 'handicap' && (
                    (levelUpHandicaps && levelUpHandicaps.length > 0) ? (
                         <Card className="shadow-lg w-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3"><ListChecks className="h-6 w-6 text-primary" /> {config.cardTitle}</CardTitle>
                                <CardDescription>These are the active handicaps for each level.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1 rounded-md bg-muted/50 p-4">
                                     <p className="font-semibold text-lg">Level 1</p>
                                     <p className="text-muted-foreground">No handicap.</p>
                                </div>
                                {levelUpHandicaps.map((handicap) => (
                                    <div key={handicap.level} className="space-y-1 rounded-md bg-muted/50 p-4">
                                        <p className="font-semibold text-lg">Level {handicap.level}</p>
                                        <p className="text-muted-foreground">{handicap.description}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ) : (
                         <Card className="text-center py-20 border-2 border-dashed">
                            <CardContent>
                                <p className="text-lg text-muted-foreground">{config.initialText}</p>
                            </CardContent>
                        </Card>
                    )
                )}
            </div>
        </>
        ) : (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No Applicable Rules</AlertTitle>
                <AlertDescription>
                    The current game format does not use the rule generator. Please select either <strong>Power-Up Round</strong>, <strong>King's Ransom</strong>, or <strong>Level Up</strong> from the schedule page to activate this feature.
                </AlertDescription>
            </Alert>
        )}
      </div>
    </div>
  );
}
