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
import { Plus, Trophy } from "lucide-react";
import React from "react";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddingPrize, setIsAddingPrize] = useState(false);
  const [newPrize, setNewPrize] = useState({ prize: "", drawDate: "" });

  const fetchPrizes = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/draw?fundraiserId=${fundraiserId}`);
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
    setIsLoading(true);
    try {
      const response = await fetch("/api/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPrize,
          fundraiserId,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setPrizes(prev => [...prev, data.data]);
      setIsAddingPrize(false);
      setNewPrize({ prize: "", drawDate: "" });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to add prize");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Prizes</h2>
        <Dialog open={isAddingPrize} onOpenChange={setIsAddingPrize}>
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
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label>Prize Description</label>
                <Input
                  value={newPrize.prize}
                  onChange={e => setNewPrize(prev => ({ ...prev, prize: e.target.value }))}
                  placeholder="Enter prize description"
                />
              </div>
              <div className="space-y-2">
                <label>Draw Date</label>
                <Input
                  type="date"
                  value={newPrize.drawDate}
                  onChange={e => setNewPrize(prev => ({ ...prev, drawDate: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddPrize} disabled={isLoading}>
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
              <p className="text-sm text-muted-foreground">
                Draw Date: {new Date(prize.drawDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading && <div>Loading prizes...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!isLoading && !error && prizes.length === 0 && (
        <div className="text-center text-muted-foreground">
          No prizes added yet
        </div>
      )}
    </div>
  );
}