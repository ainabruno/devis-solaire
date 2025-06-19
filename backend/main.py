from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import math

app = FastAPI()

origins = [
    "https://frontent-foub.onrender.com", 
]

# Autoriser le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EstimationRequest(BaseModel):
    surface: float
    type_installation: str
    besoin: str = ""

INSTALLATION_DATA = {
    "résidentiel": {"wc_m2": 170, "prix_wc": 1.2, "panneau": 400},
    "agricole": {"wc_m2": 150, "prix_wc": 1.0, "panneau": 450},
    "industriel": {"wc_m2": 130, "prix_wc": 0.9, "panneau": 500}
}

@app.post("/api/estimation")
def estimation(data: EstimationRequest):
    type_install = data.type_installation.lower()
    surface = data.surface

    params = INSTALLATION_DATA.get(type_install, INSTALLATION_DATA["résidentiel"])

    puissance_totale = surface * params["wc_m2"]
    nombre_panneaux = math.ceil(puissance_totale / params["panneau"])
    prix_total = puissance_totale * params["prix_wc"]

    return {
        "puissance": round(puissance_totale, 2),
        "panneaux": nombre_panneaux,
        "prix": round(prix_total, 2)
    }
