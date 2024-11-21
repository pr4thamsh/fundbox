"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CalendarDays, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAtom } from "jotai";
import { adminAtom } from "@/store/admin";
import TiptapEditor from "@/components/tiptap";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { DateRange } from "react-day-picker";
import {
  fixDate,
  formatDateForAPI,
  isActiveFundraiser,
} from "@/lib/date-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Fundraiser = {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  organizationId: number;
  ticketsSold?: number | null;
  fundRaised?: number | null;
};

export default function DashboardPage() {
  const [admin] = useAtom(adminAtom);
  const router = useRouter();
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    organizationId: admin?.organizationId,
    adminId: admin?.id,
    pricePerTicket: 0,
  });

  useEffect(() => {
    async function fetchFundraisers() {
      try {
        const response = await fetch(
          `/api/fundraiser?organizationId=${admin?.organizationId}`,
        );
        const data = await response.json();
        setFundraisers(data.data || []);
      } catch (error) {
        console.error("Failed to fetch fundraisers:", error);
      }
    }
    if (admin?.organizationId) {
      fetchFundraisers();
    }
  }, [admin?.organizationId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditorChange = (content: string) => {
    setFormData((prev) => ({
      ...prev,
      description: content,
    }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!dateRange?.from || !dateRange?.to) {
      setError("Please select start and end dates");
      setIsLoading(false);
      return;
    }

    const submitData = {
      ...formData,
      adminId: admin?.id,
      startDate: formatDateForAPI(dateRange.from),
      endDate: formatDateForAPI(dateRange.to),
    };

    try {
      const response = await fetch("/api/fundraiser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create fundraiser");
      }

      const fundraisersResponse = await fetch(
        `/api/fundraiser?organizationId=${admin?.organizationId}`,
      );
      const fundraisersData = await fundraisersResponse.json();
      setFundraisers(fundraisersData.data || []);

      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        organizationId: admin?.organizationId,
        adminId: admin?.id,
        pricePerTicket: 0,
      });
      setDateRange(undefined);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create fundraiser",
      );
    } finally {
      setIsLoading(false);
    }
  }

  const handleCardClick = (id: number) => {
    router.push(`/dashboard/fundraiser/${id}`);
  };

  return (
    <div className="space-y-6 p-6 pb-16">
      <div className="flex justify-between items-center">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome, {admin?.firstName}!
          </h2>
          <p className="text-muted-foreground">
            Manage your fundraising campaigns and track their progress
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!admin?.organizationId}>
              <Plus className="mr-2 h-4 w-4" />
              Create Fundraiser
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Create Fundraiser</DialogTitle>
              <DialogDescription>
                Create a new fundraising campaign for your organization
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={onSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter fundraiser title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <TiptapEditor
                  onChange={handleEditorChange}
                  initialContent={formData.description}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Campaign Duration</label>
                <DatePickerWithRange
                  className="w-full"
                  date={dateRange}
                  onSelect={setDateRange}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="pricePerTicket" className="text-sm font-medium">
                  Price Per Ticket
                </label>
                <Input
                  id="pricePerTicket"
                  name="pricePerTicket"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter the price per ticket"
                  value={formData.pricePerTicket}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Fundraiser"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fundraisers.map((fundraiser) => (
          <Tooltip key={fundraiser.id}>
            <TooltipTrigger asChild>
              <Card
                className="flex flex-col cursor-pointer transition-colors border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => handleCardClick(fundraiser.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start space-x-4">
                    <CardTitle className="text-xl">
                      {fundraiser.title}
                    </CardTitle>
                    {isActiveFundraiser(
                      fundraiser.startDate,
                      fundraiser.endDate,
                    ) && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-800/30 dark:text-green-500">
                        Active
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <CalendarDays className="h-5 w-5 text-muted-foreground" />
                      <span className="text-muted-foreground">Start:</span>
                      <span>
                        {fixDate(fundraiser.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Timer className="h-5 w-5 text-muted-foreground" />
                      <span className="text-muted-foreground">End:</span>
                      <span>
                        {fixDate(fundraiser.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="bg-black text-white">
              <p>Edit</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {fundraisers.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-8">
            No fundraisers found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
