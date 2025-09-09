
'use client';

import { useEffect, useState } from 'react';
import { getPublishedData } from '@/app/actions';
import type { Team, GameFormat, GameVariant, Match } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Volleyball, Users, Trophy, BookOpen, Crown, Gem, ShieldQuestion, KeyRound, Zap, Calendar, Shuffle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type CombinedGameFormat = GameFormat | GameVariant;

const formatDetails: Record<CombinedGameFormat, { title: string; description: React.ReactNode; icon: React.ElementType }> = {
  'king-of-the-court': {
    title: 'Continuous King of the Court',
    icon: Crown,
    description: (
       <div>
        <p className="mb-4 text-lg">A high-energy, continuous-play format designed to maximize playtime and interaction.</p>
        <h4 className="font-bold text-xl mb-2">The Concept</h4>
        <p className="mb-4">A dynamic, non-stop format where the goal is to seize control of the “winner’s court” and hold it against a constant stream of new challengers.</p>
        <h4 className="font-bold text-xl mb-2">The Flow of Play</h4>
        <ul className="list-disc pl-5 space-y-2">
            <li><strong>Court Setup:</strong> Court 1 will be the designated “King/Queen Court” and Court 2 will be the “Challenger Court.”</li>
            <li><strong>Starting the Game:</strong> The first two teams in line will play on the King Court, and the next two teams will play on the Challenger Court. All games are to 15 points.</li>
            <li><strong>On the King Court (Court 1):</strong> The winning team stays on the court and earns one point on the main scoreboard. The losing team leaves the court and goes to the back of the challenger line.</li>
            <li><strong>On the Challenger Court (Court 2):</strong> The winning team of this match becomes the next in line to move up and challenge the current King.</li>
            <li><strong>Winning the Tournament:</strong> This process repeats continuously. The team with the most points (total wins) at the end of the time is the champion.</li>
        </ul>
      </div>
    ),
  },
   'standard': { // This is a fallback, should ideally not be used directly for display
    title: 'King of the Court',
    icon: Crown,
    description: ( <p>See King of the Court for details.</p>)
  },
  'monarch-of-the-court': {
    title: 'Monarch of the Court',
    icon: Gem,
    description: (
      <div>
        <p className="mb-4 text-lg">A classic King of the Court format with a fun, social twist that gives the winning team a small “power” after their win, adding a layer of strategy and interaction.</p>
        <h4 className="font-bold text-xl mb-2">The Concept</h4>
        <p className="mb-4">Win the King Court to earn the title of “The Monarchs” and gain the right to choose a special privilege before your next game.</p>
        <h4 className="font-bold text-xl mb-2">The Flow of Play</h4>
         <ul className="list-disc pl-5 space-y-2">
            <li>The tournament follows the standard KOTC winner-stays-on format.</li>
            <li><strong>Becoming the Monarch:</strong> After winning a game on the King Court, your team is crowned “The Monarchs”.</li>
            <li><strong>Using Your Power:</strong> Before the next challenger begins their game against you, you must choose one of the following powers:
                <ul className="list-circle pl-5 mt-2 space-y-1">
                    <li><strong>Choose Your Challenger:</strong> You may pick any team waiting in line to be your next opponent.</li>
                    <li><strong>Impose a Rule:</strong> You may add a fun, temporary rule for the next game only (e.g., “no jump serves”).</li>
                    <li><strong>Take a Royal Rest:</strong> You can choose to sit out one round. The next two teams will play each other to determine who challenges you next.</li>
                </ul>
            </li>
        </ul>
      </div>
    ),
  },
    'king-s-ransom': {
    title: 'King\'s Ransom',
    icon: KeyRound,
    description: (
      <div>
        <p className="mb-4 text-lg">A dramatic and strategic KOTC format where team rosters are not safe. It includes both a player “steal” mechanic and a handicap for dominant teams.</p>
        <h4 className="font-bold text-xl mb-2">The Concept</h4>
        <p className="mb-4">Win the King Court and defend your crown, but be prepared for your team to change. Losing teams can force a player trade, and dominant teams will face a progressive handicap.</p>
        <h4 className="font-bold text-xl mb-2">The Flow of Play</h4>
         <ul className="list-disc pl-5 space-y-2">
            <li>The tournament follows the standard KOTC winner-stays-on format.</li>
            <li><strong>The Ransom Rule:</strong> After you lose a match on the King Court, your team has the option to declare a “ransom”. You can force a one-for-one player trade with the winning team that just beat you. The newly-formed winning team must then defend the court with their new player.</li>
            <li>This creates a self-balancing system where dominant teams may lose strong players, keeping the competition tight and giving all teams a chance to stay in the running.</li>
        </ul>
      </div>
    ),
  },
  'power-up-round': {
    title: 'Power-Up Round',
    icon: Zap,
    description: (
       <div>
        <p className="mb-4 text-lg">A fun, arcade-like twist on the classic KOTC format where teams get random advantages.</p>
        <h4 className="font-bold text-xl mb-2">The Concept</h4>
        <p className="mb-4">Before each match on the King's Court, the challenging team gets a random power-up for that game only, giving them a unique edge and keeping the reigning team on their toes.</p>
        <h4 className="font-bold text-xl mb-2">How It Works</h4>
         <ul className="list-disc pl-5 space-y-2">
            <li>The tournament follows the standard KOTC winner-stays-on format.</li>
            <li>Before a new game starts on the King's Court, the tournament director will generate a random power-up for the challenging team.</li>
            <li>The power-up is active for that single game only.</li>
        </ul>
        <h4 className="font-bold text-xl mt-4 mb-2">Example Power-Ups</h4>
        <ul className="list-disc pl-5 space-y-2">
            <li><strong>Point Boost:</strong> Start the game with a 2-point lead.</li>
            <li><strong>Serve Advantage:</strong> Get one "do-over" on a missed serve during the match.</li>
            <li><strong>The Equalizer:</strong> The opponent's highest-skilled player must serve underhand for the entire game.</li>
        </ul>
      </div>
    ),
  },
  'pool-play-bracket': {
    title: 'Pool Play / Bracket',
    icon: Trophy,
    description: (
      <div>
        <p className="mb-4 text-lg">A classic tournament format where teams first compete in a round-robin style "pool play" to determine seeding, followed by a single-elimination bracket to crown the champion.</p>
        <h4 className="font-bold text-xl mb-2">Phase 1: Pool Play</h4>
        <p className="mb-4">All teams will play against each other once in a round-robin format. The results of these matches (wins, losses, and point differential) will be used to rank the teams and determine their seeding for the bracket.</p>
        <h4 className="font-bold text-xl mb-2">Phase 2: Bracket Play</h4>
        <p>After pool play is complete, teams are seeded into a single-elimination tournament. The top-ranked team plays the lowest-ranked team, and so on. In this phase, if you win, you advance; if you lose, you're out. The last team standing is the tournament champion!</p>
      </div>
    ),
  },
  'round-robin': {
    title: 'Round Robin',
    icon: BookOpen,
    description: (
       <div>
        <p className="mb-4 text-lg">A simple and fair format where every team gets to play against every other team. This is great for maximizing play time and ensuring a variety of matchups.</p>
        <h4 className="font-bold text-xl mb-2">The Concept</h4>
        <p className="mb-4">No eliminations, no court changes—just pure volleyball. The schedule is generated so that each team plays all other teams once (or twice, depending on the setup).</p>
        <h4 className="font-bold text-xl mb-2">Determining the Winner</h4>
        <p>The winner is determined by the final standings at the end of all scheduled matches. Standings are ranked first by total number of wins, then by point differential if there is a tie.</p>
       </div>
    )
  },
  'blind-draw': {
    title: 'Blind Draw',
    icon: Shuffle,
    description: (
       <div>
        <p className="mb-4 text-lg">A social and unpredictable format where teams are redrawn for every round. This format is great for mixing up players and ensuring everyone gets to play with a variety of teammates.</p>
        <h4 className="font-bold text-xl mb-2">The Concept</h4>
        <p className="mb-4">There are no fixed teams in this format. Before each round of games, new teams are randomly created from the pool of present players. This emphasizes individual performance and adaptability.</p>
        <h4 className="font-bold text-xl mb-2">Scoring and Winning</h4>
        <p>Players earn points individually based on their randomly-assigned team's performance in each match. The player with the most accumulated points at the end of the night is crowned the individual champion.</p>
       </div>
    )
  },
};

