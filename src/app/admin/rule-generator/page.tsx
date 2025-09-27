
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Wand2, RefreshCw, Info, ListChecks, RotateCcw, Shuffle } from 'lucide-react';
import type { PowerUp, Handicap } from '@/types';
import { usePlayerContext } from '@/contexts/player-context';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { publishData } from '@/app/actions';
import { generatePowerUps } from '@/ai/flows/generate-power-ups';
import { generateCosmicScrambleRules } from '@/ai/flows/generate-cosmic-scramble-rules';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


type GenerationMode = 'random' | 'ai';

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
    shuffleLevelUpHandicaps,
    resetLevelUpHandicapsToDefault,
  } = usePlayerContext();

  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [generationMode, setGenerationMode] = useState<GenerationMode>('random');

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
            generateFn: generatePowerUps,
            generateInput: { gameType: 'Power-Up Round' },
            cardTitle: 'Active Power-Up',
            type: 'powerup',
            noun: 'Power-Up'
        }
    }
    if(isKingsRansom) {
        return {
            ruleSet: cosmicScrambleRules,
            generateFn: generateCosmicScrambleRules,
            generateInput: { gameType: 'King\'s Ransom' },
            cardTitle: 'Active Scramble Rule',
            type: 'powerup',
            noun: 'Scramble Rule'
        }
    }
    if (isLevelUp) {
         return {
            ruleSet: levelUpHandicaps,
            cardTitle: 'Level-Up Handicaps',
            type: 'handicap',
            noun: 'Handicaps'
         }
    }
    return null;
  }, [isPowerUpRound, isKingsRansom, isLevelUp, allPowerUps, cosmicScrambleRules, levelUpHandicaps]);

  const config = getRuleSetConfig();
  
  const handleAIGeneration = async () => {
    if (!config || config.type !== 'powerup' || !config.generateFn) return;
    setIsLoading(true);

    try {
      const result = config.noun === 'Power-Up' 
        ? await generatePowerUps(config.generateInput)
        : await generateCosmicScrambleRules(config.generateInput);
        
      if ('powerUps' in result && result.powerUps && result.powerUps.length > 0) {
        const newRule = result.powerUps[Math.floor(Math.random() * result.powerUps.length)];
        await publishNewRule(newRule);
      } else if ('rules' in result && result.rules && result.rules.length > 0) {
        const newRule = result.rules[Math.floor(Math.random() * result.rules.length)];
        await publishNewRule(newRule);
      }
    } catch(e) {
        toast({
            title: `Error Generating ${config.noun}`,
            description: `Could not generate new ${config.noun.toLowerCase()}. Please try again.`,
            variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
    }
  }

  const handleShuffleHandicaps = async () => {
    setIsLoading(true);
    await shuffleLevelUpHandicaps();
    setIsLoading(false);
    toast({
        title: 'Handicaps Shuffled!',
        description: 'A new set of handicaps has been selected and published.',
    });
  }

  const handleResetToDefault = async () => {
    setIsLoading(true);
    await resetLevelUpHandicapsToDefault();
    setIsLoading(false);
    toast({
        title: 'Handicaps Reset',
        description: 'The handicaps have been reset to their default values.',
    });
  }

  const publishNewRule = async (newRule: PowerUp) => {
    setActiveRule(newRule);
      
      toast({
        title: `New ${config?.noun} Generated!`,
        description: `"${newRule.name}" is now in play. Publishing to dashboard...`,
      });

      const formatToPublish = gameVariant !== 'standard' ? gameVariant : gameFormat;
      const result = await publishData(teams, formatToPublish, schedule, newRule, pointsToWin, levelUpHandicaps);
      
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
  }


  const handleRandomFromList = async () => {
    if (!config || !config.ruleSet || config.type !== 'powerup') return;
    setIsLoading(true);
    
    // Use a timeout to make it feel a bit more intentional
    setTimeout(async () => {
      const ruleSet = config.ruleSet as PowerUp[];
      const randomIndex = Math.floor(Math.random() * ruleSet.length);
      let selectedRule = ruleSet[randomIndex];

      // Ensure the new rule is different from the current one
      if (activeRule && ruleSet.length > 1 && selectedRule.name === activeRule.name) {
        selectedRule = ruleSet[(randomIndex + 1) % ruleSet.length];
      }
      
      await publishNewRule(selectedRule);
      setIsLoading(false);
    }, 50);
  };
  
  const initialText = `Select a generation mode above to get started.`;
  const showTabs = isPowerUpRound || isKingsRansom;


  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex flex-col items-center text-center">
          <Wand2 className="h-12 w-12 text-primary mb-4" />
          <h1 className="text-4xl font-bold">Rule Generator</h1>
          {validFormat ? (
             <p className="text-muted-foreground mt-2">
                Generate rules for tonight's special format. The public dashboard will update automatically.
            </p>
          ) : (
             <p className="text-muted-foreground mt-2">
                This tool is available for "Power-Up Round", "King's Ransom", and "Level Up" game formats.
            </p>
          )}
        </header>
        
        {validFormat && config ? (
        <>
            {showTabs && (
                <Tabs value={generationMode} onValueChange={(val) => setGenerationMode(val as GenerationMode)} className="w-full mb-8">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="random">Random from List</TabsTrigger>
                        <TabsTrigger value="ai">AI Generated</TabsTrigger>
                    </TabsList>
                </Tabs>
            )}

            <div className="text-center mb-8">
              {isLevelUp ? (
                  <div className="flex justify-center gap-4">
                     <Button onClick={handleShuffleHandicaps} disabled={isLoading || !isClient} size="lg">
                        {isLoading ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <Shuffle className="mr-2 h-5 w-5" />}
                        {isLoading ? 'Shuffling...' : `Shuffle Today's Handicaps`}
                    </Button>
                     <Button onClick={handleResetToDefault} disabled={isLoading || !isClient} size="lg" variant="outline">
                        <RotateCcw className="mr-2 h-5 w-5" />
                        Reset to Default
                    </Button>
                  </div>
              ) : (
                <>
                  {generationMode === 'random' && (
                    <Button onClick={handleRandomFromList} disabled={isLoading || !isClient} size="lg">
                        {isLoading ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
                        {isLoading ? 'Getting...' : `Get Random ${config.noun}`}
                    </Button>
                  )}
                  {generationMode === 'ai' && (
                    <Button onClick={handleAIGeneration} disabled={isLoading || !isClient} size="lg">
                        {isLoading ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
                        {isLoading ? 'Generating...' : `Generate with AI`}
                    </Button>
                  )}
                </>
              )}
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
                            <p className="text-lg text-muted-foreground">{initialText}</p>
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
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold text-lg">Level {handicap.level}</p>
                                        </div>
                                        <p className="text-muted-foreground">{handicap.description}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ) : (
                         <Card className="text-center py-20 border-2 border-dashed">
                            <CardContent>
                                <p className="text-lg text-muted-foreground">{initialText}</p>
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
