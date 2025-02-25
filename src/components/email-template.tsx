import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
  Tailwind,
  Link,
} from "@react-email/components";
import * as React from "react";

interface OrderEmailProps {
  supporterName: string;
  fundraiserTitle: string;
  ticketNumbers: number[];
  amount: number;
  pricePerTicket: number;
  orderId: string;
}

export const OrderConfirmationEmail: React.FC<Readonly<OrderEmailProps>> = ({
  supporterName,
  fundraiserTitle,
  ticketNumbers,
  amount,
  pricePerTicket,
  orderId,
}) => {
  const formattedAmount = (amount / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "CAD",
  });

  return (
    <Html>
      <Head />
      <Preview>Thank you for supporting {fundraiserTitle}!</Preview>
      <Tailwind>
        <Body className="bg-gray-100 my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaec] rounded-lg my-[40px] mx-auto p-[32px] w-[500px] bg-white">
            {/* Logo or Brand */}
            <Section className="text-center mb-8">
              <Text className="text-2xl font-bold text-blue-600 m-0">
                Fundbox
              </Text>
            </Section>

            {/* Header */}
            <Section>
              <Heading className="text-2xl font-bold text-center text-gray-800 m-0">
                Order Confirmation
              </Heading>
              <Text className="text-gray-500 text-center mt-2 mb-0">
                Order #{orderId}
              </Text>
            </Section>

            {/* Thank you message */}
            <Section className="mt-8">
              <Text className="text-gray-800 text-lg mb-2">
                Dear {supporterName},
              </Text>
              <Text className="text-gray-800 leading-6 my-0">
                Thank you for supporting{" "}
                <span className="font-semibold text-blue-600">
                  {fundraiserTitle}
                </span>
                . Your generosity makes a real difference!
              </Text>
            </Section>

            {/* Order Details */}
            <Section className="mt-8 bg-gray-50 rounded-lg p-6">
              <Heading className="text-lg font-semibold text-gray-800 m-0 mb-4">
                Order Details
              </Heading>
              <Row>
                <Column>
                  <Text className="text-gray-600 my-1">Number of Tickets:</Text>
                  <Text className="text-gray-600 my-1">Price per Ticket:</Text>
                  <Text className="text-gray-600 font-semibold mt-4 mb-1">
                    Total Amount:
                  </Text>
                </Column>
                <Column className="text-right">
                  <Text className="text-gray-800 my-1">
                    {ticketNumbers.length}
                  </Text>
                  <Text className="text-gray-800 my-1">{pricePerTicket}</Text>
                  <Text className="text-gray-800 font-semibold mt-4 mb-1">
                    {formattedAmount}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Ticket Numbers */}
            <Section className="mt-8">
              <Heading className="text-lg font-semibold text-gray-800 m-0 mb-4">
                Your Ticket Numbers
              </Heading>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  justifyContent: "flex-start",
                  margin: "0 -4px",
                }}
              >
                {ticketNumbers.map((number) => (
                  <div
                    key={number}
                    style={{
                      backgroundColor: "#f0f9ff",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "14px",
                      color: "#1e40af",
                      fontWeight: 500,
                      border: "1px solid #bfdbfe",
                      margin: "4px",
                    }}
                  >
                    #{number}
                  </div>
                ))}
              </div>
            </Section>

            {/* Next Steps */}
            <Section
              className="mt-8 pt-8"
              style={{ borderTop: "1px solid #e5e7eb" }}
            >
              <Text className="text-gray-800 leading-6 m-0">
                The lucky draw will take place after the fundraiser ends.
                We&apos;ll notify you if you&apos;re a winner!
              </Text>

              <div
                style={{
                  textAlign: "center",
                  margin: "24px 0",
                }}
              >
                <Link
                  href="https://fundbox.live/explore"
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    padding: "12px 24px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: 500,
                    display: "inline-block",
                    textAlign: "center",
                    fontSize: "16px",
                  }}
                >
                  Explore More Fundraisers
                </Link>
              </div>
            </Section>

            {/* Footer */}
            <Section
              className="mt-8 text-center pt-8"
              style={{ borderTop: "1px solid #e5e7eb" }}
            >
              <Text className="text-sm text-gray-500 m-0">
                This is an automated message, please do not reply.
              </Text>
              <Text className="text-sm text-gray-400 mt-2 mb-0">
                © 2024 Fundbox. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
