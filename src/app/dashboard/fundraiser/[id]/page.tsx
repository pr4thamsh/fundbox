// src/app/dashboard/fundraiser/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CalendarDays, 
  Users, 
  DollarSign, 
  Timer,
  ArrowLeft,
  Pencil,
  Trash2,
  Save,
  X
} from "lucide-react";

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

export default function FundraiserPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [fundraiser, setFundraiser] = useState<Fundraiser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: ""
  });

  useEffect(() => {
    async function fetchFundraiser() {
      try {
        const response = await fetch(`/api/fundraiser?id=${params.id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        
        setFundraiser(data.data);
        setFormData({
          title: data.data.title,
          description: data.data.description,
          startDate: data.data.startDate,
          endDate: data.data.endDate
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to fetch fundraiser");
      } finally {
        setIsLoading(false);
      }
    }

    if (params.id) {
      fetchFundraiser();
    }
  }, [params.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/fundraiser?id=${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setFundraiser(data.data);
      setIsEditing(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update fundraiser");
    } finally {
      setIsLoading(false);
    }
  };

  async function handleDelete() {
    if (deleteConfirmation !== fundraiser?.title) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/fundraiser?id=${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      router.push("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to delete fundraiser");
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  }

  const fixDate = (dateString: string | null) => {
    if (!dateString) return new Date();
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date;
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;
  if (!fundraiser) return <div>Fundraiser not found</div>;

  const isActive = 
    fixDate(fundraiser.startDate) <= new Date() &&
    fixDate(fundraiser.endDate) >= new Date();

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
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Fundraiser
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Fundraiser</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the
                <span className="font-semibold"> {fundraiser.title} </span>
                fundraiser and all of its data.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Please type <span className="font-semibold">{fundraiser.title}</span> to confirm.
              </p>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type the fundraiser name"
                className="max-w-full"
              />
            </div>

            <DialogFooter>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteConfirmation !== fundraiser.title || isLoading}
              >
                {isLoading ? "Deleting..." : "I understand, delete this fundraiser"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-grow">
              {isEditing ? (
                <form onSubmit={handleUpdate} className="space-y-4 pr-4">
                  <div className="space-y-2">
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="text-2xl font-semibold"
                      required
                    />
                    <Input
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="text-muted-foreground"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit" disabled={isLoading}>
                      <Save className="h-4 w-4 mr-2" />
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          title: fundraiser.title,
                          description: fundraiser.description,
                          startDate: fundraiser.startDate,
                          endDate: fundraiser.endDate
                        });
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl">{fundraiser.title}</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription className="text-base">
                    {fundraiser.description}
                  </CardDescription>
                </>
              )}
            </div>
            {isActive && !isEditing && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-800/30 dark:text-green-500">
                Active
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">Start Date:</span>
                <span>{fixDate(fundraiser.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Timer className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">End Date:</span>
                <span>{fixDate(fundraiser.endDate).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">Tickets Sold:</span>
                <span>{fundraiser.ticketsSold ?? 0}</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">Funds Raised:</span>
                <span>${fundraiser.fundRaised ?? 0}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}