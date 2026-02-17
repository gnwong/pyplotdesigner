import argparse
from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from threading import Timer
import webbrowser
import uvicorn

from pyplotdesigner.gui.handlers import handle_update_layout

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
