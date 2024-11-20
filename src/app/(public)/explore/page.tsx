"use client";

import { useState, useEffect } from "react";
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
import { Fundraiser } from "@/db/schema/fundraisers";

function formatCurrency(amount: number | null) {
  if (amount === null) return "0";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveFundraisers = async () => {
      try {
        const response = await fetch("/api/fundraiser?active=true");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch fundraisers");
        }

        setFundraisers(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchActiveFundraisers();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p>Loading fundraisers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 text-center text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  const filteredFundraisers = fundraisers.filter(
    (fundraiser) =>
      fundraiser.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fundraiser.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const sortedFundraisers = [...filteredFundraisers].sort((a, b) => {
    switch (sortBy) {
      case "recent":
        return (
          new Date(b.startDate || "").getTime() -
          new Date(a.startDate || "").getTime()
        );
      case "endingSoon":
        return (
          new Date(a.endDate || "").getTime() -
          new Date(b.endDate || "").getTime()
        );
      case "mostRaised":
        return (b.fundRaised || 0) - (a.fundRaised || 0);
      case "mostTickets":
        return (b.ticketsSold || 0) - (a.ticketsSold || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header Section */}
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Active Fundraisers
        </h1>
        <p className="text-muted-foreground">
          Discover and support ongoing fundraisers in your community
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
          <p className="text-muted-foreground">No active fundraisers found</p>
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
                        by Organization {fundraiser.organizationId}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <p
                    className="text-sm text-muted-foreground line-clamp-3 mb-4 prose dark:prose-invert truncate"
                    dangerouslySetInnerHTML={{
                      __html: fundraiser.description as string,
                    }}
                  ></p>
                  <div className="text-sm font-medium">
                    Funds Raised: $
                    {formatCurrency((fundraiser.fundRaised || 0) / 100)}
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-6">
                  <div className="flex justify-between items-center w-full text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Ticket className="mr-1 h-4 w-4" />
                      {(fundraiser.ticketsSold || 0).toLocaleString()} tickets
                      sold
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="mr-1 h-4 w-4" />
                      {format(
                        new Date(fundraiser.endDate || ""),
                        "MMM d, yyyy",
                      )}
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
