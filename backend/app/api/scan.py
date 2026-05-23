from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.config import settings
from app.data.live_candidates import build_live_scan
from app.data.mock_candidates import build_mock_scan
from app.models.candidate import Candidate, ScanLatest

router = APIRouter(prefix="/scan", tags=["scan"])


def _current_scan() -> ScanLatest:
    return build_mock_scan() if settings.use_mock_data else build_live_scan()


@router.get("/latest", response_model=ScanLatest)
def get_latest_scan() -> ScanLatest:
    return _current_scan()


@router.get("/candidate/{symbol}", response_model=Candidate)
def get_candidate(symbol: str) -> Candidate:
    scan = _current_scan()
    for c in scan.candidates:
        if c.symbol.upper() == symbol.upper():
            return c
    raise HTTPException(status_code=404, detail=f"Candidate '{symbol}' not in latest scan.")
