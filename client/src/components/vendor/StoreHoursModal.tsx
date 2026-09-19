import React, { useState, useEffect } from 'react';
import { Clock, Check, Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../ui/table';
import { useUpdateStoreOperatingHours } from '../../hooks/useStores';
import { toast } from '../../hooks/useToast';
import type { StoreDto, OperatingHourItemDto } from '@geomarket/shared';

interface StoreHoursModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: StoreDto | null;
  onSuccess?: () => void;
}

const DAYS_OF_WEEK = [
  { dayOfWeek: 0, name: 'Sunday' },
  { dayOfWeek: 1, name: 'Monday' },
  { dayOfWeek: 2, name: 'Tuesday' },
  { dayOfWeek: 3, name: 'Wednesday' },
  { dayOfWeek: 4, name: 'Thursday' },
  { dayOfWeek: 5, name: 'Friday' },
  { dayOfWeek: 6, name: 'Saturday' },
];

const DEFAULT_SCHEDULE: OperatingHourItemDto[] = DAYS_OF_WEEK.map((d) => ({
  dayOfWeek: d.dayOfWeek,
  openingTime: '09:00',
  closingTime: '22:00',
  isClosed: false,
}));

export function StoreHoursModal({
  open,
  onOpenChange,
  store,
  onSuccess,
}: StoreHoursModalProps) {
  const updateHoursMutation = useUpdateStoreOperatingHours();
  const [schedule, setSchedule] = useState<OperatingHourItemDto[]>(DEFAULT_SCHEDULE);
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    if (open && store) {
      setValidationErrors({});
      if (store.operatingHours && store.operatingHours.length > 0) {
        const mapped = DAYS_OF_WEEK.map((d) => {
          const found = store.operatingHours?.find((h) => h.dayOfWeek === d.dayOfWeek);
          if (found) {
            return {
              dayOfWeek: found.dayOfWeek,
              openingTime: found.openingTime || '09:00',
              closingTime: found.closingTime || '22:00',
              isClosed: found.isClosed,
            };
          }
          return {
            dayOfWeek: d.dayOfWeek,
            openingTime: '09:00',
            closingTime: '22:00',
            isClosed: false,
          };
        });
        setSchedule(mapped);
      } else {
        setSchedule(DEFAULT_SCHEDULE);
      }
    }
  }, [open, store]);

  const handleToggleClosed = (dayOfWeek: number) => {
    setSchedule((prev) =>
      prev.map((item) => {
        if (item.dayOfWeek === dayOfWeek) {
          return { ...item, isClosed: !item.isClosed };
        }
        return item;
      }),
    );

    // Clear error for that day if closed
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[dayOfWeek];
      return next;
    });
  };

  const handleTimeChange = (
    dayOfWeek: number,
    field: 'openingTime' | 'closingTime',
    value: string,
  ) => {
    setSchedule((prev) =>
      prev.map((item) => {
        if (item.dayOfWeek === dayOfWeek) {
          const updated = { ...item, [field]: value };
          // Validate immediately
          if (!updated.isClosed && updated.openingTime && updated.closingTime) {
            if (updated.openingTime >= updated.closingTime) {
              setValidationErrors((errs) => ({
                ...errs,
                [dayOfWeek]: 'Opening time must be earlier than closing time',
              }));
            } else {
              setValidationErrors((errs) => {
                const next = { ...errs };
                delete next[dayOfWeek];
                return next;
              });
            }
          }
          return updated;
        }
        return item;
      }),
    );
  };

  const validateAll = (): boolean => {
    const errors: Record<number, string> = {};
    for (const item of schedule) {
      if (!item.isClosed) {
        if (!item.openingTime || !item.closingTime) {
          errors[item.dayOfWeek] = 'Please provide both opening and closing times';
        } else if (item.openingTime >= item.closingTime) {
          errors[item.dayOfWeek] = 'Opening time must be earlier than closing time';
        }
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!store) return;
    if (!validateAll()) {
      toast({
        variant: 'destructive',
        title: 'Invalid schedule',
        description: 'Please correct operating hour discrepancies before saving.',
      });
      return;
    }

    try {
      await updateHoursMutation.mutateAsync({
        id: store.id,
        hours: schedule,
      });

      toast({
        variant: 'success',
        title: 'Operating hours updated',
        description: `Weekly schedule saved for ${store.name}.`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to update hours',
        description: err.message || 'Please try again later.',
      });
    }
  };

  const hasErrors = Object.keys(validationErrors).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Operating Hours: {store?.name}
          </DialogTitle>
          <DialogDescription>
            Configure weekly 7-day operating schedule. Customers cannot place orders when the store is closed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {hasErrors && (
            <div className="flex items-center gap-2 p-3 text-xs bg-destructive/10 text-destructive rounded-md border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Please ensure all active days have opening times earlier than closing times.</span>
            </div>
          )}

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28 text-xs font-semibold">Day</TableHead>
                  <TableHead className="w-24 text-xs font-semibold text-center">Status</TableHead>
                  <TableHead className="text-xs font-semibold">Opening Time</TableHead>
                  <TableHead className="text-xs font-semibold">Closing Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DAYS_OF_WEEK.map((day) => {
                  const daySchedule = schedule.find((s) => s.dayOfWeek === day.dayOfWeek) || {
                    dayOfWeek: day.dayOfWeek,
                    openingTime: '09:00',
                    closingTime: '22:00',
                    isClosed: false,
                  };
                  const hasError = !!validationErrors[day.dayOfWeek];

                  return (
                    <TableRow key={day.dayOfWeek} className={hasError ? 'bg-destructive/5' : undefined}>
                      <TableCell className="font-medium text-xs">
                        {day.name}
                        {hasError && (
                          <div className="text-[10px] text-destructive mt-0.5">
                            {validationErrors[day.dayOfWeek]}
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={daySchedule.isClosed}
                            onChange={() => handleToggleClosed(day.dayOfWeek)}
                            className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                          />
                          <span className={daySchedule.isClosed ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                            {daySchedule.isClosed ? 'Closed' : 'Open'}
                          </span>
                        </label>
                      </TableCell>

                      <TableCell>
                        <Input
                          type="time"
                          value={daySchedule.openingTime}
                          onChange={(e) =>
                            handleTimeChange(day.dayOfWeek, 'openingTime', e.target.value)
                          }
                          disabled={daySchedule.isClosed}
                          className="h-8 text-xs w-32"
                        />
                      </TableCell>

                      <TableCell>
                        <Input
                          type="time"
                          value={daySchedule.closingTime}
                          onChange={(e) =>
                            handleTimeChange(day.dayOfWeek, 'closingTime', e.target.value)
                          }
                          disabled={daySchedule.isClosed}
                          className="h-8 text-xs w-32"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter className="mt-4 pt-3 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={updateHoursMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={updateHoursMutation.isPending || hasErrors}
            className="gap-1.5"
          >
            {updateHoursMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save Schedule
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
