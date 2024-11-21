"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { FundraiserDetails } from "./tabs/details";
import { FundraiserPrizes } from "./tabs/prizes";
import FundraiserDraws from "./tabs/draws";
import FundraiserOrders from "./tabs/orders";

export type Fundraiser = {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  organizationId: number;
  ticketsSold?: number | null;
  fundRaised?: number | null;
};

export default function FundraiserPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [fundraiser, setFundraiser] = useState<Fundraiser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchFundraiser() {
      try {
        const response = await fetch(`/api/fundraiser?id=${params.id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        setFundraiser(data.data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to fetch fundraiser",
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (params.id) {
      fetchFundraiser();
    }
  }, [params.id]);

  if (isLoading) return <div>Loading...</div>;
  if (error)
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  if (!fundraiser) return <div>Fundraiser not found</div>;

  return (
    <div className="space-y-6 p-6 pb-16">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="prizes">Prizes</TabsTrigger>
          <TabsTrigger value="draws">Draws</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <FundraiserDetails
            fundraiser={fundraiser}
            setFundraiser={setFundraiser}
          />
        </TabsContent>

        <TabsContent value="prizes">
          <FundraiserPrizes fundraiserId={fundraiser.id} />
        </TabsContent>

        <TabsContent value="draws">
          <FundraiserDraws
            fundraiserId={fundraiser.id}
            totalTickets={fundraiser.ticketsSold}
          />
        </TabsContent>

        <TabsContent value="orders">
          <FundraiserOrders fundraiserId={fundraiser.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
