import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Trophy, Calendar, Ticket, Eye, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fixDate } from "@/lib/date-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import React from "react";

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

export default function FundraiserDraws({
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

  const isDrawInFuture = (drawDate: string) => {
    const fixedDate = fixDate(drawDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    fixedDate.setHours(0, 0, 0, 0);
    return fixedDate > now;
  };

  const formatDrawDate = (drawDate: string) => {
    const date = fixDate(drawDate);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handlePickWinner = async (draw: Draw) => {
    setError("");

    if (isDrawInFuture(draw.drawDate)) {
      setError(
        "This draw can only be processed on or after its scheduled date.",
      );
      return;
    }

    setPickingWinnerIds((prev) => [...prev, draw.id]);

    try {
      const response = await fetch("/api/draw/winner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drawId: draw.id }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to pick winner");

      if (data.data?.winner) {
        setSelectedWinner(data.data.winner);
        setIsWinnerDialogOpen(true);
      }

      await fetchDraws();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to pick winner";
      setError(
        message.includes("No tickets found")
          ? "No tickets available for this draw. Ensure tickets have been purchased."
          : message.includes("Draw can only be processed")
          ? "This draw can only be processed on its scheduled date."
          : message,
      );
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

  if (isLoading && !error && draws.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading draws...</p>
        </div>
      </div>
    );
  }

  if (!isLoading && !error && draws.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
          <Trophy className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            No draws available yet.
            <br />
            Add prizes first to enable draws.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="animate-in fade-in-0">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {draws.map((draw) => (
          <Card key={draw.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                {draw.prize}
              </CardTitle>
              <Badge
                variant={draw.supporterId ? "default" : "secondary"}
                className="ml-2"
              >
                {draw.supporterId ? "Winner Selected" : "Pending"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDrawDate(draw.drawDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                  <span>{safeTicketCount.toLocaleString()} tickets</span>
                </div>
              </div>

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
                    isDrawInFuture(draw.drawDate) ||
                    !!draw.supporterId ||
                    pickingWinnerIds.includes(draw.id)
                  }
                  className="w-full"
                >
                  {pickingWinnerIds.includes(draw.id) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Picking Winner...
                    </>
                  ) : (
                    <>
                      <Gift className="h-4 w-4 mr-2" />
                      Pick Winner
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isWinnerDialogOpen} onOpenChange={setIsWinnerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Winner Information
            </DialogTitle>
          </DialogHeader>
          {selectedWinner && (
            <div className="space-y-6">
              <div className="grid gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Name
                  </p>
                  <p className="font-medium mt-1">
                    {selectedWinner.firstName} {selectedWinner.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Email
                  </p>
                  <p className="font-medium mt-1 break-all">
                    {selectedWinner.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Winning Ticket
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Ticket className="h-4 w-4 text-primary" />
                    <p className="font-mono text-lg font-semibold">
                      #{selectedWinner.ticketNumber}
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setIsWinnerDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
