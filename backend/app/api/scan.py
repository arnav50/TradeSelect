from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.config import settings
from app.data.mock_candidates import build_mock_scan
from app.models.candidate import Candidate, ScanLatest

router = APIRouter(prefix="/scan", tags=["scan"])


@router.get("/latest", response_model=ScanLatest)
def get_latest_scan() -> ScanLatest:
    if settings.use_mock_data:
        return build_mock_scan()
    raise HTTPException(status_code=503, detail="Real scan pipeline not yet wired (Phase 2+).")


@router.get("/candidate/{symbol}", response_model=Candidate)
def get_candidate(symbol: str) -> Candidate:
    scan = build_mock_scan() if settings.use_mock_data else None
    if scan is None:
        raise HTTPException(status_code=503, detail="Real pipeline not yet wired.")

    for c in scan.candidates:
        if c.symbol.upper() == symbol.upper():
            return c
    raise HTTPException(status_code=404, detail=f"Candidate '{symbol}' not in latest scan.")
