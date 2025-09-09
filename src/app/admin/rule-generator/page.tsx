
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Wand2, RefreshCw, Info } from 'lucide-react';
import type { PowerUp } from '@/types';
import { usePlayerContext } from '@/contexts/player-context';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { publishData } from '@/app/actions';

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
  { name 'Friendly Fire', description: 'Your team can get a point if the opposing team has a miscommunication and two players run into each other.' },
  { name: 'Serve Swap', description: 'You may force any player on the opposing team to serve for the next point.' },
];

const cosmicScrambleRules: PowerUp[] = [
    { name: 'Birthday Swap', description: 'The two players (one from each team) whose birthday is closest to today must swap teams.' },
    { name: 'Alphabetical Swap', description: 'The player whose first name comes last alphabetically on the losing team swaps with the player whose first name comes last alphabetically on the other team.' },
    { name: 'Brightest Shirt Swap', description: 'Of all the players on both teams, the two wearing the brightest color shirts must swap.' },
    { name: 'Sibling Swap', description: 'The player with the most siblings on the losing team swaps places with the player with the most siblings on the other team.' },
    { name: 'Traveler Swap', description: 'The two players (one from each team) who traveled the farthest to get to the tournament must swap teams.' },
    { name: 'Longest Last Name Swap', description: 'The player with the most letters in their last name on the losing team swaps with the player with the most letters in their last name on the other team.' },
    { name: 'Newest Shoes Swap', description: 'The two players (one from each team) with the newest-looking shoes must swap.' },
    { name: 'Concert Goer Swap', description: 'The player who most recently went to a concert on the losing team swaps with the player who most recently went to a concert on the other team.' },
    { name: 'Longest Hair Swap', description: 'The two players (one from each team) with the longest hair must swap.' },
    { name: 'Most Vowels Swap', description: 'The player with the most vowels in their first name on the losing team swaps with the player with the most vowels in their first name on the other team.' },
    { name: 'Car Brand Swap', description: 'The two players (one from each team) who own the same brand of car must swap.' },
    { name: 'Early Bird Swap', description: 'The player who woke up the earliest this morning on the losing team swaps places with the player who woke up the earliest on the other team.' },
    { name: 'Tallest Swap', description: 'The two players (one from each team) who are the tallest must swap.' },
    { name: 'Restaurant Swap', description: 'The player who last ate at a restaurant on the losing team swaps with the player who last ate at a restaurant on the other team.' },
    { name: 'Pet Swap', description: 'The two players (one from each team) with the most unique or unusual pet must swap.' },
    { name: 'Volleyball Veteran Swap', description: 'The player who has been playing volleyball for the longest number of years on the losing team swaps with their counterpart on the other team.' },
    { name: 'Blue Clothing Swap', description: 'The two players (one from each team) with the most blue on their clothing must swap.' },
    { name: 'Language Swap', description: 'The player who can speak another language on the losing team swaps with the player who can speak another language on the other team (if one exists on both teams).' },
    { name: 'Birth Month Swap', description: 'The two players (one from each team) who share the same birth month must swap (if applicable).' },
    { name: 'Movie Goer Swap', description: 'The player who last watched a movie in a theater on the losing team swaps places with the player who last did the same on the other team.' },
];


export default function RuleGeneratorPage() {
  const { toast } = useToast();
  const { teams, schedule, gameFormat, gameVariant, activeRule, setActiveRule, pointsToWin } = usePlayerContext();
  const [isLoading, setIsLoading] = useState(false);

  const isPowerUpRound = gameFormat === 'king-of-the-court' && gameVariant === 'power-up-round';
  const isKingsRansom = gameFormat === 'king-of-the-court' && gameVariant === 'king-s-ransom';
  const validFormat = isPowerUpRound || isKingsRansom;
  const ruleSet = isKingsRansom ? cosmicScrambleRules : allPowerUps;
  const buttonText = isKingsRansom ? 'Generate Cosmic Scramble' : 'Get New Power-Up';
  const cardTitle = isKingsRansom ? 'Active Scramble Rule' : 'Active Power-Up';
  const initialText = isKingsRansom ? 'Click the button to get the first Cosmic Scramble rule!' : 'Click the button to get the first power-up!';

  const handleGenerate = async () => {
    setIsLoading(true);

    // Simulate a short delay for a better user experience
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

    }, 300);
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
