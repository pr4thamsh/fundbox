"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Trophy, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DatePicker } from "@/components/ui/date-picker-single";
import React from "react";
import { fixDate, formatDateForAPI } from "@/lib/date-utils";

type Prize = {
  id: number;
  drawDate: string;
  prize: string;
  fundraiserId: number;
};

interface PrizesProps {
  fundraiserId: number;
}

export function FundraiserPrizes({ fundraiserId }: PrizesProps) {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAddingPrize, setIsAddingPrize] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [prize, setPrize] = useState("");

  const fetchPrizes = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/draw/draw?fundraiserId=${fundraiserId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPrizes(data.data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch prizes");
    } finally {
      setIsLoading(false);
    }
  }, [fundraiserId]);

  useEffect(() => {
    fetchPrizes();
  }, [fetchPrizes]);

  async function handleAddPrize() {
    if (!selectedDate) {
      setError("Please select a draw date");
      return;
    }

    if (!prize) {
      setError("Please enter a prize description");
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/draw/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prize,
          drawDate: formatDateForAPI(selectedDate),
          fundraiserId,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setPrizes(prev => [...prev, data.data]);
      setIsAddingPrize(false);
      resetForm();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to add prize");
    } finally {
      setIsLoading(false);
    }
  }

  const resetForm = () => {
    setPrize("");
    setSelectedDate(undefined);
    setError("");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Prizes</h2>
        <Dialog 
          open={isAddingPrize} 
          onOpenChange={(open) => {
            setIsAddingPrize(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Prize
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Prize</DialogTitle>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Prize Description</label>
                <Input
                  value={prize}
                  onChange={e => setPrize(e.target.value)}
                  placeholder="Enter prize description"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Draw Date</label>
                <DatePicker
                  date={selectedDate}
                  onSelect={setSelectedDate}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleAddPrize} 
                disabled={isLoading || !prize || !selectedDate}
              >
                {isLoading ? "Adding..." : "Add Prize"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prizes.map(prize => (
          <Card key={prize.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <Trophy className="h-4 w-4 inline-block mr-2" />
                {prize.prize}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Draw Date: {fixDate(prize.drawDate).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading && !error && prizes.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          Loading prizes...
        </div>
      )}
      
      {!isLoading && !error && prizes.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No prizes added yet. Create one to get started.
        </div>
      )}
    </div>
  );
}