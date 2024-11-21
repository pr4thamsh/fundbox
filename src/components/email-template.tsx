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
  Button,
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

  const formattedTicketPrice = (pricePerTicket / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "CAD",
  });

  return (
    <Html>
      <Head />
      <Preview>Thank you for supporting {fundraiserTitle}!</Preview>
      <Tailwind>
        <Body className="bg-gray-100 my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaec] rounded my-[40px] mx-auto p-[20px] w-[465px] bg-white">
            {/* Header */}
            <Section className="mt-8">
              <Heading className="text-2xl font-bold text-center text-gray-800">
                Order Confirmation
              </Heading>
              <Text className="text-gray-500 text-center mt-2">
                Order #{orderId}
              </Text>
            </Section>

            {/* Thank you message */}
            <Section className="mt-6">
              <Text className="text-gray-800 text-lg">
                Dear {supporterName},
              </Text>
              <Text className="text-gray-800 leading-6">
                Thank you for supporting <strong>{fundraiserTitle}</strong>.
                Your generosity makes a real difference!
              </Text>
            </Section>

            {/* Order Details */}
            <Section className="mt-6 bg-gray-50 rounded-lg p-6">
              <Heading className="text-lg font-semibold text-gray-800 mb-4">
                Order Details
              </Heading>
              <Row>
                <Column>
                  <Text className="text-gray-600">Number of Tickets:</Text>
                  <Text className="text-gray-600">Price per Ticket:</Text>
                  <Text className="text-gray-600 font-semibold mt-2">
                    Total Amount:
                  </Text>
                </Column>
                <Column className="text-right">
                  <Text className="text-gray-800">{ticketNumbers.length}</Text>
                  <Text className="text-gray-800">{formattedTicketPrice}</Text>
                  <Text className="text-gray-800 font-semibold mt-2">
                    {formattedAmount}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Ticket Numbers */}
            <Section className="mt-6">
              <Heading className="text-lg font-semibold text-gray-800 mb-4">
                Your Ticket Numbers
              </Heading>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  justifyContent: "center",
                }}
              >
                {ticketNumbers.map((number) => (
                  <div
                    key={number}
                    style={{
                      backgroundColor: "#f3f4f6",
                      borderRadius: "12px",
                      padding: "8px 16px",
                      fontSize: "14px",
                      color: "#374151",
                      fontWeight: 500,
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    #{number}
                  </div>
                ))}
              </div>
            </Section>

            {/* Next Steps */}
            <Section className="mt-8 border-t border-gray-200 pt-8">
              <Text className="text-gray-800 leading-6">
                The lucky draw will take place after the fundraiser ends.
                We&apos;ll notify you if you&apos;re a winner!
              </Text>
              <Button
                className="bg-blue-600 text-white rounded-lg py-3 px-6 text-center block w-full mt-6 font-medium"
                href="https://fundbox.live/explore"
              >
                Explore more Fundraisers
              </Button>
            </Section>

            {/* Footer */}
            <Section className="mt-8 text-center border-t border-gray-200 pt-8">
              <Text className="text-sm text-gray-500">
                This is an automated message, please do not reply.
              </Text>
              <Text className="text-sm text-gray-400 mt-2">
                © 2024 Fundbox. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
