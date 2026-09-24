import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  Search,
  ChevronDown,
  CheckCircle2,
  Clock,
  Package,
  ShieldCheck,
  Send,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { useToast } from '../../hooks/useToast';

const FAQS = [
  {
    q: 'How does hyperlocal store discovery work on GeoMarket?',
    a: 'GeoMarket uses your delivery location and spatial calculations (PostGIS) to find physical stores that have defined a delivery radius covering your address. You only see stores and products that can actually fulfill and deliver directly to your doorstep.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We currently support Cash on Delivery (COD). You pay the delivery driver or store fulfillment courier directly upon receiving and inspecting your items.',
  },
  {
    q: 'Can I add products from multiple stores to one cart?',
    a: 'To guarantee direct freshness and avoid multiple delivery fees, each order is fulfilled by one dedicated store. If you add items from a different store, GeoMarket will ask whether you want to switch your cart to the new merchant.',
  },
  {
    q: 'How do I track my order status?',
    a: 'You can visit the "Track Order" page at any time and enter your Order ID and phone number to monitor real-time fulfillment steps from "Confirmed" to "Out for Delivery".',
  },
  {
    q: 'How do I register as a merchant or vendor?',
    a: 'Click "Partner as Merchant" or navigate to the Vendor Registration page. Provide your legal business name, tax identification (NTN), and set up your storefront with your custom delivery perimeter.',
  },
];

export function SupportPage() {
  const { toast } = useToast();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast({
        variant: 'destructive',
        title: 'Incomplete Details',
        description: 'Please provide your name, email, and message.',
      });
      return;
    }

    setSubmitted(true);
    toast({
      title: 'Support Inquiry Received',
      description: 'Thank you! Our customer support team will reply within 2 hours.',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* ─── Hero Header ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-800/80 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-200 backdrop-blur-md shadow-lg">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            Customer Help &amp; Support Center
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            We're Here to Help You
          </h1>
          <p className="text-xs sm:text-base text-emerald-100 max-w-xl mx-auto leading-relaxed">
            Need help with an order, finding local stores, or setting up a vendor storefront? Browse our FAQs or reach out directly.
          </p>
        </div>
      </section>

      {/* ─── Support Channels ─────────────────────────────────────────── */}
      <section className="-mt-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-2xl border-slate-200/80 shadow-md bg-white hover-lift transition-all">
            <CardContent className="p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Direct WhatsApp Support</h3>
              <p className="text-xs text-muted-foreground">+92 300 1234567</p>
              <span className="inline-block text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                Instant Response
              </span>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 shadow-md bg-white hover-lift transition-all">
            <CardContent className="p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Helpdesk Email</h3>
              <p className="text-xs text-muted-foreground">support@geomarket.pk</p>
              <span className="inline-block text-[11px] text-teal-600 font-semibold bg-teal-50 px-2 py-0.5 rounded-full">
                Response within 2h
              </span>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 shadow-md bg-white hover-lift transition-all">
            <CardContent className="p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Track Active Order</h3>
              <p className="text-xs text-muted-foreground">Check status using phone</p>
              <Button variant="outline" size="sm" asChild className="h-7 text-xs rounded-lg mt-1 border-amber-300 text-amber-800 hover:bg-amber-50">
                <Link to="/orders/track">Track Order</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── FAQs & Contact Form ───────────────────────────────────────── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: FAQs Accordion */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <Badge variant="outline" className="text-xs font-bold text-emerald-700 bg-emerald-50 border-emerald-200">
                Frequently Asked Questions
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Common Questions Answered
              </h2>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden transition-all shadow-2xs"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:text-emerald-700 transition-colors"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-emerald-600' : 'text-slate-400'}`} />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Contact Message Form */}
          <div className="lg:col-span-5">
            <Card className="rounded-3xl border-slate-200/80 shadow-lg bg-white p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <h3 className="font-extrabold text-xl text-slate-900">Send us a Message</h3>
                <p className="text-xs text-muted-foreground">
                  Have a specific inquiry? Fill in the details below and we'll get back to you promptly.
                </p>
              </div>

              {submitted ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-slate-900 text-sm">Message Sent Successfully!</h4>
                  <p className="text-xs text-slate-600">
                    Our team has received your message and will get in touch with you shortly.
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setSubmitted(false)} className="mt-3">
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Your Name
                    </label>
                    <Input
                      placeholder="e.g. Ali Khan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-xl h-10 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="e.g. ali@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-xl h-10 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Message / Question
                    </label>
                    <Textarea
                      placeholder="How can we assist you today? Provide any relevant Order ID..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="rounded-xl text-xs"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-xl gap-2 shadow-md">
                    <Send className="h-4 w-4" />
                    Submit Support Request
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
