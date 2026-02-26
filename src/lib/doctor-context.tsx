"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DoctorProfile } from "@/lib/types";

interface DoctorContextType {
    doctor: DoctorProfile | null;
    loading: boolean;
}

const DoctorContext = createContext<DoctorContextType>({ doctor: null, loading: true });

export function DoctorProvider({ children }: { children: React.ReactNode }) {
    const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();

        async function fetchDoctor() {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from("doctors")
                .select("full_name, specialization")
                .eq("user_id", user.id)
                .single();

            if (data) setDoctor(data);
            setLoading(false);
        }

        fetchDoctor();
    }, []);

    return (
        <DoctorContext.Provider value={{ doctor, loading }}>
            {children}
        </DoctorContext.Provider>
    );
}

export function useDoctor() {
    return useContext(DoctorContext);
}
