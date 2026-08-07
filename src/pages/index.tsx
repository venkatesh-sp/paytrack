import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  ClipboardList,
  Lock,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HeroBackground } from "@/components/landing/hero-background";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import type { GetServerSideProps } from "next";
import { getServerSession } from "@/lib/session";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://paytrack.app";
const SITE_TITLE = "PayTrack — Never miss an EMI or bill payment";
const SITE_DESCRIPTION =
  "Track EMIs, loans, credit card bills, and recurring payments in one beautiful dashboard. Get reminders before every due date, see analytics that matter, and keep a permanent payment history — all from data you enter yourself, with no bank or card connections required.";

const features = [
  {
    icon: Wallet,
    title: "Track every loan and bill",
    description:
      "Home loans, personal loans, credit cards, and manual bills — all in one organized view.",
  },
  {
    icon: BellRing,
    title: "Reminders that actually work",
    description:
      "Email nudges 7, 3, and 1 day before every due date, plus on the day itself.",
  },
  {
    icon: TrendingUp,
    title: "Analytics that matter",
    description:
      "See EMI trends, outstanding balances, and category breakdowns at a glance.",
  },
  {
    icon: ShieldCheck,
    title: "Auditable payment history",
    description:
      "Every payment is a permanent record — never just a checkbox you can un-check.",
  },
];

const steps = [
  {
    icon: ClipboardList,
    title: "Add what you're paying off",
    description:
      "Enter your loans, EMIs, and credit cards yourself — principal, interest rate, tenure, due date. Takes under a minute each.",
  },
  {
    icon: BellRing,
    title: "Get reminded before it's due",
    description:
      "PayTrack tracks due dates for you and nudges you 7, 3, and 1 day before, so nothing sneaks up on you.",
  },
  {
    icon: CheckCircle2,
    title: "Mark it paid, build your history",
    description:
      "Confirm a payment and it's logged permanently — a real record you can review, filter, and export anytime.",
  },
];

const faqs = [
  {
    question: "Does PayTrack connect to my bank or cards?",
    answer:
      "No — never. PayTrack doesn't connect to any bank, card network, or payment gateway. Every loan, bill, and payment is entered by you, and a payment is only ever recorded when you explicitly confirm it with the \"Mark Paid\" action. No money moves through PayTrack, and it can't move money on your behalf.",
  },
  {
    question: "Is my financial data shared with anyone?",
    answer:
      "Your data is yours. PayTrack stores what you enter to power your own dashboard, reminders, and analytics — it isn't sold or shared with third parties.",
  },
  {
    question: "What can I track with PayTrack?",
    answer:
      "Home loans, personal loans, car loans, bike loans, and credit card EMIs, plus manual recurring bills like rent, electricity, internet, insurance, and informal debts like money borrowed from friends or family.",
  },
  {
    question: "Is PayTrack free?",
    answer:
      "Yes. PayTrack is a self-tracking tool, not a payment processor, so there's no transaction fee to charge — it's free to use.",
  },
  {
    question: "What if I forget to mark a payment as paid?",
    answer:
      "PayTrack flags anything past its due date as overdue on your dashboard, so it stays visible until you resolve it — nothing silently disappears.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "PayTrack",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any (Web)",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function LandingPage() {
  return (
    <div className="bg-background relative min-h-svh overflow-hidden">
      <Head>
        <title>{SITE_TITLE}</title>
        <meta name="description" content={SITE_DESCRIPTION} />
        <meta
          name="keywords"
          content="EMI tracker, loan tracker, bill reminder, payment tracker, personal finance, expense tracker"
        />
        <link rel="canonical" href={SITE_URL} />
        <meta name="robots" content="index, follow" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="PayTrack" />
        <meta property="og:title" content={SITE_TITLE} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:locale" content="en_US" />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={SITE_TITLE} />
        <meta name="twitter:description" content={SITE_DESCRIPTION} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <HeroBackground />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-semibold">
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
            <Wallet className="size-4" />
          </span>
          PayTrack
        </div>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="grid grid-cols-1 items-center gap-12 py-20 sm:py-24 lg:grid-cols-2 lg:gap-8 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <div className="bg-card text-muted-foreground mx-auto mb-5 flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium lg:mx-0">
              <Sparkles className="text-primary size-3.5" />
              Free, private, and 100% manual — no bank connections, ever
            </div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Every payment, on time.
              <span className="text-primary block">Every time.</span>
            </h1>
            <p className="text-muted-foreground mx-auto mt-5 max-w-lg text-lg lg:mx-0">
              PayTrack keeps your EMIs, loans, credit card bills, and recurring payments
              organized — with reminders, analytics, and a full payment history you can
              trust.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3 lg:justify-start">
              <Button size="lg" asChild>
                <Link href="/register">
                  Start tracking for free
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </motion.div>

          <DashboardPreview />
        </section>

        <section className="grid grid-cols-1 gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <span className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-xl">
                    <feature.icon className="size-5" />
                  </span>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        <section className="pb-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
            <p className="text-muted-foreground mt-3">
              No setup, no linking accounts — just you and your payments.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className="relative text-center"
              >
                <div className="bg-primary text-primary-foreground mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl">
                  <step.icon className="size-5" />
                </div>
                <p className="text-primary text-xs font-semibold">STEP {i + 1}</p>
                <h3 className="mt-1 text-base font-medium">{step.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35 }}
          className="bg-card mb-24 overflow-hidden rounded-3xl border"
        >
          <div className="grid grid-cols-1 items-center gap-8 p-8 sm:p-12 lg:grid-cols-2">
            <div>
              <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                <Lock className="size-5" />
              </span>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                Built to be offline by design
              </h2>
              <p className="text-muted-foreground mt-3">
                PayTrack never asks for your bank login, card number, or any payment
                credential — because it never needs one. It&apos;s a self-tracking ledger:
                you type in what you owe, and you tell it when you&apos;ve paid.
                That&apos;s the whole model.
              </p>
            </div>
            <ul className="space-y-3">
              {[
                "No bank or card account linking",
                "No payment gateway — PayTrack never moves money",
                "Every payment requires your explicit confirmation",
                "Your data powers your dashboard, nothing else",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.section>

        <section className="mb-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              Frequently asked questions
            </h2>
          </div>
          <div className="mx-auto mt-10 max-w-2xl">
            <Accordion type="single" collapsible>
              {faqs.map((faq) => (
                <AccordionItem key={faq.question} value={faq.question}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35 }}
          className="bg-primary text-primary-foreground relative mb-24 overflow-hidden rounded-3xl px-8 py-16 text-center sm:px-12"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              maskImage:
                "radial-gradient(ellipse 60% 100% at 50% 50%, black, transparent)",
              WebkitMaskImage:
                "radial-gradient(ellipse 60% 100% at 50% 50%, black, transparent)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl"
          />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight">
              Start tracking in the next minute
            </h2>
            <p className="text-primary-foreground/80 mx-auto mt-3 max-w-md">
              No bank connections, no card details, no waiting. Just add your first loan
              or bill and see your dashboard come to life.
            </p>
            <Button size="lg" variant="secondary" className="mt-8" asChild>
              <Link href="/register">
                Create your free account
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </motion.section>
      </main>

      <footer className="text-muted-foreground border-t py-8 text-center text-sm">
        &copy; {new Date().getFullYear()} PayTrack. All rights reserved.
      </footer>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req);
  if (session) {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }
  return { props: {} };
};
