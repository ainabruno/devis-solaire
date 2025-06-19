import { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";

export default function App() {
  const [surface, setSurface] = useState("");
  const [type, setType] = useState("résidentiel");
  const [besoin, setBesoin] = useState("");
  const [resultat, setResultat] = useState(null);

  const calculer = async () => {
    try {
      const res = await axios.post(
        "https://devis-solaire-backend.onrender.com/api/estimation",
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
    doc.text("Devis Installation Solaire", 20, 20);
    doc.text(`Surface : ${surface} m²`, 20, 30);
    doc.text(`Type : ${type}`, 20, 40);
    doc.text(`Besoins : ${besoin}`, 20, 50);
    doc.text(`Nombre de panneaux : ${resultat.panneaux}`, 20, 60);
    doc.text(`Puissance estimée : ${resultat.puissance} Wc`, 20, 70);
    doc.text(`Prix total : ${resultat.prix} €`, 20, 80);
    doc.save("devis-solaire.pdf");
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 shadow rounded bg-white space-y-4">
      <h1 className="text-2xl font-bold">Générateur de Devis Solaire</h1>

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
          <p>
            <strong>Panneaux :</strong> {resultat.panneaux}
          </p>
          <p>
            <strong>Puissance :</strong> {resultat.puissance} Wc
          </p>
          <p>
            <strong>Prix estimé :</strong> {resultat.prix} €
          </p>
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
