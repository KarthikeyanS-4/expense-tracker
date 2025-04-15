import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Feature card component for the landing page
const FeatureCard = ({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) => (
  <Card className="h-full shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out">
    <CardHeader>
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-primary/10 p-2 rounded-full">{icon}</div>
        <CardTitle className="text-xl relative after:absolute after:left-0 after:bottom-0 after:w-0 after:h-[2px] after:bg-current after:transition-all after:duration-300 hover:after:w-full">{title}</CardTitle>
      </div>
    </CardHeader>
    <CardContent>
      <CardDescription className="text-base">{description}</CardDescription>
    </CardContent>
  </Card>
);

const LandingPage: React.FC = () => {
  return (
    // Main container for the landing page
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header/Navigation */}
      <header className="border-b">
        <div className="mx-auto py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold pl-2">ExpenseTracker</h1>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="outline" className="cursor-pointer border-none relative after:absolute after:left-0 after:bottom-0 after:w-0 after:h-[2px] after:bg-current after:transition-all after:duration-300 hover:after:w-full">Log In</Button>
            </Link>
            <Link to="/signup">
              <Button variant="outline" className="cursor-pointer border-none relative after:absolute after:left-0 after:bottom-0 after:w-0 after:h-[2px] after:bg-current after:transition-all after:duration-300 hover:after:w-full">Sign Up</Button>
            </Link>
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-secondary/20 py-10">
        <div className="flex flex-col mx-auto text-center gap-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Take Control of Your Finances</h1>
          <p className="text-xl md:text-2xl text-center text-muted-foreground mb-10 max-w-screen mx-auto">
            Track expenses, set budgets, and achieve your financial goals with our simple and powerful expense tracking tool.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-10">
        <div className="grid justify-items-center mx-auto">
          <h2 className="text-3xl font-bold text-center pb-10">Features Designed for You</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 lg:px-10 gap-8">
            <FeatureCard
              title="Expense Tracking"
              description="Easily log your daily expenses and categorize them for better understanding of your spending habits."
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-receipt"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v.5"/><path d="M12 6v.5"/></svg>}
            />
            <FeatureCard
              title="Budget Management"
              description="Set monthly spending limits for each category and receive visual indicators when approaching your limits."
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wallet"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>}
            />
            <FeatureCard
              title="Visual Analytics"
              description="Understand your spending patterns with intuitive charts and graphs showing your financial activity."
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bar-chart-3"><path d="M3 3v18h18"/><path d="M8 17V9"/><path d="M12 17V7"/><path d="M16 17v-5"/></svg>}
            />
            <FeatureCard
              title="Secure Authentication"
              description="Your financial data is protected with robust user authentication and secure data storage."
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>}
            />
            <FeatureCard
              title="Category Management"
              description="Create custom categories that fit your lifestyle and financial organization needs."
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-tags"><path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5Z"/><path d="M6 9.01V9"/><path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19"/></svg>}
            />
            <FeatureCard
              title="Responsive Design"
              description="Access your expense tracker from any device - desktop, tablet, or mobile with our fully responsive interface."
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-smartphone"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 py-10">
        <div className="mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Managing Your Finances?</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-screen mx-auto">
            Join thousands of users who have taken control of their financial future with ExpenseTracker.
          </p>
          <Link to="/signup">
            <Button size="lg" className="text-lg px-8 cursor-pointer">Create Free Account</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t">
        <div className="mx-auto py-6">
          <div className="flex flex-col md:flex-row justify-around items-center">
            <p className="text-muted-foreground">© {new Date().getFullYear()} ExpenseTracker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;