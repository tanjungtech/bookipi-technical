// App.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "./App";
import axios from "axios";

// mock axios
vi.mock("axios");

describe("Flash Sale App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Initial UI loading", () => {
    render(<App />);
    expect(screen.getByText("Buy Now")).toBeInTheDocument();
  });

  it("fetches flashsale setup", async () => {
    const now = new Date();
    const opening = new Date(now.getTime() - 1000).toISOString(); // already started
    axios.get.mockResolvedValueOnce({
      data: {
        opening,
        preOpen: 0,
        stoppedAt: 60000,
        stock: 10,
        status: "active",
      },
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/units left/i)).toHaveTextContent("10 units left");
      expect(screen.getByText("Time left")).toBeInTheDocument();
    });
  });

  it("Enter username (alphanumeric formats)", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        opening: new Date().toISOString(),
        preOpen: 0,
        stoppedAt: 60000,
        stock: 5,
        status: "active",
      },
    });

    render(<App />);

    const input = await screen.findByPlaceholderText(/alphanumeric only/i);

    fireEvent.change(input, { target: { value: "user_123!" } });
    expect(input.value).toBe("user123")
  });

  it("submits purchase and shows success message", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        opening: new Date().toISOString(),
        preOpen: 0,
        stoppedAt: 60000,
        stock: 3,
        status: "active",
      },
    });

    axios.post.mockResolvedValueOnce({
      data: { status: "Successful", message: "Purchase successful" },
    });

    render(<App />);

    const input = await screen.findByPlaceholderText(/alphanumeric only/i);
    fireEvent.change(input, { target: { value: "buyer1" } });

    const button = screen.getByRole("button", { name: /buy now/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Purchase successful")).toBeInTheDocument();
    });
  });

  it("Check duplicate purchase", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        opening: new Date().toISOString(),
        preOpen: 0,
        stoppedAt: 60000,
        stock: 3,
        status: "active",
      },
    });

    axios.post.mockRejectedValueOnce({
      status: 400,
      response: { data: { status: "exists", message: "User already purchased" } },
    });

    render(<App />);

    const input = await screen.findByPlaceholderText(/alphanumeric only/i);
    fireEvent.change(input, { target: { value: "buyer1" } });

    const button = screen.getByRole("button", { name: /buy now/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("User already purchased")).toBeInTheDocument();
    });
  });
});
