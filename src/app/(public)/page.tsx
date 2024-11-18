import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GiftIcon, HeartIcon, TicketIcon } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Fundraising Made Fun and Engaging
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with causes you care about through our unique lucky draw
            system. Support charities and get a chance to win exciting prizes.
          </p>
          <Link href="/explore">
            <Button size="lg" className="text-lg px-8">
              Explore Fundraisers
            </Button>
          </Link>
        </section>

        {/* Features Section */}
        <section className="grid md:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <HeartIcon className="w-10 h-10 mb-2 text-primary" />
              <CardTitle>Support Causes</CardTitle>
              <CardDescription>
                Contribute to various charitable organizations and make a
                difference
              </CardDescription>
            </CardHeader>
            <CardContent>
              Every donation helps create positive change in communities while
              giving you a chance to win
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <TicketIcon className="w-10 h-10 mb-2 text-primary" />
              <CardTitle>Lucky Draw System</CardTitle>
              <CardDescription>
                Purchase tickets for exciting prize draws
              </CardDescription>
            </CardHeader>
            <CardContent>
              Participate in multiple draws with transparent winner selection
              and amazing prizes
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <GiftIcon className="w-10 h-10 mb-2 text-primary" />
              <CardTitle>Win Prizes</CardTitle>
              <CardDescription>
                Get rewarded for your charitable contributions
              </CardDescription>
            </CardHeader>
            <CardContent>
              Stand a chance to win exclusive prizes while supporting causes you
              believe in
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
