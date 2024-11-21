"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Ticket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

interface PaymentSuccess {
  fundraiser: {
    id: number;
    title: string;
  };
  payment: {
    id: string;
    amount: number;
    created: string;
  };
  tickets: {
    quantity: number;
    ticketNumbers: string[];
  };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SuccessPage() {
  const [paymentDetails, setPaymentDetails] = useState<PaymentSuccess | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const searchParams = useSearchParams();
  const paymentIntent = searchParams?.get("payment_intent");

  useEffect(() => {
    const getPaymentDetails = async () => {
      try {
        const response = await fetch(
          `/api/stripe/payment-success?payment_intent=${paymentIntent}&fundraiser_id=${params?.id}`,
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch payment details");
        }

        setPaymentDetails(data);

        try {
          const emailResponse = await fetch("/api/emails/process", {
            method: "GET",
          });

          if (!emailResponse.ok) {
            console.error("Failed to trigger email processing");
          } else {
            console.log("✉️ Email processing triggered successfully");
          }
        } catch (emailError) {
          console.error("Error triggering email processing:", emailError);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (paymentIntent) {
      getPaymentDetails();
    }
  }, [paymentIntent, params?.id]);

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto py-16 px-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">
                Loading payment details...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !paymentDetails) {
    return (
      <div className="container max-w-2xl mx-auto py-16 px-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-2 text-destructive">
              <p>Error: {error || "Payment details not found"}</p>
              <Button asChild>
                <Link href={`/fundraiser/${params?.fundraiserId}`}>
                  Return to Fundraiser
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-16 px-4">
      <Card>
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order Details */}
          <div className="space-y-4">
            <h3 className="font-semibold">Order Details</h3>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment ID</span>
                <span className="font-medium">{paymentDetails.payment.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {new Date(paymentDetails.payment.created).toDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fundraiser</span>
                <span className="font-medium">
                  {paymentDetails.fundraiser.title}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Ticket Details */}
          <div className="space-y-4">
            <h3 className="font-semibold">Ticket Details</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Ticket className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {paymentDetails.tickets.quantity} Tickets
                </span>
              </div>
              <span className="font-medium">
                ${formatCurrency(paymentDetails.payment.amount / 100)}
              </span>
            </div>
          </div>

          {/* Ticket Numbers */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Ticket Numbers</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {paymentDetails.tickets.ticketNumbers.map((number) => (
                <div
                  key={number}
                  className="bg-background p-2 rounded text-center text-sm font-mono"
                >
                  {number}
                </div>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <Button asChild className="w-full">
            <Link href={`/fundraiser/${params?.id}`}>
              Back to Fundraiser
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
