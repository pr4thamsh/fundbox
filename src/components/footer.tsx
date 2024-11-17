import { Link } from "lucide-react";

export function Footer() {
  return (
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
  );
}
