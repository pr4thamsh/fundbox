"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays, Clock, Ticket, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

// Example fundraiser data - replace with your API call
const exampleFundraiser = {
  id: 1,
  title: "Clean Ocean Initiative",
  description:
    "Help us clean the oceans and protect marine life. Every donation counts towards making our oceans cleaner and safer for all. Our initiative focuses on removing plastic waste, supporting marine life rehabilitation, and educating coastal communities about sustainable practices.\n\nYour support will help us:\n- Remove tons of plastic from our oceans\n- Rehabilitate affected marine animals\n- Conduct educational programs\n- Support local cleanup initiatives",
  startDate: "2024-11-01",
  endDate: "2024-12-31",
  organizationId: 1,
  organizationName: "Ocean Conservation Society",
  organizationLocation: "Vancouver, BC",
  totalRaised: 15000,
  ticketsSold: 124,
  ticketPrice: 50,
  status: "active",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function FundraiserPage() {
  const [ticketQuantity, setTicketQuantity] = useState(1);

  const handleQuantityChange = (value: string) => {
    const quantity = parseInt(value);
    if (!isNaN(quantity) && quantity > 0 && quantity <= 10) {
      setTicketQuantity(quantity);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid gap-8 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {exampleFundraiser.title}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>by {exampleFundraiser.organizationName}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {format(new Date(exampleFundraiser.startDate), "MMM d, yyyy")} -{" "}
                {format(new Date(exampleFundraiser.endDate), "MMM d, yyyy")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {Math.ceil(
                  (new Date(exampleFundraiser.endDate).getTime() -
                    new Date().getTime()) /
                    (1000 * 60 * 60 * 24),
                )}{" "}
                days left
              </span>
            </div>
            <Badge variant="secondary">
              {exampleFundraiser.status.charAt(0).toUpperCase() +
                exampleFundraiser.status.slice(1)}
            </Badge>
          </div>

          <Separator />

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">About this Fundraiser</h2>
            <div className="prose dark:prose-invert max-w-none">
              {exampleFundraiser.description
                .split("\n")
                .map((paragraph, index) => (
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
                <CardTitle>{exampleFundraiser.organizationName}</CardTitle>
                <CardDescription>
                  {exampleFundraiser.organizationLocation}
                </CardDescription>
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
                  {formatCurrency(exampleFundraiser.totalRaised)}
                </div>
                <p className="text-sm text-muted-foreground">Total Raised</p>
              </div>

              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-muted-foreground" />
                <span>
                  {exampleFundraiser.ticketsSold.toLocaleString()} tickets sold
                </span>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Buy Tickets</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Price per ticket:</span>
                    <span>{formatCurrency(exampleFundraiser.ticketPrice)}</span>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={ticketQuantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                  />
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>
                      {formatCurrency(
                        exampleFundraiser.ticketPrice * ticketQuantity,
                      )}
                    </span>
                  </div>
                  <Button className="w-full">Buy Tickets</Button>
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
