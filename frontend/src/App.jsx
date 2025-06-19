// FRONTEND - React (App.jsx)
import { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";

export default function App() {
  const [surface, setSurface] = useState("");
  const [type, setType] = useState("résidentiel");
  const [besoin, setBesoin] = useState("");
  const [nom, setNom] = useState("");
  const [resultat, setResultat] = useState(null);

  const calculer = async () => {
    try {
      const res = await axios.post(
        "https://devis-solaire.onrender.com/api/estimation",
        {
          surface: parseFloat(surface),
          type_installation: type,
          besoin,
        }
      );
      setResultat(res.data);
    } catch (error) {
      console.error("Erreur lors du calcul:", error);
      alert("Erreur lors du calcul. Veuillez réessayer.");
    }
  };

  const exportPDF = () => {
    if (!resultat) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Devis Installation Solaire", 20, 20);
    doc.setFontSize(12);
    doc.text(`Date : ${new Date().toLocaleDateString()}`, 150, 20);
    doc.text(`Nom du client : ${nom}`, 20, 30);
    doc.text(`Surface du toit : ${surface} m²`, 20, 40);
    doc.text(`Type d'installation : ${type}`, 20, 50);
    doc.text(`Besoins : ${besoin}`, 20, 60);
    doc.text(`Nombre de panneaux : ${resultat.panneaux}`, 20, 70);
    doc.text(`Puissance estimée : ${resultat.puissance} Wc`, 20, 80);
    doc.text(`Production annuelle : ${resultat.production_kwh} kWh`, 20, 90);
    doc.text(`Prix total : ${resultat.prix} €`, 20, 100);
    doc.text(`Retour sur investissement : ${resultat.roi} ans`, 20, 110);
    doc.save("devis-solaire.pdf");
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 shadow rounded bg-white space-y-4">
      <h1 className="text-2xl font-bold">Générateur de Devis Solaire</h1>

      <input
        type="text"
        placeholder="Nom du client"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        className="border p-2 w-full"
      />

      <input
        type="number"
        placeholder="Surface du toit (m²)"
        value={surface}
        onChange={(e) => setSurface(e.target.value)}
        className="border p-2 w-full"
      />

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="border p-2 w-full"
      >
        <option value="résidentiel">Résidentiel</option>
        <option value="agricole">Agricole</option>
        <option value="industriel">Industriel</option>
      </select>

      <input
        type="text"
        placeholder="Besoins (éclairage, machines...)"
        value={besoin}
        onChange={(e) => setBesoin(e.target.value)}
        className="border p-2 w-full"
      />

      <button
        onClick={calculer}
        className="bg-blue-500 text-white p-2 rounded w-full"
      >
        Calculer
      </button>

      {resultat && (
        <div className="border p-4 mt-4 rounded bg-gray-50">
          <p><strong>Panneaux :</strong> {resultat.panneaux}</p>
          <p><strong>Puissance :</strong> {resultat.puissance} Wc</p>
          <p><strong>Production annuelle :</strong> {resultat.production_kwh} kWh</p>
          <p><strong>Prix estimé :</strong> {resultat.prix} €</p>
          <p><strong>Retour sur investissement :</strong> {resultat.roi} ans</p>
          <button
            onClick={exportPDF}
            className="mt-3 bg-green-600 text-white p-2 rounded"
          >
            Exporter en PDF
          </button>
        </div>
      )}
    </div>
  );
}