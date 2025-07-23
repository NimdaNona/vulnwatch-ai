from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def get_scans():
    return {"message": "Scans endpoint"}