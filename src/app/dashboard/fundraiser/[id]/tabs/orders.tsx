"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { formatDistance } from "date-fns";
import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "use-debounce";
import React from "react";

interface Order {
  orderId: number;
  amount: number;
  ticketNumbers: number[];
  paymentStatus: string;
  createdAt: string;
  supporterFirstName: string;
  supporterLastName: string;
  supporterEmail: string;
  supporterPhone: string;
  supporterStreet: string;
  supporterPostalCode: string;
}

interface OrdersTabProps {
  fundraiserId: number;
}

export default function OrdersTab({ fundraiserId }: OrdersTabProps) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page on new search
  }, 500);

  const {
    data: paginatedData,
    isLoading,
    isFetching,
  } = useQuery<{ orders: Order[]; total: number }>({
    queryKey: ["orders", fundraiserId, search, page],
    queryFn: async () => {
      const res = await fetch(
        `/api/orders/${fundraiserId}?${new URLSearchParams({
          search,
          page: page.toString(),
          pageSize: pageSize.toString(),
        })}`,
      );
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
  });

  const totalPages = paginatedData
    ? Math.ceil(paginatedData.total / pageSize)
    : 0;

  const toggleRow = useCallback((orderId: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchInput}
            onChange={handleSearchChange}
            className="pl-8"
          />
        </div>
        {isFetching && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating results...
          </div>
        )}
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Tickets</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline-block" />
                  Loading orders...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && paginatedData?.orders.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No orders found.
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              paginatedData?.orders.map((order) => (
                <React.Fragment key={order.orderId}>
                  <TableRow>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRow(order.orderId)}
                      >
                        {expandedRows.has(order.orderId) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>#{order.orderId}</TableCell>
                    <TableCell>
                      {order.supporterFirstName} {order.supporterLastName}
                    </TableCell>
                    <TableCell>${(order.amount / 100).toFixed(2)}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          order.paymentStatus === "succeeded"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      {formatDistance(new Date(order.createdAt), new Date(), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>{order.ticketNumbers.length}</TableCell>
                  </TableRow>
                  {expandedRows.has(order.orderId) && (
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={7}>
                        <div className="p-4">
                          <h4 className="font-medium mb-2">Customer Details</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Email
                              </p>
                              <p>{order.supporterEmail}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Phone
                              </p>
                              <p>{order.supporterPhone}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Address
                              </p>
                              <p>
                                {order.supporterStreet},{" "}
                                {order.supporterPostalCode}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Ticket Numbers
                              </p>
                              <p>{order.ticketNumbers.join(", ")}</p>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
