"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  Clock,
  Ticket,
  Building2,
  Plus,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useParams } from "next/navigation";
import { Organization } from "@/db/schema/organization";

type FundraiserWithOrg = {
  id: number;
  title: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  ticketsSold: number | null;
  fundRaised: number | null;
  organizationId: number | null;
  adminId: string | null;
  pricePerTicket: number | null;
  organization: Organization;
};

function formatCurrency(amount: number | null) {
  if (!amount) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function FundraiserPage() {
  const params = useParams();
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [fundraiser, setFundraiser] = useState<FundraiserWithOrg | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFundraiser = async () => {
      try {
        const response = await fetch(`/api/fundraiser?id=${params?.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch fundraiser");
        }

        setFundraiser(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) {
      fetchFundraiser();
    }
  }, [params?.id]);

  const handleIncrement = () => {
    if (ticketQuantity < 100) {
      setTicketQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (ticketQuantity > 0) {
      setTicketQuantity((prev) => prev - 1);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8 px-4">Loading...</div>;
  }

  if (error || !fundraiser) {
    return (
      <div className="container mx-auto py-8 px-4">
        Error: {error || "Fundraiser not found"}
      </div>
    );
  }

  const daysLeft = Math.ceil(
    (new Date(fundraiser.endDate || "").getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid gap-8 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{fundraiser.title}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>by {fundraiser.organization.name}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {fundraiser.startDate &&
                  format(new Date(fundraiser.startDate), "MMM d, yyyy")}{" "}
                -{" "}
                {fundraiser.endDate &&
                  format(new Date(fundraiser.endDate), "MMM d, yyyy")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{daysLeft} days left</span>
            </div>
            <Badge variant="secondary">Active</Badge>
          </div>

          <Separator />

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">About this Fundraiser</h2>
            <div className="prose dark:prose-invert max-w-none">
              {fundraiser.description?.split("\n").map((paragraph, index) => (
                <p key={index} className="text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Organization Details</h2>
            <Card>
              <CardHeader>
                <CardTitle>{fundraiser.organization.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Learn more about our organization and our mission to make a
                  difference.
                </p>
                <Button variant="link" className="p-0 h-auto mt-2">
                  View Organization Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fundraiser Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-3xl font-bold">
                  {formatCurrency(fundraiser.fundRaised)}
                </div>
                <p className="text-sm text-muted-foreground">Total Raised</p>
              </div>

              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-muted-foreground" />
                <span>
                  {fundraiser.ticketsSold?.toLocaleString() || 0} tickets sold
                </span>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Buy Tickets</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Price per ticket:</span>
                    <span>{formatCurrency(fundraiser.pricePerTicket)}</span>
                  </div>

                  <div className="flex items-center justify-center space-x-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleDecrement}
                      disabled={ticketQuantity <= 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>

                    <div className="flex-1 text-center">
                      <span className="text-lg font-semibold">
                        {ticketQuantity}
                      </span>
                      <p className="text-sm text-muted-foreground">Tickets</p>
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleIncrement}
                      disabled={ticketQuantity >= 100}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>
                      {formatCurrency(
                        (fundraiser.pricePerTicket || 0) * ticketQuantity,
                      )}
                    </span>
                  </div>

                  <Button
                    className="w-full"
                    disabled={ticketQuantity === 0}
                    onClick={() => {
                      // Add your ticket purchase logic here
                      console.log(`Purchasing ${ticketQuantity} tickets`);
                    }}
                  >
                    {ticketQuantity === 0 ? "Select Tickets" : "Buy Tickets"}
                  </Button>

                  {ticketQuantity >= 100 && (
                    <p className="text-sm text-muted-foreground text-center">
                      Maximum 100 tickets per purchase
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Share</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Copy Link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
