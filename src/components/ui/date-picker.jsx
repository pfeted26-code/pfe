import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function DatePicker({
  date,
  setDate,
  placeholder = "Pick a date",
  className,
  disabled,
  fromDate,
  toDate,
  showTodayButton = true,
  showClearButton = true,
  ...props
}) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState(date ? date.getMonth() : new Date().getMonth());
  const [year, setYear] = React.useState(date ? date.getFullYear() : new Date().getFullYear());

  const handleSelect = (selectedDate) => {
    setDate(selectedDate);
    setOpen(false);
  };

  const handleToday = () => {
    setDate(new Date());
    setOpen(false);
  };

  const handleClear = () => {
    setDate(null);
    setOpen(false);
  };

  const handleYearChange = (newYear) => {
    setYear(parseInt(newYear));
  };

  const handleMonthChange = (newMonth) => {
    setMonth(parseInt(newMonth));
  };

  // Generate year options (1900 to current year + 10)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 11 }, (_, i) => 1900 + i);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              className
            )}
            disabled={disabled}
            aria-label={date ? `Selected date: ${format(date, "PPP")}` : placeholder}
            {...props}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0 z-[60] pointer-events-auto" align="start">
          <div className="p-3">
            {/* Year and Month selectors */}
            <div className="flex gap-2 mb-3">
              <Select value={month.toString()} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((monthName, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {monthName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={year.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              month={new Date(year, month)}
              onMonthChange={(newMonth) => {
                setMonth(newMonth.getMonth());
                setYear(newMonth.getFullYear());
              }}
              fromDate={fromDate}
              toDate={toDate}
              disabled={(date) => {
                if (fromDate && date < fromDate) return true;
                if (toDate && date > toDate) return true;
                return false;
              }}
              {...props}
            />

            {(showTodayButton || showClearButton) && (
              <div className="flex justify-between gap-2 mt-3 pt-3 border-t">
                {showTodayButton && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToday}
                    className="flex-1"
                    aria-label="Select today's date"
                  >
                    Today
                  </Button>
                )}
                {showClearButton && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    className="flex-1"
                    aria-label="Clear selected date"
                  >
                    Clear
                  </Button>
                )}
              </div>
            )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
