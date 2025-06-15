from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import uvicorn

app = FastAPI()
layout_state = []

frontend_path = Path(__file__).parent / "webapp"
app.mount("/ui", StaticFiles(directory=frontend_path, html=True), name="static")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/")
async def root():
    return RedirectResponse(url="/ui/")


@app.post("/api/update_layout")
async def update_layout(request: Request):
    global layout_state
    data = await request.json()

    if data.get("action") == "add":
        new_id = f"widget-{len(layout_state)}"
        layout_state.append({
            "id": new_id,
            "type": data["type"],
            "x": 100,
            "y": 100,
            "width": 200 if data["type"] == "axis" else 100,
            "height": 150 if data["type"] == "axis" else 30,
            "text": "Label" if data["type"] == "label" else data["type"]
        })
    elif "elements" in data:
        layout_state = data["elements"]

    return JSONResponse(content={"elements": layout_state})


def main():
    uvicorn.run("pyplotdesigner.gui.main:app", host="127.0.0.1", port=8080, reload=True)


if __name__ == "__main__":
    main()
