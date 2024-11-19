"use client";

import { useState } from "react";
import { Search, Clock, Ticket } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Example fundraiser data
const exampleFundraisers = [
  {
    id: 1,
    title: "Clean Ocean Initiative",
    description:
      "Help us clean the oceans and protect marine life. Every donation counts towards making our oceans cleaner and safer for all.",
    startDate: "2024-11-01",
    endDate: "2024-12-31",
    organizationId: 1,
    organizationName: "Ocean Conservation Society",
    totalRaised: 15000,
    ticketsSold: 124,
  },
  {
    id: 2,
    title: "Education for All",
    description:
      "Support underprivileged children's education. Provide books, supplies, and learning resources to those who need them most.",
    startDate: "2024-11-15",
    endDate: "2025-01-15",
    organizationId: 2,
    organizationName: "Future Bright Foundation",
    totalRaised: 28000,
    ticketsSold: 230,
  },
  {
    id: 3,
    title: "Green Energy Project",
    description:
      "Help us install solar panels in rural communities. Bringing sustainable energy to those who need it most.",
    startDate: "2024-11-10",
    endDate: "2025-02-28",
    organizationId: 3,
    organizationName: "Sustainable Future",
    totalRaised: 45000,
    ticketsSold: 312,
  },
];

// Function to format currency
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  // Filter fundraisers based on search query
  const filteredFundraisers = exampleFundraisers.filter(
    (fundraiser) =>
      fundraiser.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fundraiser.description
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      fundraiser.organizationName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  // Sort fundraisers based on selected option
  const sortedFundraisers = [...filteredFundraisers].sort((a, b) => {
    switch (sortBy) {
      case "recent":
        return (
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
      case "endingSoon":
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      case "mostRaised":
        return b.totalRaised - a.totalRaised;
      case "mostTickets":
        return b.ticketsSold - a.ticketsSold;
      default:
        return 0;
    }
  });

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header Section */}
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Explore Fundraisers
        </h1>
        <p className="text-muted-foreground">
          Discover and support meaningful causes in your community
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fundraisers..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="endingSoon">Ending Soon</SelectItem>
            <SelectItem value="mostRaised">Most Raised</SelectItem>
            <SelectItem value="mostTickets">Most Tickets Sold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Fundraisers Grid */}
      {sortedFundraisers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No fundraisers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedFundraisers.map((fundraiser) => (
            <Link
              href={`/fundraiser/${fundraiser.id}`}
              key={fundraiser.id}
              className="block transition-transform hover:scale-[1.02] duration-200"
            >
              <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="line-clamp-2">
                        {fundraiser.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        by {fundraiser.organizationName}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {fundraiser.description}
                  </p>
                  <div className="text-sm font-medium">
                    Funds Raised: {formatCurrency(fundraiser.totalRaised)}
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-6">
                  <div className="flex justify-between items-center w-full text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Ticket className="mr-1 h-4 w-4" />
                      {fundraiser.ticketsSold.toLocaleString()} tickets sold
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="mr-1 h-4 w-4" />
                      {format(new Date(fundraiser.endDate), "MMM d, yyyy")}
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
