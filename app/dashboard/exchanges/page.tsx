import { ExchangeSelector } from "@/components/exchange-selector"

export default function ExchangesPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Exchange Connections</h1>
        <p className="text-gray-400">Connect your cryptocurrency exchange accounts for P2P trading automation</p>
      </div>

      <ExchangeSelector />
    </div>
  )
}