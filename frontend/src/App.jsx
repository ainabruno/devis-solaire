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
    const lineHeight = 10;
    const today = new Date();
    const dateFormatted = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    let y = 20;

    doc.setFontSize(18);
    doc.text("FACTURE DEVIS INSTALLATION SOLAIRE", 20, y);
    y += lineHeight;

    doc.setFontSize(12);
    doc.text(`Date : ${dateFormatted}`, 150, 20);


    y += lineHeight * 2;

    doc.setFont("helvetica", "bold");
    doc.text("Informations client", 20, y);
    y += lineHeight;

    doc.setFont("helvetica", "normal");
    doc.text(`Nom : ${nom}`, 20, y);
    y += lineHeight;
    doc.text(`Type d'installation : ${type}`, 20, y);
    y += lineHeight;
    doc.text(`Surface du toit : ${surface} m²`, 20, y);
    y += lineHeight;
    doc.text(`Besoins : ${besoin}`, 20, y);
    y += lineHeight * 2;

    doc.setFont("helvetica", "bold");
    doc.text("Détails de l'installation", 20, y);
    y += lineHeight;

    doc.setFont("helvetica", "normal");
    doc.text(`Nombre de panneaux : ${resultat.panneaux}`, 20, y);
    y += lineHeight;
    doc.text(`Puissance estimée : ${resultat.puissance} Wc`, 20, y);
    y += lineHeight;

    const prod = resultat.production_kwh !== undefined ? `${resultat.production_kwh} kWh` : "N/A";
    const roi = resultat.roi !== undefined ? `${resultat.roi} ans` : "N/A";

    doc.text(`Production annuelle estimée : ${prod}`, 20, y);
    y += lineHeight;

    doc.text(`Retour sur investissement : ${roi}`, 20, y);
    y += lineHeight * 2;

    doc.setFont("helvetica", "bold");
    doc.text(`Total à payer : ${resultat.prix} €`, 20, y);

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