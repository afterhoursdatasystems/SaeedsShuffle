
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Wand2, RefreshCw } from 'lucide-react';
import type { PowerUp } from '@/types';

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
  { name: 'Golden Touch', description: 'For the next rally, any point scored by your designated "golden" player is worth 3 points.' },
];

export default function RuleGeneratorPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [powerUp, setPowerUp] = useState<PowerUp | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);

    // Simulate a brief loading period for better UX
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * allPowerUps.length);
      let selectedPowerUp = allPowerUps[randomIndex];

      // Ensure we don't show the same power-up twice in a row
      if (powerUp && selectedPowerUp.name === powerUp.name) {
        selectedPowerUp = allPowerUps[(randomIndex + 1) % allPowerUps.length];
      }
      
      setPowerUp(selectedPowerUp);
      
      toast({
        title: 'New Power-Up!',
        description: `"${selectedPowerUp.name}" is now in play.`,
      });
      setIsLoading(false);
    }, 300); // 300ms delay
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex flex-col items-center text-center">
          <Wand2 className="h-12 w-12 text-primary mb-4" />
          <h1 className="text-4xl font-bold">Rule Generator</h1>
          <p className="text-muted-foreground mt-2">
            Click the button for a new power-up each round!
          </p>
        </header>

        <div className="text-center mb-8">
          <Button onClick={handleGenerate} disabled={isLoading} size="lg">
            {isLoading ? (
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-5 w-5" />
            )}
            {isLoading ? 'Generating...' : 'Get New Power-Up'}
          </Button>
        </div>

        <div className="min-h-[200px]">
          {powerUp ? (
              <Card className="shadow-2xl transition-all duration-300 ease-in-out transform scale-100 hover:scale-105 w-full">
                <CardHeader className="text-center">
                  <CardTitle className="text-4xl font-bold text-primary">{powerUp.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-xl text-muted-foreground">{powerUp.description}</p>
                </CardContent>
              </Card>
          ) : (
            <Card className="text-center py-20 border-2 border-dashed">
              <CardContent>
                <p className="text-lg text-muted-foreground">Click the button to get the first power-up!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
