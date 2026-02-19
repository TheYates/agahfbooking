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
import { Shield, Lock, Eye, FileText, Mail } from "lucide-react";

interface PrivacyPolicyDialogProps {
  children?: React.ReactNode;
  triggerClassName?: string;
}

export function PrivacyPolicyDialog({ children, triggerClassName }: PrivacyPolicyDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="link" className={triggerClassName || "h-auto p-0 text-xs text-green-600/80 hover:underline"}>
            Privacy Policy
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
            <DialogTitle className="text-xl">Privacy Policy</DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Last updated: February 2026
          </p>
        </DialogHeader>
        
        <ScrollArea className="px-6 py-4 max-h-[60vh]">
          <div className="space-y-6 text-sm pr-4">
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Shield className="h-5 w-5" />
                <h2 className="font-semibold text-base">Information We Collect</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                We collect information you provide directly to us, including your X-Number, 
                contact information, appointment details, and medical history necessary for 
                healthcare services.
              </p>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Lock className="h-5 w-5" />
                <h2 className="font-semibold text-base">How We Protect Your Data</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                We implement industry-standard security measures including encryption, 
                secure OTP verification, and access controls. Your data is stored securely 
                and only accessible to authorized healthcare personnel.
              </p>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Eye className="h-5 w-5" />
                <h2 className="font-semibold text-base">How We Use Your Information</h2>
              </div>
              <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                <li>To schedule and manage your appointments</li>
                <li>To provide medical surveillance and healthcare services</li>
                <li>To send appointment reminders and health notifications</li>
                <li>To comply with legal and regulatory requirements</li>
              </ul>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" />
                <h2 className="font-semibold text-base">Your Rights</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                You have the right to access, correct, or delete your personal information. 
                You may also request a copy of your data or withdraw consent for certain 
                processing activities.
              </p>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Mail className="h-5 w-5" />
                <h2 className="font-semibold text-base">Contact Us</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, 
                please contact our Data Protection Officer through the Help Center or your 
                healthcare provider.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
