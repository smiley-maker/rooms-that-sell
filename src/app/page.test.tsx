import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home page", () => {
  it("renders without crashing", () => {
    render(<Home />);
    
    // Check that the page renders without errors
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    
    // Check for multiple sections
    const headings = screen.getAllByRole("heading");
    expect(headings.length).toBeGreaterThan(3);
    
    // Check for interactive elements
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });
});
