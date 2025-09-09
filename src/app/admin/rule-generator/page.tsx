
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Wand2, RefreshCw, Info } from 'lucide-react';
import type { PowerUp } from '@/types';
import { usePlayerContext } from '@/contexts/player-context';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const allPowerUps: PowerUp[] = [
  { name: 'Point Boost', description: 'Start the next game with a 2-point lead.' },
  { name: 'Serve Advantage', description: 'Get one "do-over" on a missed serve during the next match.' },
  { name: 'The Equalizer', description: "The opponent's highest-skilled player must serve underhand for the entire game." },
  { name: 'Secret Weapon', description: 'Choose one player on your team; their points are worth double for the first 5 points of the game.' },
  { name: 'Triple Threat', description: "For the next three serves, your team's serves cannot be returned over the net on the first touch." },
  { name: 'Gender Bender', description: 'The next point must be scored by a player of the opposite gender of the person who just scored.' },
  { name: 'One-Handed Wonder', description: 'One player on the opposing team must play with one hand behind their back for the next rally.' },
  { name: 'Rally Stopper', description: 'Your team can choose to end a rally and replay the point, once per game.' },
  { name: 'Ace In The Hole', description: 'If your team serves an ace, you get 3 points instead of 1.' },
  { name: 'The Wall', description: "For the next rally, your team's blocks are worth 2 points." },
  { name: 'Butterfingers', description: 'The opposing team is not allowed to set the ball for the next two rallies (must bump-set).' },
  { name: 'Vampire', description: 'Steal one point from the opposing team and add it to your score.' },
  { name: 'Frozen', description: 'Pick a player on the other team. They cannot jump for the next rally.' },
  { name: 'Mimic', description: 'For the next rally, the opposing team must mimic your team\'s formation.' },
  { name: 'Double Trouble', description: 'For the next rally, your team is allowed to have two contacts in a row by the same player.' },
  { name: 'Low Ceiling', description: 'For the next rally, the opposing team is not allowed to send the ball over the net above the height of the antennae.' },
  { name: 'Friendly Fire', description: 'Your team can get a point if the opposing team has a miscommunication and two players run into each other.' },
  { name: 'Serve Swap', description: 'You may force any player on the opposing team to serve for the next point.' },
];

const kingsRansomRules: PowerUp[] = [
    { name: 'Birthday Swap', description: "The player from each team whose birthday is closest to today's date gets traded." },
    { name: 'Alphabetical Swap', description: 'The player from each team whose first name comes first alphabetically gets traded.' },
    { name: 'Height Swap (Shortest)', description: 'The shortest player from each team gets traded.' },
    { name: 'Height Swap (Tallest)', description: 'The tallest player from each team gets traded.' },
    { name: 'Seniority Swap', description: "The player who has been playing in Saeed's league the longest from each team gets traded." },
];


export default function RuleGeneratorPage() {
  const { toast } = useToast();
  const { gameFormat, gameVariant, activeRule, setActiveRule } = usePlayerContext();
  const [isLoading, setIsLoading] = useState(false);

  const isPowerUpRound = gameFormat === 'king-of-the-court' && gameVariant === 'power-up-round';
  const isKingsRansom = gameFormat === 'king-of-the-court' && gameVariant === 'king-s-ransom';
  const validFormat = isPowerUpRound || isKingsRansom;
  const ruleSet = isKingsRansom ? kingsRansomRules : allPowerUps;
  const buttonText = isKingsRansom ? 'Generate Swap Rule' : 'Get New Power-Up';
  const cardTitle = isKingsRansom ? 'Active Swap Rule' : 'Active Power-Up';
  const initialText = isKingsRansom ? 'Click the button to get the first swap rule!' : 'Click the button to get the first power-up!';

  const handleGenerate = async () => {
    setIsLoading(true);

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * ruleSet.length);
      let selectedRule = ruleSet[randomIndex];

      if (activeRule && selectedRule.name === activeRule.name) {
        selectedRule = ruleSet[(randomIndex + 1) % ruleSet.length];
      }
      
      setActiveRule(selectedRule);
      
      toast({
        title: isKingsRansom ? 'New Swap Rule!' : 'New Power-Up!',
        description: `"${selectedRule.name}" is now in play.`,
      });
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex flex-col items-center text-center">
          <Wand2 className="h-12 w-12 text-primary mb-4" />
          <h1 className="text-4xl font-bold">Rule Generator</h1>
          {validFormat ? (
             <p className="text-muted-foreground mt-2">
                Click the button for a new rule when needed!
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
                <Button onClick={handleGenerate} disabled={isLoading} size="lg">
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
