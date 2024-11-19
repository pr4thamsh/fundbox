"use client";
import { useState, useEffect } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Search, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Organization } from "@/db/schema/organization";
import { useAtom } from "jotai";
import { adminAtom } from "@/store/admin";

const createOrgSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  street: z.string().min(1, "Street address is required"),
  postalCode: z.string().min(6, "Please enter a valid postal code"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
});

export default function OrganizationPage() {
  const [open, setOpen] = useState(false);
  const [admin] = useAtom(adminAtom);
  const [searchValue, setSearchValue] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [currentOrganization, setCurrentOrganization] =
    useState<Organization | null>(null);

  const form = useForm<z.infer<typeof createOrgSchema>>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: "",
      street: "",
      postalCode: "",
      state: "",
      city: "",
    },
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (admin?.organizationId) {
      fetchCurrentOrganization(admin.organizationId);
    }
  }, [admin?.organizationId]);

  async function fetchCurrentOrganization(orgId: number) {
    try {
      const response = await fetch(`/api/organization?id=${orgId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch organization details");
      }
      const data = await response.json();
      setCurrentOrganization(data.data);
    } catch (error) {
      console.error("Error fetching organization details:", error);
    }
  }

  async function fetchOrganizations() {
    setIsFetching(true);
    setFetchError("");

    try {
      const response = await fetch("/api/organization");
      if (!response.ok) {
        throw new Error("Failed to fetch organizations");
      }
      const data = await response.json();
      setOrganizations(data.data || []);
    } catch (error) {
      setFetchError("Failed to load organizations");
      console.error("Fetch error:", error);
    } finally {
      setIsFetching(false);
    }
  }

  async function onJoinOrg(selectedOrg: number) {
    if (!selectedOrg) return;
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/update?id=${admin?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: selectedOrg,
        }),
      });

      if (!response.ok) {
        const { message, error } = await response.json();
        console.log(error, message);
        throw new Error("Failed to join");
      }
    } catch (error) {
      setError("Failed to join organization");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function onCreateOrg(values: z.infer<typeof createOrgSchema>) {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/organization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          street: values.street,
          postalCode: values.postalCode,
          city: values.city,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create organization");
      }
      const { data } = await response.json();

      await onJoinOrg(data.id);
      form.reset();
    } catch (error) {
      setError("Failed to create organization");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  if (admin?.organizationId && currentOrganization) {
    return (
      <div className="space-y-6 p-6 pb-16">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Organizations</h2>
          <p className="text-muted-foreground">
            Your current organization details and membership information
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Building2 className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Current Organization</CardTitle>
                <CardDescription>
                  You are a member of this organization
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  {currentOrganization.name}
                </h3>
                <div className="text-sm text-muted-foreground">
                  <p>{currentOrganization.street}</p>
                </div>
              </div>
              <Alert>
                <AlertDescription>
                  You are currently an active member of{" "}
                  {currentOrganization.name}. If you need to change
                  organizations, please contact your administrator.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 pb-16">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Organizations</h2>
        <p className="text-muted-foreground">
          Join an existing organization or create a new one to start managing
          fundraisers
        </p>
      </div>

      <Tabs defaultValue="join" className="space-y-6">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="join">Join Organization</TabsTrigger>
          <TabsTrigger value="create">Create Organization</TabsTrigger>
        </TabsList>

        <TabsContent value="join" className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {fetchError && (
            <Alert variant="destructive">
              <AlertDescription>{fetchError}</AlertDescription>
            </Alert>
          )}

          <div className="relative">
            <div className="w-full">
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                onClick={() => setOpen(!open)}
                disabled={isFetching}
              >
                <span className="truncate">
                  {selectedOrg
                    ? organizations.find((org) => org.id === selectedOrg)?.name
                    : isFetching
                    ? "Loading organizations..."
                    : "Select organization..."}
                </span>
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </div>
            {open && (
              <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                <div className="p-2">
                  <Input
                    placeholder="Search organizations..."
                    className="h-9"
                    onChange={(e) => setSearchValue(e.target.value)}
                    value={searchValue}
                  />
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {organizations
                    .filter((org) =>
                      org.name
                        .toLowerCase()
                        .includes(searchValue.toLowerCase()),
                    )
                    .map((org) => (
                      <div
                        key={org.id}
                        className="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                        onClick={() => {
                          setSelectedOrg(org.id);
                          setOpen(false);
                          setSearchValue("");
                        }}
                      >
                        {org.name}
                      </div>
                    ))}
                  {organizations.filter((org) =>
                    org.name.toLowerCase().includes(searchValue.toLowerCase()),
                  ).length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No organizations found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedOrg && (
            <div className="space-y-4">
              <div className="rounded-md border p-4 bg-muted/50">
                <h3 className="font-medium">
                  {organizations.find((org) => org.id === selectedOrg)?.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {organizations.find((org) => org.id === selectedOrg)?.street},{" "}
                  {
                    organizations.find((org) => org.id === selectedOrg)
                      ?.postalCode
                  }
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() => onJoinOrg(selectedOrg)}
                disabled={isLoading}
              >
                {isLoading ? "Joining..." : "Join Organization"}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onCreateOrg)}
              className="space-y-4"
            >
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter organization name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter street address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter city" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter state" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter postal code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Organization"}
              </Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
