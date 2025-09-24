
import { config } from 'dotenv';
config();

import '@/ai/flows/simulate-league-standings.ts';
import '@/ai/flows/generate-power-ups.ts';
import '@/ai/flows/generate-level-up-handicaps.ts';
import '@/ai/flows/generate-cosmic-scramble-rules.ts';
import '@/ai/flows/regenerate-level-up-handicap.ts';

