from fastapi import FastAPI

app = FastAPI(title="InkFlow API")


@app.get("/")
def root():
    return {"message": "InkFlow API funcionando"}