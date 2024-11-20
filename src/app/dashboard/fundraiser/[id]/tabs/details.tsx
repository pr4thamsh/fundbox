"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type Fundraiser } from "../page";
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
import {
  CalendarDays,
  Users,
  DollarSign,
  Timer,
  Pencil,
  Trash2,
  Save,
  X,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { DateRange } from "react-day-picker";
import TiptapEditor from "@/components/tiptap";
import {
  fixDate,
  formatDateForAPI,
  isActiveFundraiser,
} from "@/lib/date-utils";

interface DetailsProps {
  fundraiser: Fundraiser;
  setFundraiser: (fundraiser: Fundraiser) => void;
}

export function FundraiserDetails({ fundraiser, setFundraiser }: DetailsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: fixDate(fundraiser.startDate),
    to: fixDate(fundraiser.endDate),
  });
  const [formData, setFormData] = useState({
    title: fundraiser.title,
    description: fundraiser.description,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (error) setError("");
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

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!dateRange?.from || !dateRange?.to) {
      setError("Please select start and end dates");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/fundraiser?id=${fundraiser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          startDate: formatDateForAPI(dateRange.from),
          endDate: formatDateForAPI(dateRange.to),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setFundraiser(data.data);
      setIsEditing(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update fundraiser",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (deleteConfirmation !== fundraiser.title) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/fundraiser?id=${fundraiser.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      router.push("/dashboard");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete fundraiser",
      );
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
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
                    <div className="min-h-[200px]">
                      <TiptapEditor
                        onChange={handleEditorChange}
                        initialContent={formData.description}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Campaign Duration
                    </label>
                    <DatePickerWithRange
                      className="w-full"
                      date={dateRange}
                      onSelect={handleDateRangeSelect}
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
                        });
                        setDateRange({
                          from: fixDate(fundraiser.startDate),
                          to: fixDate(fundraiser.endDate),
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
                    <CardTitle className="text-2xl">
                      {fundraiser.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsEditing(true)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Dialog
                        open={isDeleteDialogOpen}
                        onOpenChange={setIsDeleteDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Fundraiser</DialogTitle>
                            <DialogDescription>
                              This action cannot be undone. This will
                              permanently delete the
                              <span className="font-semibold">
                                {" "}
                                {fundraiser.title}{" "}
                              </span>
                              fundraiser and all of its data.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4 py-4">
                            <p className="text-sm text-muted-foreground">
                              Please type{" "}
                              <span className="font-semibold">
                                {fundraiser.title}
                              </span>{" "}
                              to confirm.
                            </p>
                            <Input
                              value={deleteConfirmation}
                              onChange={(e) =>
                                setDeleteConfirmation(e.target.value)
                              }
                              placeholder="Type the fundraiser name"
                              className="max-w-full"
                            />
                          </div>

                          <DialogFooter>
                            <Button
                              variant="destructive"
                              onClick={handleDelete}
                              disabled={
                                deleteConfirmation !== fundraiser.title ||
                                isLoading
                              }
                            >
                              {isLoading ? "Deleting..." : "Delete Fundraiser"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <CardDescription className="text-base">
                    <div
                      className="prose dark:prose-invert"
                      dangerouslySetInnerHTML={{
                        __html: fundraiser.description,
                      }}
                    />
                  </CardDescription>
                </>
              )}
            </div>
            {isActiveFundraiser(fundraiser.startDate, fundraiser.endDate) &&
              !isEditing && (
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
                <span>
                  {fixDate(fundraiser.startDate).toLocaleDateString()}
                </span>
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
