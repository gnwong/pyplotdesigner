from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
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
    uvicorn.run("pyplotdesigner.gui.main:app",
                host="127.0.0.1",
                port=8080,
                reload=True,
                log_level="warning")


if __name__ == "__main__":
    main()
