"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { QuoteForm } from "@/components/configurator/QuoteForm";
import { useConfiguratorStore } from "@/stores/configurator";

export default function QuotePage() {
  const {
    productType,
    selectedFinish,
    width,
    height,
    thickness,
    mountingType,
    panelCount,
    calculatedPrice,
    priceBreakdown,
  } = useConfiguratorStore();

  const hasConfig = selectedFinish !== null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <Link
          href={`/configure/${productType}`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-ht-dark/50 hover:text-ht-gold"
        >
          &larr; Back to configurator
        </Link>

        <h1 className="font-serif text-3xl font-bold text-ht-dark">
          Quote Summary
        </h1>

        {!hasConfig ? (
          <div className="mt-8 rounded-xl border border-ht-dark/10 bg-white p-8 text-center">
            <p className="text-ht-dark/60">
              No configuration found. Please{" "}
              <Link href="/configure/splashback" className="text-ht-gold underline">
                configure your product
              </Link>{" "}
              first.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {/* Configuration Summary */}
            <div className="rounded-xl border border-ht-dark/10 bg-white p-6">
              <h2 className="font-serif text-xl font-semibold">
                Your {productType.replace(/_/g, " ")}
              </h2>

              <dl className="mt-4 space-y-3">
                <SummaryItem label="Finish" value={selectedFinish.name} />
                <SummaryItem label="Base Metal" value={selectedFinish.baseMetal} />
                <SummaryItem label="Width" value={`${width}mm`} />
                <SummaryItem label="Height" value={`${height}mm`} />
                <SummaryItem label="Thickness" value={`${thickness}mm`} />
                <SummaryItem label="Mounting" value={mountingType.replace(/_/g, " ")} />
                {panelCount > 1 && (
                  <SummaryItem label="Panels" value={`${panelCount} panels (aged together)`} />
                )}
              </dl>

              {calculatedPrice && (
                <div className="mt-6 border-t border-ht-dark/10 pt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-ht-dark/60">Estimated Total</span>
                    <span className="font-serif text-2xl font-bold text-ht-dark">
                      £{calculatedPrice.toFixed(2)}
                    </span>
                  </div>
                  {priceBreakdown && (
                    <p className="mt-1 text-xs text-ht-dark/40">
                      Inc. £{priceBreakdown.vat.toFixed(2)} VAT &middot;
                      Delivery from £{priceBreakdown.deliveryEstimate.toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              <p className="mt-4 text-xs text-ht-dark/40">
                Estimated 5-8 week lead time from order confirmation.
              </p>
            </div>

            {/* Quote Request Form */}
            <div className="rounded-xl border border-ht-dark/10 bg-white p-6">
              <QuoteForm />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <dt className="text-ht-dark/50">{label}</dt>
      <dd className="font-medium capitalize text-ht-dark">{value}</dd>
    </div>
  );
}
