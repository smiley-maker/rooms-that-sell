import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home page", () => {
  it("renders the landing hero", () => {
    render(<Home />);
    expect(screen.getByText(/rooms that sell/i)).toBeInTheDocument();
  });
});
