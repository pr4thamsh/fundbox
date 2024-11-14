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
import { ModeToggle } from "@/components/mode-toggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="border-b">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            FundBox
          </Link>

          <div className="flex items-center gap-4">
            <ModeToggle />
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Register</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Fundraising Made Fun and Engaging
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with causes you care about through our unique lucky draw
            system. Support charities and get a chance to win exciting prizes.
          </p>
          <Button size="lg" className="text-lg px-8">
            Explore Fundraisers
          </Button>
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

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">About FundBox</h3>
              <p className="text-sm text-muted-foreground">
                A modern fundraising platform combining charitable giving with
                exciting lucky draws.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about">About Us</Link>
                </li>
                <li>
                  <Link href="/how-it-works">How It Works</Link>
                </li>
                <li>
                  <Link href="/fundraisers">Browse Fundraisers</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/contact">Contact Us</Link>
                </li>
                <li>
                  <Link href="/faq">FAQ</Link>
                </li>
                <li>
                  <Link href="/terms">Terms of Service</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Connect With Us</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Email: support@fundbox.com</li>
                <li>Phone: (555) 123-4567</li>
                <li>Location: Worldwide</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} FundBox. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
