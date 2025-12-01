import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function CalendarStrip() {
    const [selectedDate, setSelectedDate] = useState(new Date().getDate());

    // Generate next 7 days
    const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return {
            day: date.getDate(),
            weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
            fullDate: date
        };
    });

    const today = new Date();
    const formattedToday = today.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        weekday: "long"
    });

    return (
        <div className="w-full mb-6 relative">
            <div className="flex justify-between items-center px-4 mb-4">
                <h3 className="text-ui-charcoal font-bold text-xl tracking-tight">{formattedToday}</h3>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-2 shadow-sm border border-white/50">
                <div className="grid grid-cols-7 gap-1 md:gap-3 items-center">
                    {days.map((item, index) => {
                        const isSelected = item.day === selectedDate;

                        return (
                            <motion.button
                                key={index}
                                onClick={() => setSelectedDate(item.day)}
                                whileTap={{ scale: 0.95 }}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-24 rounded-[24px] transition-all duration-300 relative overflow-hidden group",
                                    isSelected
                                        ? "bg-pastel-purple text-ui-charcoal shadow-lg shadow-purple-200/50"
                                        : "hover:bg-gray-50 text-gray-400"
                                )}
                            >
                                <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-wider mb-1 transition-colors",
                                    isSelected ? "text-ui-charcoal/60" : "text-gray-400 group-hover:text-gray-600"
                                )}>
                                    {item.weekday}
                                </span>
                                <span className={cn(
                                    "text-2xl font-bold transition-colors",
                                    isSelected ? "text-ui-charcoal" : "text-gray-600 group-hover:text-gray-900"
                                )}>
                                    {item.day}
                                </span>
                                {isSelected && (
                                    <motion.div
                                        layoutId="activeIndicator"
                                        className="absolute bottom-2 w-1 h-1 rounded-full bg-ui-charcoal/20"
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
