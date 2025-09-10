import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './card';

interface KOTCFlowDiagramProps {
    kingCourtWinner: string;
    kingCourtLoser: string;
    challengerCourtWinner: string;
    challengerCourtLoser: string;
    waitingLineText?: string;
}

export function KOTCFlowDiagram({ 
    kingCourtWinner, 
    kingCourtLoser, 
    challengerCourtWinner, 
    challengerCourtLoser,
    waitingLineText
}: KOTCFlowDiagramProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* King Court */}
        <Card className="border-primary border-2">
          <CardHeader className="p-3 bg-primary/10">
            <CardTitle className="text-lg text-primary">King Court</CardTitle>
          </CardHeader>
          <CardContent className="p-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-center">
            <span className="font-semibold">Winner:</span>
            <span>{kingCourtWinner}</span>
            
            <span className="font-semibold">Loser:</span>
            <span>{kingCourtLoser}</span>
          </CardContent>
        </Card>

        {/* Challenger Court */}
        <Card className="border-secondary border-2">
          <CardHeader className="p-3 bg-secondary/10">
            <CardTitle className="text-lg text-secondary-foreground">Challenger Court</CardTitle>
          </CardHeader>
          <CardContent className="p-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-center">
            <span className="font-semibold">Winner:</span>
            <span>{challengerCourtWinner}</span>

            <span className="font-semibold">Loser:</span>
            <span>{challengerCourtLoser}</span>
          </CardContent>
        </Card>
      </div>
      {waitingLineText && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
            <ArrowRight className="h-5 w-5 flex-shrink-0" />
            <p>{waitingLineText}</p>
        </div>
      )}
    </div>
  );
}

    