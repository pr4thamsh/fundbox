"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Trophy, Calendar, Ticket } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import React from "react";
import { fixDate } from "@/lib/date-utils";

type Draw = {
  id: number;
  drawDate: string;
  prize: string;
  fundraiserId: number;
  supporterId: number | null;
};

interface DrawsProps {
  fundraiserId: number;
  totalTickets: number | null | undefined;
}

export function FundraiserDraws({
  fundraiserId,
  totalTickets = 0,
}: DrawsProps) {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPickingWinner, setIsPickingWinner] = useState(false);
  const safeTicketCount = totalTickets ?? 0;

  const fetchDraws = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/draw/draw?fundraiserId=${fundraiserId}`,
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setDraws(data.data || []);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch draws",
      );
    } finally {
      setIsLoading(false);
    }
  }, [fundraiserId]);

  useEffect(() => {
    fetchDraws();
  }, [fetchDraws]);

  const isDrawDate = (drawDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const draw = fixDate(drawDate);
    draw.setHours(0, 0, 0, 0);
    return draw.getTime() === today.getTime();
  };

  const handlePickWinner = async (draw: Draw) => {
    setIsPickingWinner(true);
    setError("");

    try {
      const response = await fetch("/api/draw/winner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drawId: draw.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to pick winner");
      }

      await fetchDraws(); // Refresh the draws list
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to pick winner";
      setError(message);

      if (message.includes("No tickets found")) {
        setError(
          "No tickets available for this draw. Ensure tickets have been purchased.",
        );
      } else if (message.includes("Draw can only be processed")) {
        setError("This draw can only be processed on its scheduled date.");
      }
    } finally {
      setIsPickingWinner(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {draws.map((draw) => (
          <Card key={draw.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <Trophy className="h-4 w-4 inline-block mr-2" />
                {draw.prize}
              </CardTitle>
              <Badge variant={draw.supporterId ? "default" : "outline"}>
                {draw.supporterId ? "Winner Selected" : "Pending"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Draw Date: {fixDate(draw.drawDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Ticket className="h-4 w-4" />
                  <span>Total Tickets: {safeTicketCount}</span>
                </div>
              </div>
              <Button
                onClick={() => handlePickWinner(draw)}
                disabled={
                  !isDrawDate(draw.drawDate) ||
                  !!draw.supporterId ||
                  isPickingWinner
                }
                className="w-full"
              >
                <Gift className="h-4 w-4 mr-2" />
                {isPickingWinner ? "Picking Winner..." : "Pick Winner"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading && !error && draws.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          Loading draws...
        </div>
      )}

      {!isLoading && !error && draws.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No draws available. Add prizes first to enable draws.
        </div>
      )}
    </div>
  );
}
