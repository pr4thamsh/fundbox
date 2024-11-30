"use client"

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
  const [status, setStatus] = useState("active");
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFundraisers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/fundraiser?status=${status}`);
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

    fetchFundraisers();
  }, [status]);

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

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "upcoming":
        return "secondary";
      case "past":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {status.charAt(0).toUpperCase() + status.slice(1)} Fundraisers
        </h1>
        <p className="text-muted-foreground">
          {status === "active"
            ? "Discover and support ongoing fundraisers in your community"
            : status === "upcoming"
            ? "Preview upcoming fundraising events"
            : "View past fundraising campaigns"}
        </p>
      </div>

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
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="past">Past</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredFundraisers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No {status} fundraisers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFundraisers.map((fundraiser) => (
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
                    <Badge variant={getBadgeVariant(status)} className="ml-2">
                      {status.charAt(0).toUpperCase() + status.slice(1)}
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
