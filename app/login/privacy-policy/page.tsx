import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Eye, FileText, Mail } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - AGAHF Booking",
  description: "Privacy policy for AGAHF Booking system",
};

export default function PrivacyPolicyPage() {
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
                <h3 className="text-2xl font-bold mb-2">Your Privacy Matters</h3>
                <p className="text-white/90">We are committed to protecting your personal and medical information.</p>
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
                    Privacy Policy
                  </h1>
                  <p className="text-muted-foreground text-sm mt-2">
                    Last updated: February 2026
                  </p>
                </div>

                {/* Privacy Content */}
                <div className="space-y-6 text-sm">
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
