import { Dashboard } from "./components/dashboard/Dashboard";
import { ModeToggle } from "./components/ui/theme-toggle";

function App() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="border-b">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Crypto Dashboard
                    </h1>
                    <ModeToggle />
                </div>
            </header>
            <main className="container mx-auto p-4 md:p-8">
                <Dashboard />
            </main>
        </div>
    );
}

export default App;
