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
        <div className="w-full mb-6">
            <div className="flex justify-between items-center px-2 mb-4">
                <h3 className="text-ui-charcoal font-bold text-lg">{formattedToday}</h3>
            </div>

            <div className="flex justify-between items-center gap-2 overflow-x-auto pb-2 px-1 no-scrollbar">
                {days.map((item, index) => {
                    const isSelected = item.day === selectedDate;

                    return (
                        <motion.button
                            key={index}
                            onClick={() => setSelectedDate(item.day)}
                            whileTap={{ scale: 0.9 }}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[3.5rem] h-20 rounded-[24px] transition-all duration-300",
                                isSelected
                                    ? "bg-ui-charcoal text-white shadow-lg shadow-ui-charcoal/20"
                                    : "bg-white text-ui-charcoal/60 hover:bg-mint-50"
                            )}
                        >
                            <span className={cn(
                                "text-xs font-bold mb-1",
                                isSelected ? "text-white/80" : "text-ui-charcoal/40"
                            )}>
                                {item.weekday}
                            </span>
                            <span className={cn(
                                "text-xl font-bold",
                                isSelected ? "text-white" : "text-ui-charcoal"
                            )}>
                                {item.day}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
