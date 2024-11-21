import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Trophy, Calendar, Ticket, Eye } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React from "react";
import { fixDate } from "@/lib/date-utils";

type Draw = {
  id: number;
  drawDate: string;
  prize: string;
  fundraiserId: number;
  supporterId: number | null;
};

type Winner = {
  supporterId: number;
  firstName: string;
  lastName: string;
  email: string;
  ticketNumber: number;
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
  const [pickingWinnerIds, setPickingWinnerIds] = useState<number[]>([]);
  const [selectedWinner, setSelectedWinner] = useState<Winner | null>(null);
  const [isWinnerDialogOpen, setIsWinnerDialogOpen] = useState(false);
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
    setError("");
    setPickingWinnerIds((prev) => [...prev, draw.id]);

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

      // Show winner information immediately
      if (data.data?.winner) {
        setSelectedWinner(data.data.winner);
        setIsWinnerDialogOpen(true);
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
      setPickingWinnerIds((prev) => prev.filter((id) => id !== draw.id));
    }
  };

  const handleViewWinner = async (drawId: number) => {
    try {
      const response = await fetch(`/api/draw/winner/${drawId}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      if (data.data?.winner) {
        setSelectedWinner(data.data.winner);
        setIsWinnerDialogOpen(true);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch winner details",
      );
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
              <div className="flex gap-2">
                {draw.supporterId ? (
                  <Button
                    onClick={() => handleViewWinner(draw.id)}
                    className="w-full"
                    variant="outline"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Winner
                  </Button>
                ) : (
                  <Button
                    onClick={() => handlePickWinner(draw)}
                    disabled={
                      !isDrawDate(draw.drawDate) ||
                      !!draw.supporterId ||
                      pickingWinnerIds.includes(draw.id)
                    }
                    className="w-full"
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    {pickingWinnerIds.includes(draw.id)
                      ? "Picking Winner..."
                      : "Pick Winner"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isWinnerDialogOpen} onOpenChange={setIsWinnerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Winner Information</DialogTitle>
          </DialogHeader>
          {selectedWinner && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Name
                  </p>
                  <p>
                    {selectedWinner.firstName} {selectedWinner.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Email
                  </p>
                  <p className="break-all">{selectedWinner.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Winning Ticket #
                  </p>
                  <p className="font-mono">{selectedWinner.ticketNumber}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
