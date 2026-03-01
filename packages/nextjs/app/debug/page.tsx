import { DebugContracts } from "./_components/DebugContracts";
import type { NextPage } from "next";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";
import { Wrench, Code, Database } from "lucide-react";

export const metadata = getMetadata({
  title: "Debug Contracts",
  description: "Debug your deployed 🏗 Scaffold-ETH 2 contracts in an easy way",
});

const Debug: NextPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="relative pt-20 pb-16 overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent -z-10" />
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6">
            <Wrench className="h-3 w-3" />
            <span>CONTRACT DEBUGGING</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            Debug <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">Contracts</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-10">
            Interact with your deployed smart contracts directly from the browser. Test functions, read state, and debug with ease.
          </p>
        </div>
      </section>

      {/* Features Ribbon */}
      <section className="bg-card/50 border-b backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Code className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Smart Contract UI</p>
                <p className="text-[10px] text-muted-foreground">Auto-generated interfaces</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Real-time Data</p>
                <p className="text-[10px] text-muted-foreground">Live contract state</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Easy Testing</p>
                <p className="text-[10px] text-muted-foreground">No coding required</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Debug Contracts */}
      <DebugContracts />
      
      {/* Footer Info */}
      <section className="bg-card/30 border-t">
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold mb-4">How to Use</h2>
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 text-left">
            <div className="space-y-2">
              <h3 className="font-semibold text-primary">1. Select Contract</h3>
              <p className="text-sm text-muted-foreground">
                Choose from your deployed contracts using the tabs above.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-primary">2. Read State</h3>
              <p className="text-sm text-muted-foreground">
                View current contract state and call read-only functions.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-primary">3. Write Functions</h3>
              <p className="text-sm text-muted-foreground">
                Execute transactions and modify contract state safely.
              </p>
            </div>
          </div>
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Tip:</strong> All contract interactions are automatically connected to your wallet. 
              Make sure you're on the correct network before executing transactions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Debug;
