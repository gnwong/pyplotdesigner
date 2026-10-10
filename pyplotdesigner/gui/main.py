import argparse
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from threading import Timer
import webbrowser
import uvicorn

from pyplotdesigner.gui.handlers import handle_update_layout
from pyplotdesigner.core.serialization import decode_layout, encode_layout

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

frontend_path = Path(__file__).parent / "webapp"
app.mount("/ui", StaticFiles(directory=frontend_path, html=True), name="static")


@app.get("/")
async def root():
    return RedirectResponse(url="/ui")


@app.post("/api/update_layout")
async def update_layout(request: Request):
    data = await request.json()
    return handle_update_layout(data)


@app.post("/api/export_layout")
async def export_layout(request: Request):
    try:
        return {"layout_string": encode_layout(await request.json(), compressed=True)}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/import_layout")
async def import_layout(request: Request):
    try:
        data = await request.json()
        serialized = data.get('layout_string') if isinstance(data, dict) else None
        return decode_layout(serialized)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def main():
    parser = argparse.ArgumentParser(description="Run pyplotdesigner GUI server.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--reload", action="store_true")
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()

    launch_url = f"http://{args.host}:{args.port}/ui"
    if not args.no_browser:
        Timer(0.8, lambda: webbrowser.open_new(launch_url)).start()

    uvicorn.run("pyplotdesigner.gui.main:app",
                host=args.host,
                port=args.port,
                reload=args.reload,
                log_level="warning")


if __name__ == "__main__":
    main()
