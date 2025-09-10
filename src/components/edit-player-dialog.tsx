
'use client';

import type { Player } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePlayerContext } from '@/contexts/player-context';
import { Slider } from './ui/slider';
import { useState } from 'react';

const playerSchema = z.object({
  name: z.string().min(1, 'Player name is required.'),
  gender: z.enum(['Guy', 'Gal']),
  skill: z.number().min(1).max(10),
});

type PlayerFormData = z.infer<typeof playerSchema>;

interface EditPlayerDialogProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
}

export function EditPlayerDialog({ player, isOpen, onClose }: EditPlayerDialogProps) {
  const { updatePlayer } = usePlayerContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: player.name,
      gender: player.gender,
      skill: player.skill,
    },
  });

  const currentSkill = watch('skill');

  const onSubmit = async (data: PlayerFormData) => {
    setIsSubmitting(true);
    const updatedPlayer: Player = {
      ...player,
      ...data,
    };
    
    const success = await updatePlayer(updatedPlayer);
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Player: {player.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  {...register('name')}
                  className="w-full"
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Gender</Label>
               <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="col-span-3 flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Guy" id="gender-guy" />
                      <Label htmlFor="gender-guy">Guy</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Gal" id="gender-gal" />
                      <Label htmlFor="gender-gal">Gal</Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="skill" className="text-right">
                    Skill
                </Label>
                <div className="col-span-3 flex items-center gap-4">
                    <Controller
                        name="skill"
                        control={control}
                        render={({ field }) => (
                           <Slider
                                id="skill"
                                min={1}
                                max={10}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-[80%]"
                            />
                        )}
                    />
                    <span className="font-bold text-lg">{currentSkill}</span>
                </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
