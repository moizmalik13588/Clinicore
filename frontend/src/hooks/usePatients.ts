import { useState, useEffect, useCallback } from 'react';
import { patientsApi } from '../lib/api';

export interface Patient {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    gender: string | null;
    totalVisits: number;
    lastVisitDate: string | null;
    lastComplaint: string | null;
    lastMood: string | null;
    crmTags: string[];
    preferredTimeSlot: string | null;
    notes: string | null;
    preferredDoctor: { id: string; name: string; specialty: string | null } | null;
    createdAt: string;
    updatedAt: string;
}

interface UsePatientListOptions {
    search?: string;
    tag?: string;
    mood?: string;
    page?: number;
    limit?: number;
}

export function usePatientList(opts: UsePatientListOptions = {}) {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const res = await patientsApi.list({
                page: opts.page || 1,
                limit: opts.limit || 20,
                search: opts.search || undefined,
                tag: opts.tag || undefined,
                mood: opts.mood || undefined,
            });
            setPatients(res.data.data);
            setTotal(res.data.total);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [opts.page, opts.search, opts.tag, opts.mood, opts.limit]);

    useEffect(() => { fetch(); }, [fetch]);

    return { patients, total, totalPages, loading, refetch: fetch };
}

export function usePatient(id: string) {
    const [patient, setPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        patientsApi.getById(id)
            .then(r => setPatient(r.data.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    return { patient, loading };
}