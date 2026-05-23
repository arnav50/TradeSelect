import { useQuery } from "@tanstack/react-query";

import { apiGet } from "./client";
import { CandidateZ, ScanLatestZ, type Candidate, type ScanLatest } from "@/types/candidate";

export function useScanLatest() {
  return useQuery<ScanLatest>({
    queryKey: ["scan", "latest"],
    queryFn: () => apiGet("/scan/latest", ScanLatestZ),
  });
}

export function useCandidate(symbol: string | undefined) {
  return useQuery<Candidate>({
    queryKey: ["candidate", symbol],
    queryFn: () => apiGet(`/scan/candidate/${symbol}`, CandidateZ),
    enabled: !!symbol,
  });
}
