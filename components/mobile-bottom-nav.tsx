"use client";

import { Home, Calendar, Plus, CalendarDays, User, List } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface MobileBottomNavProps {
  onBookingClick?: () => void;
}

export function MobileBottomNav({ onBookingClick }: MobileBottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Home",
      href: "/dashboard",
      icon: Home,
      isActive: pathname === "/dashboard",
    },
    {
      title: "My Appts",
      href: "/dashboard/my-appointments",
      icon: List,
      isActive: pathname === "/dashboard/my-appointments",
    },
    {
      title: "Book",
      href: "#",
      icon: Plus,
      isAdd: true,
      onClick: onBookingClick,
    },
    {
      title: "Schedule",
      href: "/dashboard/calendar",
      icon: CalendarDays,
      isActive: pathname === "/dashboard/calendar",
    },
    {
      title: "Profile",
      href: "/dashboard/profile",
      icon: User,
      isActive: pathname === "/dashboard/profile",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none p-4 pb-6">
       <div className="pointer-events-auto mx-auto max-w-sm">
         <div className="relative flex items-center justify-around bg-black/80 dark:bg-white/10 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-full px-2 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
            
            {navItems.map((item) => {
               if (item.isAdd) {
                 return (
                   <div key={item.title} className="-mt-8">
                     <Button
                       onClick={item.onClick}
                       size="icon"
                       className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-400 shadow-xl ring-4 ring-black/80 dark:ring-background"
                     >
                       <motion.div
                         whileTap={{ scale: 0.9 }}
                         transition={{ type: "spring", stiffness: 400, damping: 10 }}
                       >
                         <Plus className="h-7 w-7 text-white" strokeWidth={2.5} />
                       </motion.div>
                     </Button>
                   </div>
                 );
               }

               const Icon = item.icon;
               const isActive = item.isActive;

               return (
                 <Link
                   key={item.title}
                   href={item.href}
                   className={cn(
                     "relative flex flex-col items-center justify-center min-w-[3.5rem] py-1 transition-all duration-300",
                   )}
                 >
                    {isActive && (
                       <motion.div
                          layoutId="navBlob"
                          className="absolute inset-0 bg-white/10 dark:bg-white/20 rounded-2xl"
                          initial={false}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                       />
                    )}
                    
                    <motion.div
                      whileTap={{ scale: 0.8 }}
                      className="relative z-10 flex flex-col items-center gap-0.5"
                    >
                       <Icon 
                          className={cn(
                             "h-6 w-6 transition-colors duration-300",
                             isActive ? "text-green-400 fill-current" : "text-gray-400"
                          )} 
                          strokeWidth={isActive ? 2.5 : 2}
                       />
                    </motion.div>
                 </Link>
               );
            })}
         </div>
       </div>
    </div>
  );
}
