

'use client';

import React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { getPublishedData } from '@/app/actions';
import type { Team, GameFormat, GameVariant, Match, PowerUp, Handicap, Player } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Volleyball, Users, Trophy, BookOpen, Crown, Gem, ShieldQuestion, KeyRound, Zap, Calendar, Shuffle, Wand2, Clock, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { KOTCFlowDiagram } from '@/components/ui/kotc-flow-diagram';
import { Separator } from '@/components/ui/separator';

type CombinedGameFormat = GameFormat | GameVariant;

type TeamStats = {
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  level: number;
};

const KOTCBaseRules = ({ pointsToWin, teamCount }: { pointsToWin: number; teamCount: number }) => (
    <>
        <p className="mb-4">A high-energy, continuous-play format designed to maximize playtime and interaction. All games are rally-scoring, straight up to {pointsToWin} points.</p>
        <h4 className="font-bold text-lg mb-2">The Concept</h4>
        <p className="mb-4">The goal is to get to the “King Court” (the winner’s court) and hold it as long as possible against a constant stream of new challengers. It's a non-stop format that keeps everyone playing.</p>
        
         <h4 className="font-bold text-lg mb-2">Court Setup:</h4>
        <p className="mb-6">There are two courts in play. Court 1 is the "King Court" (the winner's court), and Court 2 is the "Challenger Court".</p>


        <h4 className="font-bold text-lg mb-2">Winner & Loser Actions:</h4>
        <ul className="list-disc pl-5 space-y-3 mb-6">
            <li><strong>King Court Winner:</strong> Stays on the King Court to defend their spot.</li>
            <li><strong>King Court Loser:</strong> Moves down to the Challenger Court (or the waiting line, depending on the number of teams).</li>
            <li><strong>Challenger Court Winner:</strong> Moves up to the King Court to challenge the winners.</li>
            <li><strong>Challenger Court Loser:</strong> Stays on the Challenger Court (or moves to the waiting line, depending on the number of teams).</li>
        </ul>
        
        <h4 className="font-bold text-lg mb-4">Game Flow Based on Number of Teams:</h4>
        
        {teamCount === 4 && (
          <Card className="bg-muted/30 p-4">
            <CardTitle className="text-xl mb-2">Scenario: 4 Teams</CardTitle>
            <CardContent className="p-0">
              <p className="mb-4">With 4 teams, it’s a straightforward rotation. The winners of the King Court stay, while the winners of the Challenger Court move up to play them. Losers move down to the Challenger Court.</p>
              <KOTCFlowDiagram 
                kingCourtWinner="Winner of King Court stays on King Court."
                kingCourtLoser="Loser of King Court moves to the Challenger Court."
                challengerCourtWinner="Winner of Challenger Court moves to the King Court."
                challengerCourtLoser="Loser of Challenger Court stays on the Challenger Court."
              />
            </CardContent>
          </Card>
        )}

        {(teamCount === 5 || teamCount === 6) && (
           <Card className="bg-muted/30 p-4">
            <CardTitle className="text-xl mb-2">Scenario: {teamCount} Teams</CardTitle>
            <CardContent className="p-0">
               <p className="mb-4">With {teamCount} teams, a waiting line forms. Losing on the King Court sends you to the back of the line. Winning on the Challenger Court moves you to the King Court, while losing on the Challenger Court sends you to the front of the line to wait.</p>
              <KOTCFlowDiagram 
                kingCourtWinner="Winner of King Court stays on King Court."
                kingCourtLoser="Loser of King Court goes to the back of the waiting line."
                challengerCourtWinner="Winner of Challenger Court moves to the King Court."
                challengerCourtLoser="Loser of Challenger Court goes to the front of the waiting line."
                waitingLineText={`The team at the front of the line comes on to play the loser of the Challenger Court match.`}
              />
            </CardContent>
          </Card>
        )}
        
         {teamCount >= 7 && (
           <Card className="bg-muted/30 p-4">
            <CardTitle className="text-xl mb-2">Scenario: {teamCount}+ Teams</CardTitle>
            <CardContent className="p-0">
              <p className="mb-4">With many teams, the flow ensures constant movement. Losing on any court sends you to the back of the waiting line. Winning on a challenger court moves you up to the *front* of the line to wait for your shot at the King Court.</p>
               <KOTCFlowDiagram 
                kingCourtWinner="Winner of King Court stays on King Court."
                kingCourtLoser="Loser of King Court goes to the back of the waiting line."
                challengerCourtWinner="Winner of Challenger Court goes to the front of the waiting line."
                challengerCourtLoser="Loser of Challenger Court goes to the back of the waiting line."
                waitingLineText={`Teams in the waiting line play each other to determine who moves up to challenge for a spot on a Challenger Court.`}
              />
            </CardContent>
          </Card>
        )}

        {teamCount > 0 && teamCount < 4 && (
            <p className="text-muted-foreground">Flow diagrams will appear here once 4 or more teams are published.</p>
        )}
      </>
);

const getFormatDetails = (pointsToWin: number, teamCount: number, handicaps: Handicap[]): Record<CombinedGameFormat, { title: string; description: React.ReactNode; icon: React.ElementType }> => ({
  'king-of-the-court': {
    title: 'Continuous King of the Court',
    icon: Crown,
    description: <KOTCBaseRules pointsToWin={pointsToWin} teamCount={teamCount} />
  },
   'standard': {
    title: 'King of the Court',
    icon: Crown,
    description: ( <KOTCBaseRules pointsToWin={pointsToWin} teamCount={teamCount} />)
  },
  'monarch-of-the-court': {
    title: 'Monarch of the Court',
    icon: Gem,
    description: (
      <div>
        <p className="mb-4">A social twist on KOTC. After winning on the King Court, the "Monarchs" get a strategic advantage for their next game.</p>
        <h4 className="font-bold text-lg mb-2">Variant-Specific Rule</h4>
         <ul className="list-disc pl-5 space-y-2 mb-6">
            <li>After winning a game on the King Court, your team is crowned “The Monarchs”.</li>
            <li>Before the next game against you begins, you must choose one of the following powers:
                <ul className="list-circle pl-5 mt-2 space-y-1">
                    <li><strong>Choose Your Challenger:</strong> You may pick any team waiting in line to be your next opponent.</li>
                    <li><strong>Impose a Rule:</strong> You may add a fun, temporary rule for the next game only (e.g., “no jump serves,” “losing team buys winning team drinks”).</li>
                    <li><strong>Take a Royal Rest:</strong> You can choose to sit out one round. The next two teams in line will play each other to determine who challenges you next.</li>
                </ul>
            </li>
        </ul>
        <div className='border-t pt-6 mt-6'>
             <h3 className="font-bold text-xl mb-4">Base King of the Court Rules</h3>
            <KOTCBaseRules pointsToWin={pointsToWin} teamCount={teamCount} />
        </div>
      </div>
    ),
  },
    'king-s-ransom': {
    title: "King's Ransom",
    icon: KeyRound,
    description: (
      <div>
        <p className="mb-4">A dramatic and strategic KOTC format where team rosters are not safe. It includes a player "trade" mechanic dictated by a randomly generated rule.</p>
        <h4 className="font-bold text-lg mb-2">Variant-Specific Rule</h4>
         <ul className="list-disc pl-5 space-y-2 mb-6">
            <li><strong>The Cosmic Scramble:</strong> This rule is only triggered when a team successfully defends their title on the King's Court. After the game, the losing challenger must use the active "Cosmic Scramble" rule to trade one of their players with a player from the winning team. If the challenger wins, no trade occurs.</li>
        </ul>
         <div className='border-t pt-6 mt-6'>
             <h3 className="font-bold text-xl mb-4">Base King of the Court Rules</h3>
            <KOTCBaseRules pointsToWin={pointsToWin} teamCount={teamCount} />
        </div>
      </div>
    ),
  },
  'power-up-round': {
    title: 'Power-Up Round',
    icon: Zap,
    description: (
       <div>
        <p className="mb-4">A fun, arcade-like twist on the classic KOTC format where teams get random advantages that can turn the tide of a game.</p>
        <h4 className="font-bold text-lg mb-2">Variant-Specific Rule</h4>
         <ul className="list-disc pl-5 space-y-2 mb-6">
            <li>A special "Power-Up" rule is in effect, granting an advantage to the <strong>challenging team</strong> for their game on the King's Court.</li>
            <li><strong>How to Use:</strong> The power-up can be used once per game. The team must call out that they are using their power-up before the serve.</li>
        </ul>
        <div className='border-t pt-6 mt-6'>
            <h3 className="font-bold text-xl mb-4">Base King of the Court Rules</h3>
            <KOTCBaseRules pointsToWin={pointsToWin} teamCount={teamCount} />
        </div>
      </div>
    ),
  },
  'pool-play-bracket': {
    title: 'Pool Play / Bracket',
    icon: Trophy,
    description: (
      <div>
        <p className="mb-4">A classic tournament format where teams first compete in a round-robin style "pool play" to determine seeding, followed by a single-elimination bracket to crown the champion. All games are to {pointsToWin} points.</p>
        <h4 className="font-bold text-lg mb-2">Phase 1: Pool Play</h4>
        <p className="mb-4">All teams will play against other teams in their assigned pool. The results of these matches (wins, losses, and point differential) will be used to rank the teams and determine their seeding for the bracket.</p>
        <h4 className="font-bold text-lg mb-2">Phase 2: Bracket Play</h4>
        <p>After pool play is complete, the top four teams are seeded into a single-elimination tournament. The top-ranked team plays the lowest-ranked team, and so on. In this phase, if you win, you advance; if you lose, you're out. The last team standing is the tournament champion!</p>
      </div>
    ),
  },
   'level-up': {
    title: 'Level Up',
    icon: TrendingUp,
    description: (
       <div>
        <p className="mb-4">A competitive format where teams "level up" by winning, adopting progressively harder handicaps. The goal is to reach the highest level and secure a spot in the final tournament. All games are single games, not sets.</p>
        
        <h4 className="font-bold text-lg mb-2">Base Rules (Enforced at All Levels)</h4>
        <ul className="list-disc pl-5 space-y-2 mb-6">
            <li>No touching the net or interfering with play on the other side.</li>
            <li>Hand sets must be clean (or at least nearly clean); don’t hand set if you can’t keep it clean.</li>
            <li>No lifts.</li>
            <li>No open-handed tips.</li>
        </ul>

        <h4 className="font-bold text-lg mb-2">How It Works</h4>
        <ul className="list-disc pl-5 space-y-2 mb-6">
            <li>Each team will play approximately 5 games in pool play.</li>
            <li>If a team <strong>wins</strong>, they move up one level and must adopt the handicap of that new level for all future games. The team's level is determined by their number of wins + 1.</li>
            <li>If a team <strong>loses</strong>, their level does not change. You can only level up.</li>
            <li>Handicaps are <strong>not</strong> cumulative. For example, a team reaching Level 3 only has the Level 3 handicap, not the Level 2 handicap.</li>
        </ul>

        <h4 className="font-bold text-lg mb-2">The Levels & Handicaps</h4>
        <div className="space-y-3 mb-6">
            <p><strong>Level 1:</strong> No additional rules.</p>
            {handicaps.length > 0 ? (
                handicaps.map(h => (
                    <p key={h.level}><strong>Level {h.level}:</strong> {h.description}</p>
                ))
            ) : (
                <>
                  <p><strong>Level 2:</strong> All players on the team must rotate positions after each side-out.</p>
                  <p><strong>Level 3:</strong> The opposing team designates your strongest hitter, who must then play defense for the entire game.</p>
                  <p><strong>Level 4:</strong> All serves from your team must be underhand.</p>
                  <p><strong>Level 5:</strong> No player on your team is allowed to jump.</p>
                </>
            )}
        </div>

        <h4 className="font-bold text-lg mb-2">Playoffs</h4>
        <p>At the end of pool play, the top four teams (those who have reached the highest levels) will compete in a single-elimination tournament. Point differential is the tie-breaker for seeding. There are no levels/handicaps during playoffs. All playoff matches are single games.</p>

       </div>
    )
  },
  'round-robin': {
    title: 'Round Robin',
    icon: BookOpen,
    description: (
       <div>
        <p className="mb-4">A simple and fair format where every team gets to play against every other team. This is great for maximizing play time and ensuring a variety of matchups. All games are to {pointsToWin} points.</p>
        <h4 className="font-bold text-lg mb-2">The Concept</h4>
        <p className="mb-4">No eliminations, no court changes—just pure volleyball. The schedule is generated so that each team plays all other teams once (or twice, depending on the setup).</p>
        <h4 className="font-bold text-lg mb-2">Determining the Winner</h4>
        <p>The winner is determined by the final standings at the end of all scheduled matches. Standings are ranked first by total number of wins, then by point differential if there is a tie.</p>
       </div>
    )
  },
  'blind-draw': {
    title: 'Blind Draw',
    icon: Shuffle,
    description: (
       <div>
        <p className="mb-4">A social and unpredictable format where teams are redrawn for every round. This format is great for mixing up players and ensuring everyone gets to play with a variety of teammates. All games are to {pointsToWin} points.</p>
        <h4 className="font-bold text-lg mb-2">The Concept</h4>
        <p className="mb-4">There are no fixed teams in this format. Before each round of games, new teams are randomly created from the pool of present players. This emphasizes individual performance and adaptability.</p>
        <h4 className="font-bold text-lg mb-2">Scoring and Winning</h4>
        <p>Players earn points individually based on their randomly-assigned team's performance in each match. The player with the most accumulated points at the end of the night is crowned the individual champion.</p>
       </div>
    )
  },
});

const getLevelHeaderStyle = (level: number | undefined) => {
    switch (level) {
        case 1:
        default:
            return 'bg-slate-500 text-white';
        case 2:
            return 'bg-blue-500 text-white';
        case 3:
            return 'bg-green-600 text-white';
        case 4:
            return 'bg-yellow-500 text-black';
        case 5:
            return 'bg-red-600 text-white';
    }
};

const PlayerRoster = ({ players }: { players: Player[] }) => (
    <div className="space-y-2 px-4 py-2">
        {players.length > 0 ? (
            players.sort((a,b) => a.name.localeCompare(b.name)).map(player => (
                <div key={player.id} className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-muted text-xs">
                            {player.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{player.name}</span>
                </div>
            ))
        ) : (
            <p className="text-sm text-muted-foreground">Roster not available.</p>
        )}
    </div>
);


export default function PublicTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [schedule, setSchedule] = useState<Match[]>([]);
  const [gameFormat, setGameFormat] = useState<CombinedGameFormat>('king-of-the-court');
  const [activeRule, setActiveRule] = useState<PowerUp | null>(null);
  const [pointsToWin, setPointsToWin] = useState<number>(15);
  const [levelUpHandicaps, setLevelUpHandicaps] = useState<Handicap[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData(isInitialLoad = false) {
      if (isInitialLoad) {
        setIsLoading(true);
      }
      try {
        const result = await getPublishedData();
        if (result.success && result.data) {
          setTeams(result.data.teams || []);
          setSchedule(result.data.schedule || []);
          setActiveRule(result.data.activeRule || null);
          setGameFormat((result.data.format || 'king-of-the-court') as CombinedGameFormat);
          setPointsToWin(result.data.pointsToWin || 15);
          setLevelUpHandicaps(result.data.levelUpHandicaps || []);
        } else {
          console.error('Failed to fetch data:', result.error);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        if (isInitialLoad) {
          setIsLoading(false);
        }
      }
    }
    
    fetchData(true);
    
    const interval = setInterval(() => fetchData(false), 2000);
    return () => clearInterval(interval);
  }, []);
  
  const formatDetails = useMemo(() => getFormatDetails(pointsToWin, teams.length, levelUpHandicaps), [pointsToWin, teams.length, levelUpHandicaps]);

  const { teamStats, standings } = useMemo(() => {
    const stats: { [teamName: string]: TeamStats } = {};

    teams.forEach(team => {
      stats[team.name] = { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, pointDifferential: 0, level: team.level || 1 };
    });

    schedule.forEach(match => {
      const { teamA, teamB, resultA, resultB } = match;
      if (resultA !== null && resultB !== null) {
        if (stats[teamA]) {
          stats[teamA].pointsFor += resultA;
          stats[teamA].pointsAgainst += resultB;
        }
        if (stats[teamB]) {
          stats[teamB].pointsFor += resultB;
          stats[teamB].pointsAgainst += resultA;
        }

        if (resultA > resultB) {
          if (stats[teamA]) stats[teamA].wins++;
          if (stats[teamB]) stats[teamB].losses++;
        } else if (resultB > resultA) {
          if (stats[teamB]) stats[teamB].wins++;
          if (stats[teamA]) stats[teamA].losses++;
        }
      }
    });
    
    for (const teamName in stats) {
        stats[teamName].pointDifferential = stats[teamName].pointsFor - stats[teamName].pointsAgainst;
    }

    const standings = teams
        .map(team => ({ teamName: team.name, ...stats[team.name], teamData: team }))
        .sort((a, b) => {
            if (b.wins !== a.wins) {
                return b.wins - a.wins;
            }
            return b.pointDifferential - a.pointDifferential;
        });


    return { teamStats: stats, standings };
  }, [teams, schedule]);

  const isKOTC = ['king-of-the-court', 'monarch-of-the-court', 'king-s-ransom', 'power-up-round', 'standard'].includes(gameFormat);
  const isLevelUp = gameFormat === 'level-up';
  
  const groupedSchedule = useMemo(() => {
    if (isKOTC) return null;
    
    return schedule.reduce((acc, match) => {
      const time = match.time;
      if (!acc[time]) {
        acc[time] = [];
      }
      acc[time].push(match);
      return acc;
    }, {} as Record<string, Match[]>);
  }, [schedule, isKOTC]);

  const teamMap = useMemo(() => {
    const map = new Map<string, Team>();
    teams.forEach(team => map.set(team.name, team));
    return map;
  }, [teams]);


  const renderTeamSkeletons = () => (
    Array.from({ length: 4 }).map((_, index) => (
       <Card key={index} className="flex flex-col shadow-lg rounded-xl">
        <CardHeader className="p-4">
          <Skeleton className="h-6 w-3/4 rounded-md" />
        </CardHeader>
        <CardContent className="flex-grow p-4 pt-0">
          <div className="space-y-3">
            {Array.from({length: 4}).map((_, pIndex) => (
              <div key={pIndex} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-5 w-1/2 flex-grow rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ))
  );

  const renderScheduleSkeletons = () => (
    <Card className="rounded-xl border-2 shadow-2xl">
      <CardHeader className="p-4 bg-muted/50 rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <Skeleton className="h-6 w-6 rounded-md" />
            <Skeleton className="h-6 w-48 rounded-md" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-5/6" />
      </CardContent>
    </Card>
  );

  const currentFormatDetails = isKOTC ? formatDetails[gameFormat] || formatDetails['king-of-the-court'] : formatDetails[gameFormat];
  const CurrentFormatIcon = currentFormatDetails?.icon || ShieldQuestion;

  const ruleIsActive = (gameFormat === 'power-up-round' || gameFormat === 'king-s-ransom') && activeRule;
  const activeRuleTitle = gameFormat === 'king-s-ransom' ? 'Active Cosmic Scramble' : 'Active Power-Up';
  
  const getRankByName = (teamName: string) => {
    const rank = standings.findIndex(s => s.teamName === teamName);
    return rank !== -1 ? rank + 1 : null;
  }
  
    const { playoffBracket, areAllGamesPlayed } = useMemo(() => {
        if (gameFormat !== 'pool-play-bracket' || standings.length < 4 || schedule.length === 0) {
            return { playoffBracket: null, areAllGamesPlayed: false };
        }
        
        const poolPlayGames = schedule.filter(m => !m.id.startsWith('playoff-'));
        const allPlayed = poolPlayGames.every(match => match.resultA !== null && match.resultB !== null);

        if (!allPlayed) {
            return { playoffBracket: null, areAllGamesPlayed: false };
        }

        const top4 = standings.slice(0, 4);
        if (top4.length < 4) {
            return { playoffBracket: null, areAllGamesPlayed: allPlayed };
        }
        
        const semiFinal1Data = schedule.find(m => m.id === 'playoff-semi-1') || { teamA: top4[0].teamName, teamB: top4[3].teamName, resultA: null, resultB: null };
        const semiFinal2Data = schedule.find(m => m.id === 'playoff-semi-2') || { teamA: top4[1].teamName, teamB: top4[2].teamName, resultA: null, resultB: null };
        
        const semiFinals = [
            { teamA: semiFinal1Data.teamA, teamB: semiFinal1Data.teamB, resultA: semiFinal1Data.resultA, resultB: semiFinal1Data.resultB },
            { teamA: semiFinal2Data.teamA, teamB: semiFinal2Data.teamB, resultA: semiFinal2Data.resultA, resultB: semiFinal2Data.resultB }
        ];

        let championshipMatch = null;
        const semi1Played = semiFinal1Data.resultA !== null && semiFinal1Data.resultB !== null;
        const semi2Played = semiFinal2Data.resultA !== null && semiFinal2Data.resultB !== null;

        if (semi1Played && semi2Played) {
            const winner1 = semiFinal1Data.resultA! > semiFinal1Data.resultB! ? semiFinal1Data.teamA : semiFinal1Data.teamB;
            const winner2 = semiFinal2Data.resultA! > semiFinal2Data.resultB! ? semiFinal2Data.teamA : semiFinal2Data.teamB;
            
            const finalData = schedule.find(m => m.id === 'playoff-final') || { resultA: null, resultB: null };

            championshipMatch = {
                teamA: winner1,
                teamB: winner2,
                resultA: finalData.resultA,
                resultB: finalData.resultB
            };
        }


        return { 
            playoffBracket: {
                semiFinals: semiFinals,
                championship: championshipMatch,
            },
            areAllGamesPlayed: allPlayed 
        };
    }, [gameFormat, standings, schedule]);


  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-24 items-center justify-between border-b-4 border-primary bg-card px-6 md:px-8">
        <div className="flex items-center gap-4">
          <Volleyball className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Saeed's Shuffle</h1>
            <p className="text-md text-muted-foreground sm:text-lg">Good vibes, great serves, and a fresh draft weekly.</p>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto w-full max-w-none">
          {isLoading ? (
             <div className="space-y-8">
                <Card className="rounded-xl border-2 shadow-2xl">
                  <CardHeader className="p-6 bg-secondary/10 rounded-t-lg">
                      <CardTitle className="flex items-center gap-4 text-2xl font-bold text-secondary-foreground">
                          <Skeleton className="h-7 w-7 rounded-full" />
                           <Skeleton className="h-7 w-48 rounded-md" />
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-4 rounded-md" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full rounded-md" />
                        <Skeleton className="h-4 w-full rounded-md" />
                        <Skeleton className="h-4 w-5/6 rounded-md" />
                      </div>
                  </CardContent>
                </Card>
             </div>
          ) : (
            <div className="space-y-8">
              
              {ruleIsActive && (
                  <Card className="shadow-2xl transition-all duration-300 ease-in-out transform w-full bg-accent/20 border-accent border-2">
                      <CardHeader className="text-center pb-4">
                        <CardTitle className="text-2xl font-bold text-accent-foreground flex items-center justify-center gap-4">
                          <Wand2 className="h-8 w-8 text-primary" />
                          {activeRuleTitle}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="text-2xl font-bold text-primary">{activeRule?.name}</p>
                        <p className="text-lg text-muted-foreground mt-2">{activeRule?.description}</p>
                      </CardContent>
                  </Card>
               )}

              {teams.length > 0 || gameFormat === 'blind-draw' ? (
                <>
                   <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
                    {standings.map((s, index) => {
                      const team = s.teamData;
                      const teamRecord = `${s.wins}-${s.losses}`;
                      return(
                      <Card key={team.id} className={cn("flex flex-col rounded-xl border-2 shadow-2xl transition-transform hover:scale-105 bg-card",
                        isLevelUp ? `border-transparent` : 'border-primary'
                      )}>
                        <CardHeader className={cn("p-4 rounded-t-lg", isLevelUp ? getLevelHeaderStyle(s.level) : 'bg-slate-600 text-white')}>
                             <CardTitle className="text-lg font-bold">
                                <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                        <Users className="h-5 w-5" />
                                        <span>{team.name}</span>
                                   </div>
                                    <div className="flex items-center gap-3">
                                      {isLevelUp && <span className="font-semibold">{s.level}</span>}
                                      {gameFormat === 'pool-play-bracket' && (
                                        <span className="ml-2 font-semibold text-base opacity-90">{teamRecord}</span>
                                      )}
                                    </div>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow p-4">
                          <div className="space-y-3">
                            {[...team.players]
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map((player) => (
                              <div key={player.id} className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border-2 border-white">
                                  <AvatarFallback className="bg-neutral-300 font-bold text-neutral-800">
                                    {player.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-base font-medium">{player.name}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )})}
                  </div>

                  {gameFormat === 'pool-play-bracket' && standings.length > 0 && (
                      <Card className="rounded-xl border-2 shadow-2xl">
                          <CardHeader className="p-4 bg-muted/50 rounded-t-lg">
                              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                                  <Trophy className="h-6 w-6 text-primary" />
                                  Pool Play Standings
                              </CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                              <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead className="w-[50px] text-center">Rank</TableHead>
                                          <TableHead>Team</TableHead>
                                          <TableHead className="text-center">Wins</TableHead>
                                          <TableHead className="text-center">Losses</TableHead>
                                          <TableHead className="text-center">Points For</TableHead>
                                          <TableHead className="text-center">Points Against</TableHead>
                                          <TableHead className="text-center">Point Diff.</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {standings.map((s, index) => (
                                          <TableRow key={s.teamName}>
                                              <TableCell className="font-bold text-center">{index + 1}</TableCell>
                                              <TableCell className="font-medium">{s.teamName}</TableCell>
                                              <TableCell className="text-center">{s.wins}</TableCell>
                                              <TableCell className="text-center">{s.losses}</TableCell>
                                              <TableCell className="text-center">{s.pointsFor}</TableCell>
                                              <TableCell className="text-center">{s.pointsAgainst}</TableCell>
                                              <TableCell className={cn("text-center font-bold", s.pointDifferential > 0 ? 'text-green-600' : 'text-red-600')}>
                                                  {s.pointDifferential > 0 ? `+${s.pointDifferential}` : s.pointDifferential}
                                              </TableCell>
                                          </TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                          </CardContent>
                      </Card>
                  )}


                   {schedule.length > 0 && !isKOTC && groupedSchedule && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(groupedSchedule).map(([time, matches]) => (
                        <Card key={time} className="rounded-xl border-2 shadow-2xl">
                          <CardHeader className="p-4 bg-muted/50 rounded-t-lg">
                            <CardTitle className="flex items-center gap-3 text-xl font-bold">
                              <Clock className="h-6 w-6 text-primary" />
                              Matches at {time}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-0 sm:p-4 space-y-2">
                                {matches.map((match, index) => {
                                    const teamA = teamMap.get(match.teamA);
                                    const teamB = teamMap.get(match.teamB);
                                    const teamAStats = teamStats[match.teamA];
                                    const teamBStats = teamStats[match.teamB];
                                    const teamARecord = teamAStats ? `${teamAStats.wins}-${teamAStats.losses}` : '';
                                    const teamBRecord = teamBStats ? `${teamBStats.wins}-${teamBStats.losses}` : '';
                                    const teamARank = getRankByName(match.teamA);
                                    const teamBRank = getRankByName(match.teamB);

                                    return (
                                        <React.Fragment key={match.id}>
                                            <div className="text-base rounded-lg border bg-background overflow-hidden">
                                                <div className="p-2 font-bold text-center bg-muted text-muted-foreground">{match.court}</div>
                                                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 w-full p-2">
                                                    <div className="font-medium text-left">
                                                        <div>
                                                            {gameFormat === 'pool-play-bracket' && teamARank && <span className="font-bold mr-2">#{teamARank}</span>}
                                                            {match.teamA}
                                                        </div>
                                                        <div className="text-muted-foreground text-sm flex items-center gap-2">
                                                          <span>{teamARecord}</span>
                                                          {isLevelUp && teamAStats && <span>Level {teamAStats.level}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="font-mono text-center px-2">
                                                        {match.resultA !== null && match.resultB !== null
                                                            ? `${match.resultA} - ${match.resultB}`
                                                            : 'vs'}
                                                    </div>
                                                    <div className="font-medium text-right">
                                                        <div>
                                                            {match.teamB}
                                                            {gameFormat === 'pool-play-bracket' && teamBRank && <span className="font-bold ml-2">#{teamBRank}</span>}
                                                        </div>
                                                        <div className="text-muted-foreground text-sm flex items-center justify-end gap-2">
                                                           {isLevelUp && teamBStats && <span>Level {teamBStats.level}</span>}
                                                           <span>{teamBRecord}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Separator />
                                                <div className="grid grid-cols-2">
                                                    <div>
                                                        <PlayerRoster players={teamA?.players || []} />
                                                    </div>
                                                    <div className="border-l">
                                                        <PlayerRoster players={teamB?.players || []} />
                                                    </div>
                                                </div>
                                            </div>
                                            {index < matches.length - 1 && <Separator />}
                                        </React.Fragment>
                                    );
                                })}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {playoffBracket && (
                    <Card className="rounded-xl border-2 shadow-2xl">
                         <CardHeader className="p-4 bg-muted/50 rounded-t-lg">
                            <CardTitle className="flex items-center gap-3 text-xl font-bold">
                                <Trophy className="h-6 w-6 text-primary" />
                                Playoff Bracket
                            </CardTitle>
                         </CardHeader>
                         <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row justify-center items-center gap-8">
                                {/* Semi-Finals */}
                                <div className="flex flex-col gap-8">
                                    {playoffBracket.semiFinals.map((match, index) => (
                                        <div key={index} className="space-y-2">
                                             <p className="font-bold text-center text-muted-foreground">Semi-Final {index + 1}</p>
                                             <div className="border rounded-lg p-3 min-w-[250px]">
                                                <div className={cn("flex justify-between items-center", (match.resultA !== null && match.resultB !== null && match.resultA < match.resultB) && 'opacity-50')}>
                                                    <span className="font-bold">#{getRankByName(match.teamA)} {match.teamA}</span>
                                                    <span>{match.resultA}</span>
                                                </div>
                                                <Separator className="my-2" />
                                                <div className={cn("flex justify-between items-center", (match.resultA !== null && match.resultB !== null && match.resultB < match.resultA) && 'opacity-50')}>
                                                     <span className="font-bold">#{getRankByName(match.teamB)} {match.teamB}</span>
                                                     <span>{match.resultB}</span>
                                                </div>
                                             </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Connector and Final */}
                               {playoffBracket.championship && (
                                <div className="flex items-center">
                                    <div className="hidden md:block w-8 border-t-2 border-dashed"></div>
                                    <div className="space-y-2">
                                         <p className="font-bold text-center text-muted-foreground">Championship</p>
                                         <div className="border-2 border-primary rounded-lg p-4 min-w-[250px] bg-primary/5">
                                             <div className={cn("flex justify-between items-center font-bold", (playoffBracket.championship.resultA !== null && playoffBracket.championship.resultB !== null && playoffBracket.championship.resultA < playoffBracket.championship.resultB) && 'opacity-50')}>
                                                <span>#{getRankByName(playoffBracket.championship.teamA)} {playoffBracket.championship.teamA}</span>
                                                <span>{playoffBracket.championship.resultA}</span>
                                             </div>
                                             <Separator className="my-2" />
                                             <div className={cn("flex justify-between items-center font-bold", (playoffBracket.championship.resultA !== null && playoffBracket.championship.resultB !== null && playoffBracket.championship.resultB < playoffBracket.championship.resultA) && 'opacity-50')}>
                                                <span>#{getRankByName(playoffBracket.championship.teamB)} {playoffBracket.championship.teamB}</span>
                                                <span>{playoffBracket.championship.resultB}</span>
                                             </div>
                                         </div>
                                    </div>
                                </div>
                               )}
                            </div>
                         </CardContent>
                    </Card>
                  )}

                  {schedule.length > 0 && isKOTC && (
                    <Card className="rounded-xl border-2 shadow-2xl">
                      <CardHeader className="p-6 bg-muted/50 rounded-t-lg">
                        <CardTitle className="flex items-center gap-4 text-2xl font-bold">
                            <Calendar className="h-7 w-7 text-primary" />
                            Continuous KOTC Schedule
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 sm:p-4">
                         <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="px-2">Court / Status</TableHead>
                              <TableHead className="px-2">Team A</TableHead>
                               <TableHead className="w-[80px] text-center px-1">Score</TableHead>
                              <TableHead className="text-right px-2">Team B / Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {schedule.map((match) => (
                              <TableRow key={match.id} className="text-base">
                                <TableCell className="px-2"><Badge>{match.court}</Badge></TableCell>
                                <TableCell className="font-medium px-2">{match.teamA}</TableCell>
                                <TableCell className="text-center font-mono whitespace-nowrap p-1 w-[80px]">
                                    {match.resultA !== null && match.resultB !== null
                                        ? `${match.resultA} - ${match.resultB}`
                                        : 'vs'}
                                </TableCell>
                                <TableCell className="font-medium text-right px-2">{match.teamB}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/50 p-8 text-center">
                  <h3 className="text-2xl font-bold tracking-tight">Teams & Schedule Not Yet Published</h3>
                  <p className="mt-2 text-lg text-muted-foreground">Check back soon!</p>
                </div>
              )}

              {currentFormatDetails && (
                <Card className="rounded-xl border-2 shadow-2xl">
                  <CardHeader className="p-6 bg-secondary/10 rounded-t-lg">
                    <CardTitle className="flex items-center gap-4 text-2xl font-bold text-secondary-foreground">
                      <CurrentFormatIcon className="h-7 w-7 text-secondary" />
                      Tonight's Format
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-xl mb-4">{currentFormatDetails.title}</h3>
                    <div>{currentFormatDetails.description}</div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
       <footer className="mt-auto py-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Saeed's Volleyball. All rights reserved.</p>
          <a href="/login" className="mt-2 inline-block text-sm underline">Commissioner Login</a>
        </footer>
    </div>
  );
}




    