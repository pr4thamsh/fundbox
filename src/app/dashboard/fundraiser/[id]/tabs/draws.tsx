"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Trophy } from "lucide-react";
import React from "react";

type Draw = {
  id: number;
  drawDate: string;
  prize: string;
  fundraiserId: number;
  supporterId: number | null;
};

interface DrawsProps {
  fundraiserId: number;
}

export function FundraiserDraws({ fundraiserId }: DrawsProps) {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDraws = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/draw?fundraiserId=${fundraiserId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setDraws(data.data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch draws");
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
    const draw = new Date(drawDate);
    draw.setHours(0, 0, 0, 0);
    return draw.getTime() === today.getTime();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {draws.map(draw => (
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
              <p className="text-sm text-muted-foreground">
                Draw Date: {new Date(draw.drawDate).toLocaleDateString()}
              </p>
              <Button 
                disabled={!isDrawDate(draw.drawDate) || !!draw.supporterId}
                className="w-full"
              >
                <Gift className="h-4 w-4 mr-2" />
                Pick Winner
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading && <div>Loading draws...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!isLoading && !error && draws.length === 0 && (
        <div className="text-center text-muted-foreground">
          No draws available
        </div>
      )}
    </div>
  );
}