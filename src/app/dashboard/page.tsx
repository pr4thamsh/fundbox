"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Fundraiser = {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  organizationId: number;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    organizationId: 1,
    adminId: user?.id
  });

  useEffect(() => {
    fetchFundraisers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const submitData = {
      ...formData,
      adminId: user?.id
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

      await fetchFundraisers();
      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        organizationId: 1,
        adminId: user?.id
      });

    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create fundraiser");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchFundraisers() {
    try {
      const response = await fetch("/api/fundraiser");
      const data = await response.json();
      setFundraisers(data.data || []);
    } catch (error) {
      console.error("Failed to fetch fundraisers:", error);
    }
  }

  return (
    <div className="space-y-6 p-6 pb-16">
      <div className="flex justify-between items-center">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Welcome, {user?.user_metadata.first_name}!</h2>
          <p className="text-muted-foreground">Manage your fundraising campaigns and track their progress</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Fundraiser
            </Button>
          </DialogTrigger>
          <DialogContent>
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
                <label htmlFor="title" className="text-sm font-medium">Title</label>
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
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Enter description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="startDate" className="text-sm font-medium">Start Date</label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="endDate" className="text-sm font-medium">End Date</label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Fundraiser"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fundraisers.map((fundraiser) => {
          // Add timezone offset when creating Date objects for display
          const fixDate = (dateString: string | null) => {
            if (!dateString) return new Date();
            const date = new Date(dateString);
            date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
            return date;
          };

          const isActive =
            fixDate(fundraiser.startDate) <= new Date() &&
            fixDate(fundraiser.endDate) >= new Date();

          return (
            <Card key={fundraiser.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{fundraiser.title}</CardTitle>
                  {isActive && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-800/30 dark:text-green-500">
                      Active
                    </span>
                  )}
                </div>
                <CardDescription className="line-clamp-2">{fundraiser.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Start Date: {fixDate(fundraiser.startDate).toLocaleDateString()}</p>
                  <p>End Date: {fixDate(fundraiser.endDate).toLocaleDateString()}</p>
                </div>
              </CardContent>
              <CardFooter className="justify-end border-t pt-4">
                <Button variant="outline" size="sm">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </CardFooter>
            </Card>
          );
        })}
        {fundraisers.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-8">
            No fundraisers found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
}