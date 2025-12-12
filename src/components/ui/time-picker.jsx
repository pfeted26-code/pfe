import * as React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

function pad(n) { return n.toString().padStart(2, '0'); }

function TimePicker({ time, setTime, placeholder = "Pick time", className }) {
  // time is a string "HH:MM" in 24h format or empty
  const [open, setOpen] = React.useState(false);
  const [hour, setHour] = React.useState( (time && time.split(':')[0]) || '08');
  const [minute, setMinute] = React.useState( (time && time.split(':')[1]) || '00');

  React.useEffect(() => {
    if (time) {
      const [h, m] = time.split(':');
      if (h) setHour(pad(Number(h)));
      if (m) setMinute(pad(Number(m)));
    }
  }, [time]);

  const apply = () => {
    setTime(`${pad(Number(hour))}:${pad(Number(minute))}`);
    setOpen(false);
  };

  const now = () => {
    const d = new Date();
    const h = pad(d.getHours());
    const m = pad(d.getMinutes());
    setHour(h); setMinute(m);
    setTime(`${h}:${m}`);
    setOpen(false);
  };

  const clear = () => {
    setHour('08'); setMinute('00');
    setTime(null);
    setOpen(false);
  };

  const hours = Array.from({length:24}, (_,i) => pad(i));
  const minutes = Array.from({length:12}, (_,i) => pad(i*5));

  return (
    <div className="relative">
      <Button variant="outline" className={cn("justify-start text-left font-normal", className)} onClick={() => setOpen(!open)} aria-label={time ? `Selected time ${time}` : placeholder}>
        <Clock className="mr-2 h-4 w-4" />
        {time ? time : <span className="text-muted-foreground">{placeholder}</span>}
      </Button>
      {open && (
        <div className="absolute top-full left-0 z-[100] w-auto p-3 bg-popover border rounded-md shadow-md">
          <div className="flex gap-2 mb-3">
            <Select value={hour} onValueChange={(v) => setHour(v)}>
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={minute} onValueChange={(v) => setMinute(v)}>
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {minutes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={clear}>Clear</Button>
            <Button variant="outline" size="sm" onClick={now}>Now</Button>
            <div className="flex-1" />
            <Button onClick={apply} size="sm">Apply</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export { TimePicker };
