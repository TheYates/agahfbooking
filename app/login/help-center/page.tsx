import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle, 
  Key, 
  Calendar, 
  User, 
  Phone, 
  MessageCircle,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Help Center - AGAHF Booking",
  description: "Help center and support for AGAHF Booking system",
};

export default function HelpCenterPage() {
  const faqs = [
    {
      icon: Key,
      question: "How do I log in?",
      answer: "Enter your X-Number in the format X12345/67 on the login page. You'll receive a one-time password (OTP) via SMS to verify your identity."
    },
    {
      icon: Calendar,
      question: "How do I book an appointment?",
      answer: "After logging in, navigate to the Appointments section and click 'New Appointment'. Select your preferred department, date, and time slot."
    },
    {
      icon: User,
      question: "What is an X-Number?",
      answer: "Your X-Number is your unique identifier in our system, formatted as X followed by 5 digits, a slash, and 2 more digits (e.g., X12345/67)."
    },
    {
      icon: Phone,
      question: "I didn't receive my OTP",
      answer: "Please wait a few minutes and check your SMS messages. If you still haven't received it, click 'Use a different X-Number' and try again."
    }
  ];

  const supportChannels = [
    {
      icon: Phone,
      title: "Phone Support",
      description: "Call our helpline for immediate assistance",
      action: "+1 (555) 123-4567"
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our support team during business hours",
      action: "Available 8AM - 6PM"
    }
  ];

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background md:bg-muted/40 p-0 md:p-10">
      <div className="w-full max-w-4xl md:mx-auto z-10">
        <Card className="overflow-hidden border-0 shadow-none md:border md:shadow-xl rounded-none md:rounded-xl bg-background">
          <CardContent className="grid p-0 md:grid-cols-2 min-h-[100svh] md:min-h-[600px]">
            {/* Desktop Image Section */}
            <div className="bg-muted relative hidden md:block">
              <img
                src="https://images.pexels.com/photos/34862508/pexels-photo-34862508.jpeg"
                alt="Hospital Interior"
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.6] dark:grayscale"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-10 text-white">
                <h3 className="text-2xl font-bold mb-2">We're Here to Help</h3>
                <p className="text-white/90">Get answers to common questions and find the support you need.</p>
              </div>
            </div>

            {/* Content Section */}
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 sm:p-10 md:p-12">
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="mb-4 p-3">
                    <img
                      src="/agahflogo.svg"
                      alt="AGAHF Logo"
                      className="h-16 w-16 md:h-10 md:w-10 object-contain dark:hidden"
                    />
                    <img
                      src="/agahflogo white.svg"
                      alt="AGAHF Logo"
                      className="h-16 w-16 md:h-10 md:w-10 object-contain hidden dark:block"
                    />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    Help Center
                  </h1>
                  <p className="text-muted-foreground text-sm mt-2">
                    Find answers and get support
                  </p>
                </div>

                {/* Quick Help Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold">Frequently Asked Questions</h2>
                  </div>

                  <div className="space-y-3">
                    {faqs.map((faq, index) => (
                      <div 
                        key={index}
                        className="p-4 rounded-lg border border-muted bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <faq.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                          <div className="space-y-1">
                            <h3 className="font-medium text-sm">{faq.question}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Support Channels */}
                  <div className="pt-4">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-primary" />
                      Contact Support
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                      {supportChannels.map((channel, index) => (
                        <div 
                          key={index}
                          className="p-4 rounded-lg border border-muted bg-muted/30 text-center"
                        >
                          <channel.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                          <h3 className="font-medium text-sm">{channel.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {channel.description}
                          </p>
                          <p className="text-xs font-medium text-primary mt-2">
                            {channel.action}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Help */}
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <h3 className="font-medium text-sm text-primary mb-2">
                      Still need help?
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Our support team is available Monday through Friday, 8:00 AM to 6:00 PM. 
                      For urgent medical matters, please contact your healthcare provider directly 
                      or visit the nearest emergency department.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-muted">
                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <Link href="/login">Back to Login</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
