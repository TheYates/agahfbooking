"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  HelpCircle, 
  Key, 
  Calendar, 
  User, 
  Phone, 
  MessageCircle
} from "lucide-react";

interface HelpCenterDialogProps {
  children?: React.ReactNode;
  triggerClassName?: string;
}

export function HelpCenterDialog({ children, triggerClassName }: HelpCenterDialogProps) {
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
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="link" className={triggerClassName || "h-auto p-0 text-xs text-green-600/80 hover:underline"}>
            Help Center
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <img
              src="/agahflogo.svg"
              alt="AGAHF Logo"
              className="h-8 w-8 object-contain dark:hidden"
            />
            <img
              src="/agahflogo white.svg"
              alt="AGAHF Logo"
              className="h-8 w-8 object-contain hidden dark:block"
            />
            <DialogTitle className="text-xl">Help Center</DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Find answers and get support
          </p>
        </DialogHeader>
        
        <ScrollArea className="px-6 py-4 max-h-[60vh]">
          <div className="space-y-6 pr-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-lg border border-muted bg-muted/30"
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