export default function PublicTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [schedule, setSchedule] = useState<Match[]>([]);
  const [gameFormat, setGameFormat] = useState<CombinedGameFormat>('round-robin');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await getPublishedData();
        if (result.success && result.data) {
          setTeams(result.data.teams || []);
          setSchedule(result.data.schedule || []);
          let format = result.data.format || 'round-robin';
          // Handle old format values for backward compatibility if needed
          if (format === 'standard') format = 'king-of-the-court';
          setGameFormat(format as CombinedGameFormat);
        } else {
          console.error('Failed to fetch data:', result.error);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const renderTeamSkeletons = () => (
    Array.from({ length: 4 }).map((_, index) => (
       <Card key={index} className="flex flex-col shadow-lg rounded-xl">
        <CardHeader className="p-6">
          <Skeleton className="h-10 w-3/4 rounded-md" />
        </CardHeader>
        <CardContent className="flex-grow p-6 pt-0">
          <div className="space-y-6">
            {Array.from({length: 4}).map((_, pIndex) => (
              <div key={pIndex} className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-8 w-1/2 flex-grow rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ))
  );

  const renderScheduleSkeletons = () => (
     <div className="space-y-2">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-5/6" />
    </div>
  )

  const effectiveGameFormat = gameFormat === 'standard' ? 'king-of-the-court' : gameFormat;
  const currentFormatDetails = formatDetails[effectiveGameFormat];
  const CurrentFormatIcon = currentFormatDetails?.icon || ShieldQuestion;
  const isKOTC = ['king-of-the-court', 'monarch-of-the-court', 'king-s-ransom', 'power-up-round', 'standard'].includes(gameFormat);


  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-24 items-center justify-between border-b-4 border-primary bg-card px-6 md:px-8">
        <div className="flex items-center gap-4">
          <Volleyball className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">Saeed's Shuffle</h1>
        </div>
      </header>
      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto w-full max-w-none">
          {isLoading ? (
             <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {renderTeamSkeletons()}
            </div>
          ) : teams.length > 0 ? (
            <div className="space-y-12">
               <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {teams.map((team) => (
                  <Card key={team.name} className="flex flex-col rounded-xl border-2 border-primary/50 shadow-2xl transition-transform hover:scale-105 bg-card">
                    <CardHeader className="p-6 bg-primary/10 rounded-t-lg">
                      <CardTitle className="flex items-center gap-4 text-4xl font-bold text-primary">
                        <Users className="h-10 w-10" />
                        {team.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow p-6">
                      <div className="space-y-6">
                        {[...team.players]
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((player) => (
                          <div key={player.id} className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 border-4 border-white">
                              <AvatarFallback className="bg-primary/20 text-3xl font-bold text-primary">
                                {player.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-3xl font-medium">{player.name}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {schedule.length > 0 && (
                <Card className="rounded-xl border-2 shadow-2xl">
                  <CardHeader className="p-6 bg-muted/50 rounded-t-lg">
                    <CardTitle className="flex items-center gap-4 text-4xl font-bold">
                        <Calendar className="h-10 w-10 text-primary" />
                        Tonight's Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                     {isLoading ? renderScheduleSkeletons() : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[150px]">Court / Status</TableHead>
                              <TableHead>Team A</TableHead>
                              <TableHead>{ isKOTC ? 'vs Team B / Status' : 'Team B'}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {schedule.map((match) => (
                              <TableRow key={match.id} className="text-lg">
                                <TableCell><Badge>{match.court}</Badge></TableCell>
                                <TableCell className="font-medium">{match.teamA}</TableCell>
                                <TableCell className="font-medium">{match.teamB}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                     )}
                  </CardContent>
                </Card>
              )}

              {currentFormatDetails && <Card className="rounded-xl border-2 shadow-2xl">
                <CardHeader className="p-6 bg-secondary/10 rounded-t-lg">
                    <CardTitle className="flex items-center gap-4 text-4xl font-bold text-secondary-foreground">
                        <CurrentFormatIcon className="h-10 w-10 text-secondary" />
                        Tonight's Format
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 text-xl">
                    <h3 className="font-bold text-3xl mb-4">{currentFormatDetails.title}</h3>
                    {currentFormatDetails.description}
                </CardContent>
              </Card>}

            </div>
          ) : (
             <div className="flex h-[60vh] flex-col items-center justify-center rounded-xl border-4 border-dashed bg-muted/50 p-12 text-center">
              <h3 className="text-6xl font-bold tracking-tight">Teams Not Yet Published</h3>
              <p className="mt-6 text-3xl text-muted-foreground">The commissioner is still drafting. Check back soon!</p>
            </div>
          )}
        </div>
      </main>
       <footer className="mt-auto py-6 text-center text-lg text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Saeed's Volleyball. All rights reserved.</p>
          <a href="/login" className="mt-2 inline-block text-sm underline">Commissioner Login</a>
        </footer>
    </div>
  );
}
