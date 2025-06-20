from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
import math
from datetime import datetime

app = FastAPI(title="API Devis Solaire Professionnel", version="2.0")

# Configuration CORS
origins = [
    "https://frontent-foub.onrender.com",
    "http://localhost:3000",
    "http://localhost:5173",
    "https://claude.ai"  # Pour les tests
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modèles Pydantic
class ClientInfo(BaseModel):
    nom: str
    adresse: Optional[str] = ""
    email: Optional[str] = ""
    telephone: Optional[str] = ""

class EstimationRequest(BaseModel):
    # Informations client
    client: ClientInfo
    
    # Caractéristiques du projet
    surface: float
    type_installation: str
    besoin: str = ""
    
    # Options avancées (optionnelles)
    orientation: Optional[str] = "Sud"
    inclinaison: Optional[int] = 30
    ombrage: Optional[str] = "Aucun"

class Prestation(BaseModel):
    designation: str
    quantite: float
    unite: str
    prix_unitaire: float
    total: float

class DevisResponse(BaseModel):
    # Informations de base
    numero_devis: str
    date_creation: str
    
    # Client
    client: ClientInfo
    
    # Caractéristiques techniques
    surface: float
    type_installation: str
    nombre_panneaux: int
    puissance_totale: float  # en Wc
    puissance_kwc: float     # en kWc
    production_annuelle: float  # en kWh
    
    # Prestations détaillées
    prestations: List[Prestation]
    
    # Totaux financiers
    sous_total_ht: float
    tva: float
    taux_tva: float
    total_ttc: float
    
    # Rentabilité
    economie_annuelle: float
    retour_investissement: float
    gain_20_ans: float
    
    # Besoins
    besoin: str

# Données de configuration
INSTALLATION_DATA = {
    "résidentiel": {
        "wc_m2": 170,
        "prix_wc": 1.2,
        "panneau_wc": 400,
        "taux_tva": 0.10,  # TVA réduite 10%
        "prix_onduleur": 1200,
        "panneaux_par_onduleur": 20
    },
    "agricole": {
        "wc_m2": 150,
        "prix_wc": 1.0,
        "panneau_wc": 450,
        "taux_tva": 0.20,  # TVA normale 20%
        "prix_onduleur": 1500,
        "panneaux_par_onduleur": 25
    },
    "industriel": {
        "wc_m2": 130,
        "prix_wc": 0.9,
        "panneau_wc": 500,
        "taux_tva": 0.20,  # TVA normale 20%
        "prix_onduleur": 2000,
        "panneaux_par_onduleur": 30
    }
}

PRIX_PRESTATIONS = {
    "ingenierie": {
        "forfait": 2000.00,
        "description": "Ingénierie + DOE"
    },
    "module": {
        "residentiel": 280.00,
        "agricole": 320.00,
        "industriel": 350.00
    },
    "structure": 45.00,
    "cablage": 800.00,
    "coffrets": 1500.00,
    "main_oeuvre_m2": 35.00,
    "monitoring": 800.00
}

def generer_numero_devis() -> str:
    """Génère un numéro de devis unique"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M")
    return f"DEV-{timestamp}"

def calculer_prestations(surface: float, type_install: str, nombre_panneaux: int, 
                        nombre_onduleurs: int) -> List[Prestation]:
    """Calcule le détail des prestations"""
    
    prestations = []
    
    # 1. Ingénierie
    prestations.append(Prestation(
        designation="Ingénierie + DOE",
        quantite=1,
        unite="Forfait",
        prix_unitaire=PRIX_PRESTATIONS["ingenierie"]["forfait"],
        total=PRIX_PRESTATIONS["ingenierie"]["forfait"]
    ))
    
    # 2. Modules photovoltaïques
    prix_module = PRIX_PRESTATIONS["module"][type_install]
    total_modules = nombre_panneaux * prix_module
    prestations.append(Prestation(
        designation="Modules photovoltaïques 400Wc",
        quantite=nombre_panneaux,
        unite="U",
        prix_unitaire=prix_module,
        total=total_modules
    ))
    
    # 3. Onduleurs
    total_onduleurs = nombre_onduleurs * INSTALLATION_DATA[type_install]["prix_onduleur"]
    prestations.append(Prestation(
        designation="Onduleurs + protection DC",
        quantite=nombre_onduleurs,
        unite="U",
        prix_unitaire=INSTALLATION_DATA[type_install]["prix_onduleur"],
        total=total_onduleurs
    ))
    
    # 4. Structure de fixation
    total_structure = nombre_panneaux * PRIX_PRESTATIONS["structure"]
    prestations.append(Prestation(
        designation="Structure de fixation",
        quantite=nombre_panneaux,
        unite="U",
        prix_unitaire=PRIX_PRESTATIONS["structure"],
        total=total_structure
    ))
    
    # 5. Câblage
    prestations.append(Prestation(
        designation="Câblage DC et AC",
        quantite=1,
        unite="Forfait",
        prix_unitaire=PRIX_PRESTATIONS["cablage"],
        total=PRIX_PRESTATIONS["cablage"]
    ))
    
    # 6. Coffrets et protections
    prestations.append(Prestation(
        designation="Coffrets et protections AC",
        quantite=1,
        unite="Forfait",
        prix_unitaire=PRIX_PRESTATIONS["coffrets"],
        total=PRIX_PRESTATIONS["coffrets"]
    ))
    
    # 7. Main d'œuvre
    total_main_oeuvre = surface * PRIX_PRESTATIONS["main_oeuvre_m2"]
    prestations.append(Prestation(
        designation="Main d'œuvre installation",
        quantite=surface,
        unite="m²",
        prix_unitaire=PRIX_PRESTATIONS["main_oeuvre_m2"],
        total=total_main_oeuvre
    ))
    
    # 8. Monitoring et mise en service
    prestations.append(Prestation(
        designation="Monitoring et mise en service",
        quantite=1,
        unite="Forfait",
        prix_unitaire=PRIX_PRESTATIONS["monitoring"],
        total=PRIX_PRESTATIONS["monitoring"]
    ))
    
    return prestations

@app.get("/")
def read_root():
    return {
        "message": "API Devis Solaire Professionnel",
        "version": "2.0",
        "endpoints": ["/api/estimation", "/api/health"]
    }

@app.get("/api/health")
def health_check():
    return {"status": "OK", "timestamp": datetime.now().isoformat()}

@app.post("/api/estimation", response_model=DevisResponse)
def estimation_complete(data: EstimationRequest):
    """
    Génère une estimation complète avec devis détaillé
    """
    try:
        # Validation des données
        if data.surface <= 0:
            raise HTTPException(status_code=400, detail="La surface doit être positive")
        
        if data.type_installation not in INSTALLATION_DATA:
            raise HTTPException(status_code=400, detail="Type d'installation non valide")
        
        if not data.client.nom.strip():
            raise HTTPException(status_code=400, detail="Le nom du client est obligatoire")
        
        # Récupération des paramètres
        type_install = data.type_installation.lower()
        params = INSTALLATION_DATA[type_install]
        
        # Calculs techniques de base
        puissance_totale = data.surface * params["wc_m2"]  # en Wc
        puissance_kwc = puissance_totale / 1000  # en kWc
        nombre_panneaux = math.ceil(puissance_totale / params["panneau_wc"])
        nombre_onduleurs = math.ceil(nombre_panneaux / params["panneaux_par_onduleur"])
        
        # Production annuelle (facteur selon la région et orientation)
        facteur_production = 1.2  # kWh/Wc/an (moyenne France)
        production_annuelle = puissance_totale * facteur_production
        
        # Calcul des prestations détaillées
        prestations = calculer_prestations(
            data.surface, type_install, nombre_panneaux, nombre_onduleurs
        )
        
        # Calculs financiers
        sous_total_ht = sum(p.total for p in prestations)
        taux_tva = params["taux_tva"]
        tva = sous_total_ht * taux_tva
        total_ttc = sous_total_ht + tva
        
        # Calculs de rentabilité
        prix_electricite = 0.18  # €/kWh (tarif moyen)
        economie_annuelle = production_annuelle * prix_electricite
        retour_investissement = total_ttc / economie_annuelle if economie_annuelle > 0 else 0
        gain_20_ans = (economie_annuelle * 20) - total_ttc
        
        # Génération du numéro de devis
        numero_devis = generer_numero_devis()
        
        return DevisResponse(
            numero_devis=numero_devis,
            date_creation=datetime.now().strftime("%d/%m/%Y"),
            client=data.client,
            surface=data.surface,
            type_installation=data.type_installation,
            nombre_panneaux=nombre_panneaux,
            puissance_totale=round(puissance_totale, 2),
            puissance_kwc=round(puissance_kwc, 1),
            production_annuelle=round(production_annuelle, 0),
            prestations=prestations,
            sous_total_ht=round(sous_total_ht, 2),
            tva=round(tva, 2),
            taux_tva=taux_tva,
            total_ttc=round(total_ttc, 2),
            economie_annuelle=round(economie_annuelle, 0),
            retour_investissement=round(retour_investissement, 1),
            gain_20_ans=round(gain_20_ans, 0),
            besoin=data.besoin
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du calcul: {str(e)}")

@app.get("/api/types-installation")
def get_types_installation():
    """Retourne la liste des types d'installation disponibles"""
    return {
        "types": list(INSTALLATION_DATA.keys()),
        "details": {
            k: {
                "wc_par_m2": v["wc_m2"],
                "prix_par_wc": v["prix_wc"],
                "tva": f"{v['taux_tva']*100}%"
            }
            for k, v in INSTALLATION_DATA.items()
        }
    }

@app.get("/api/prestations-prix")
def get_prestations_prix():
    """Retourne le détail des prix des prestations"""
    return PRIX_PRESTATIONS

# Endpoint pour la compatibilité avec l'ancien frontend
@app.post("/api/estimation-simple")
def estimation_simple(data: dict):
    """
    Endpoint de compatibilité avec l'ancien format
    """
    try:
        # Conversion vers le nouveau format
        client_info = ClientInfo(
            nom=data.get("nom", "Client"),
            adresse="",
            email="",
            telephone=""
        )
        
        new_request = EstimationRequest(
            client=client_info,
            surface=float(data["surface"]),
            type_installation=data["type_installation"],
            besoin=data.get("besoin", "")
        )
        
        # Utilisation de la nouvelle fonction
        resultat_complet = estimation_complete(new_request)
        
        # Retour au format simple pour compatibilité
        return {
            "panneaux": resultat_complet.nombre_panneaux,
            "puissance": resultat_complet.puissance_totale,
            "prix": resultat_complet.total_ttc,
            "production_kwh": resultat_complet.production_annuelle,
            "roi": resultat_complet.retour_investissement
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du calcul: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# import math

# app = FastAPI()

# origins = ["https://frontent-foub.onrender.com"]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# class EstimationRequest(BaseModel):
#     surface: float
#     type_installation: str
#     besoin: str = ""

# INSTALLATION_DATA = {
#     "résidentiel": {"wc_m2": 170, "prix_wc": 1.2, "panneau": 400},
#     "agricole": {"wc_m2": 150, "prix_wc": 1.0, "panneau": 450},
#     "industriel": {"wc_m2": 130, "prix_wc": 0.9, "panneau": 500}
# }

# @app.post("/api/estimation")
# def estimation(data: EstimationRequest):
#     type_install = data.type_installation.lower()
#     surface = data.surface

#     params = INSTALLATION_DATA.get(type_install, INSTALLATION_DATA["résidentiel"])

#     puissance_totale = surface * params["wc_m2"]
#     nombre_panneaux = math.ceil(puissance_totale / params["panneau"])
#     prix_total = puissance_totale * params["prix_wc"]

#     # Production annuelle (kWh) estimée (facteur : 1.2 kWh/Wc/an)
#     production_kwh = puissance_totale * 1.2

#     # Retour sur investissement (années) basé sur économie 0.18 €/kWh
#     economie_annuelle = production_kwh * 0.18
#     roi = prix_total / economie_annuelle if economie_annuelle else 0

#     return {
#         "puissance": round(puissance_totale, 2),
#         "panneaux": nombre_panneaux,
#         "prix": round(prix_total, 2),
#         "production_kwh": round(production_kwh, 2),
#         "roi": round(roi, 2)
#     }