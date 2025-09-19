
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download } from 'lucide-react';
import { usePlayerContext } from '@/contexts/player-context';
import { exportPlayersToCSV } from '@/app/actions';

export function PlayerCSVImportExport() {
    const { toast } = useToast();
    const { importPlayers } = usePlayerContext();
    const [isImporting, setIsImporting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        setIsExporting(true);
        const result = await exportPlayersToCSV();
        setIsExporting(false);

        if (result.success && result.csv) {
            const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'players.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast({
                title: 'Export Successful',
                description: 'Player data has been downloaded as players.csv.',
            });
        } else {
            toast({
                title: 'Export Failed',
                description: result.error || 'Could not export players.',
                variant: 'destructive',
            });
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsImporting(true);
            const reader = new FileReader();
            reader.onload = async (e) => {
                const csvData = e.target?.result as string;
                await importPlayers(csvData);
                setIsImporting(false);
                // Reset file input
                if(fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <div className="flex gap-2">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
            />
            <Button onClick={handleImportClick} disabled={isImporting} variant="outline">
                {isImporting ? (
                    'Importing...'
                ) : (
                    <>
                        <Upload className="mr-2 h-4 w-4" /> Import CSV
                    </>
                )}
            </Button>
            <Button onClick={handleExport} disabled={isExporting} variant="outline">
                 {isExporting ? (
                    'Exporting...'
                ) : (
                    <>
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </>
                )}
            </Button>
        </div>
    );
}

