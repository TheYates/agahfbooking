"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Shield,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  HeartPulse,
  CreditCard,
  Building2,
  CalendarDays,
  Bell,
  BellOff,
  Smartphone,
  Download,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { useConvexAuth } from "@/hooks/use-convex-auth";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useInstallPrompt } from "@/hooks/use-pwa";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user: authUser } = useConvexAuth();
  const [userData, setUserData] = useState<any>(null);
  
  // PWA and Notification hooks
  const {
    isSupported: notificationsSupported,
    permission,
    subscription,
    isLoading: notificationsLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();

  useEffect(() => {
    if (authUser) {
      setUserData(authUser);
    } else {
      // Fallback for development/demo if not logged in
      setUserData({
        name: "John Doe",
        xNumber: "X12345/67",
        phone: "+123-456-7890",
        category: "PRIVATE CASH",
        role: "client",
        address: "123 Healthcare Ave, Medical District",
        emergencyContact: "+123-987-6543",
        created_at: Date.now() - 1000 * 60 * 60 * 24 * 365,
      });
    }
  }, [authUser]);

  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading profile...</p>
      </div>
    );
  }

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-8">
      <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground/70 px-4 mb-3">
        {title}
      </h2>
      <div className="bg-card rounded-[24px] border border-black/[0.03] dark:border-white/[0.03] overflow-hidden shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
        {children}
      </div>
    </div>
  );

  const ListItem = ({
    icon: Icon,
    label,
    value,
    showChevron = false,
    destructive = false
  }: {
    icon: any,
    label: string,
    value?: string,
    showChevron?: boolean,
    destructive?: boolean
  }) => (
    <div className="group relative flex items-center gap-4 px-5 py-4 active:bg-muted/80 transition-all duration-200 cursor-default last:border-0 border-b border-black/[0.03] dark:border-white/[0.03]">
      <div className={`p-2.5 rounded-2xl ${destructive
        ? 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400'
        : 'bg-primary/5 text-primary dark:bg-primary/10'
        }`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-none mb-1.5">{label}</p>
        <p className="text-[15px] font-semibold truncate text-foreground tracking-tight">{value || "Not provided"}</p>
      </div>
      {showChevron && <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-active:translate-x-0.5 transition-transform" />}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="max-w-6xl mx-auto px-1 pt-2 pb-10"
    >
      {/* Hero Section - Solid & High Contrast */}
      <div className="relative mb-8 pt-4 overflow-hidden rounded-[32px] bg-zinc-50 dark:bg-zinc-900/50 p-6 md:p-10 border border-zinc-100 dark:border-zinc-800/50">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 relative z-10">
          <div className="relative group">
            <div className="absolute -inset-1 bg-zinc-900/5 dark:bg-zinc-100/5 rounded-full" />
            <Avatar className="h-28 w-28 md:h-32 md:w-32 ring-4 ring-white dark:ring-zinc-900 border shadow-xl relative">
              <AvatarFallback className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-3xl md:text-4xl font-black tracking-tighter">
                {getUserInitials(userData.name)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-1 right-1 h-7 w-7 bg-green-500 border-4 border-white dark:border-zinc-900 rounded-full shadow-lg" />
          </div>

          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{userData.name}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
              <Badge variant="outline" className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 px-3 py-1 text-[11px] font-bold uppercase tracking-widest shadow-sm">
                {userData.x_number || userData.xNumber || userData.employee_id || "USER"}
              </Badge>
              <Badge className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-none text-[11px] font-black uppercase tracking-widest px-3 py-1 hover:bg-zinc-800 dark:hover:bg-zinc-200">
                {userData.category || (userData.role === "admin" ? "ADMINISTRATOR" : "STAFF")}
              </Badge>
            </div>
            <p className="mt-4 text-sm text-muted-foreground font-medium">
              Hospital client since {new Date(userData.created_at || Date.now()).toLocaleDateString("en-US", { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Primary Info */}
        <div className="lg:col-span-7 space-y-8">
          <Section title="Profile Details">
            <ListItem
              icon={User}
              label="Full Name"
              value={userData.name}
            />
            <ListItem
              icon={CreditCard}
              label={userData.role === "client" ? "Patient X-Number" : "Employee ID"}
              value={userData.x_number || userData.xNumber || userData.employee_id}
            />
            <ListItem
              icon={Building2}
              label="Account Category"
              value={userData.category || (userData.role === "admin" ? "Admin" : "Hospital Staff")}
            />
          </Section>

          <Section title="Communication">
            <ListItem
              icon={Phone}
              label="Phone Number"
              value={userData.phone}
            />
            <ListItem
              icon={Mail}
              label="Email Address"
              value={userData.email}
            />
            <ListItem
              icon={MapPin}
              label="Registered Address"
              value={userData.address}
            />
          </Section>
        </div>

        {/* Right Column - Stats & Secondary Info */}
        <div className="lg:col-span-5 space-y-8">
          {/* Quick Info Grid - Condensed for sidebar on desktop */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              whileHover={{ y: -2 }}
              className="bg-card p-5 rounded-[28px] border border-black/[0.03] dark:border-white/[0.03] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]"
            >
              <div className="h-10 w-10 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mb-3">
                <HeartPulse className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">Status</p>
              <p className="text-lg font-black text-foreground">Active</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="bg-card p-5 rounded-[28px] border border-black/[0.03] dark:border-white/[0.03] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]"
            >
              <div className="h-10 w-10 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mb-3">
                <CalendarDays className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">Joined</p>
              <p className="text-lg font-black text-foreground">
                {new Date(userData.created_at || Date.now()).toLocaleDateString("en-US", { month: 'short', year: 'numeric' })}
              </p>
            </motion.div>
          </div>

          {userData.role === "client" && (
            <Section title="Emergency & Health">
              <ListItem
                icon={Shield}
                label="Emergency Contact"
                value={userData.emergency_contact || userData.emergencyContact}
              />
              <ListItem
                icon={Clock}
                label="Last Activity"
                value={new Date().toLocaleDateString("en-US", { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
              />
            </Section>
          )}

          <Section title="App & Notifications">
            {/* Install App */}
            <div 
              className="flex items-center px-5 py-4 hover:bg-muted/30 transition-all cursor-pointer"
              onClick={async () => {
                if (isInstallable && !isInstalled) {
                  const success = await promptInstall();
                  if (success) {
                    toast.success("App installed successfully!");
                  }
                }
              }}
            >
              <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mr-4">
                <Smartphone className="h-[18px] w-[18px] text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-foreground">Install App</p>
                <p className="text-[13px] text-muted-foreground truncate">
                  {isInstalled 
                    ? "App is installed on your device" 
                    : isInstallable 
                      ? "Add to home screen for quick access"
                      : "App installation not available"}
                </p>
              </div>
              {isInstalled ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 ml-2" />
              ) : isInstallable ? (
                <Download className="h-5 w-5 text-muted-foreground/50 ml-2" />
              ) : null}
            </div>

            {/* Push Notifications */}
            <div 
              className="flex items-center px-5 py-4 hover:bg-muted/30 transition-all cursor-pointer"
              onClick={async () => {
                if (!notificationsSupported || permission === "denied" || notificationsLoading) return;
                
                if (subscription) {
                  const success = await unsubscribe();
                  if (success) {
                    toast.success("Notifications disabled");
                  }
                } else {
                  const result = await subscribe();
                  if (result) {
                    toast.success("Notifications enabled!", {
                      description: "You'll receive appointment reminders",
                    });
                  }
                }
              }}
            >
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center mr-4 ${
                subscription 
                  ? "bg-green-50 dark:bg-green-500/10" 
                  : "bg-muted"
              }`}>
                {notificationsLoading ? (
                  <Loader2 className="h-[18px] w-[18px] text-muted-foreground animate-spin" />
                ) : subscription ? (
                  <Bell className="h-[18px] w-[18px] text-green-500" />
                ) : (
                  <BellOff className="h-[18px] w-[18px] text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-foreground">Push Notifications</p>
                <p className="text-[13px] text-muted-foreground truncate">
                  {!notificationsSupported 
                    ? "Not supported on this browser"
                    : permission === "denied"
                      ? "Blocked - Enable in browser settings"
                      : subscription
                        ? "Receiving appointment reminders"
                        : "Tap to enable reminders"}
                </p>
              </div>
              {subscription && (
                <CheckCircle2 className="h-5 w-5 text-green-500 ml-2" />
              )}
            </div>
          </Section>

          <Section title="Support & Security">
            <ListItem
              icon={Shield}
              label="Privacy & Data Settings"
              showChevron
            />
            <ListItem
              icon={Phone}
              label="Contact Hospital Support"
              showChevron
            />
          </Section>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="px-6 py-12 text-center mt-10">
        <p className="text-[11px] font-bold text-muted-foreground/40 leading-relaxed uppercase tracking-widest">
          To modify your hospital records, <br className="md:hidden" /> please speak with the administrative desk in person.
        </p>
        <div className="mt-10 flex justify-center opacity-20 grayscale transition-all hover:opacity-100 hover:grayscale-0">
          <img
            src="/agahflogo.svg"
            alt="AGAHF Logo"
            className="h-9 w-auto dark:hidden"
          />
          <img
            src="/agahflogo white.svg"
            alt="AGAHF Logo"
            className="h-9 w-auto hidden dark:block"
          />
        </div>
      </div>
    </motion.div>
  );
}
