import { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";

const mockAxios = {
  post: async (url, data) => {
    const INSTALLATION_DATA = {
      résidentiel: { wc_m2: 170, prix_wc: 1.2, panneau: 400 },
      agricole: { wc_m2: 150, prix_wc: 1.0, panneau: 450 },
      industriel: { wc_m2: 130, prix_wc: 0.9, panneau: 500 }
    };

    const params = INSTALLATION_DATA[data.type_installation] || INSTALLATION_DATA.résidentiel;
    const puissance_totale = data.surface * params.wc_m2;
    const nombre_panneaux = Math.ceil(puissance_totale / params.panneau);
    const prix_total = puissance_totale * params.prix_wc;
    const production_kwh = puissance_totale * 1.2;
    const economie_annuelle = production_kwh * 0.18;
    const roi = economie_annuelle ? prix_total / economie_annuelle : 0;

    return {
      data: {
        puissance: Math.round(puissance_totale * 100) / 100,
        panneaux: nombre_panneaux,
        prix: Math.round(prix_total * 100) / 100,
        production_kwh: Math.round(production_kwh * 100) / 100,
        roi: Math.round(roi * 100) / 100
      }
    };
  }
};

export default function App() {
  const [surface, setSurface] = useState("");
  const [type, setType] = useState("résidentiel");
  const [besoin, setBesoin] = useState("");
  const [nom, setNom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [resultat, setResultat] = useState(null);

  const calculer = async () => {
    try {
      const res = await axios.post("https://devis-solaire.onrender.com/api/estimation", {
        surface: parseFloat(surface),
        type_installation: type,
        besoin
      });
      setResultat(res.data);
    } catch (error) {
      console.error("Erreur lors du calcul:", error);
      alert("Erreur lors du calcul. Veuillez réessayer.");
    }
  };

  const exportPDF = () => {
    if (!resultat) return;

    const doc = new jsPDF();
    const today = new Date();
    const dateFormatted = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    let y = 20;
    const leftMargin = 20;
    const rightMargin = 190;
    const lineHeight = 8;

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("SOLAIRE ENERGY", leftMargin, y);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Installation & Maintenance Photovoltaïque", leftMargin, y + 8);
    doc.text("contact@solaire-energy.fr | 01 23 45 67 89", leftMargin, y + 16);
    doc.text(`Date : ${dateFormatted}`, rightMargin - 50, y);
    doc.text(`Devis N° : DEV-${Date.now().toString().slice(-6)}`, rightMargin - 50, y + 8);

    y += 35;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("DEVIS INSTALLATION PHOTOVOLTAÏQUE", leftMargin, y);
    y += 15;

    doc.setFontSize(12);
    doc.text("INFORMATIONS CLIENT", leftMargin, y);
    doc.line(leftMargin, y + 2, rightMargin, y + 2);
    y += 10;
    doc.setFontSize(10);
    doc.text(`Nom : ${nom}`, leftMargin, y);
    doc.text(`Adresse : ${adresse}`, leftMargin, y + lineHeight);
    doc.text(`Email : ${email}`, leftMargin, y + lineHeight * 2);
    doc.text(`Téléphone : ${telephone}`, leftMargin, y + lineHeight * 3);
    doc.text(`Type d'installation : ${type}`, leftMargin, y + lineHeight * 4);

    y += lineHeight * 6;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("CARACTÉRISTIQUES DU PROJET", leftMargin, y);
    doc.line(leftMargin, y + 2, rightMargin, y + 2);
    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Surface de toiture disponible : ${surface} m²`, leftMargin, y);
    doc.text(`Nombre de modules : ${resultat.panneaux}`, leftMargin, y + lineHeight);
    doc.text(`Puissance du module : 400 Wc`, leftMargin, y + lineHeight * 2);
    doc.text(`Puissance totale du projet : ${(resultat.puissance / 1000).toFixed(1)} kWc`, leftMargin, y + lineHeight * 3);
    doc.text(`Production annuelle estimée : ${resultat.production_kwh} kWh/an`, leftMargin, y + lineHeight * 4);
    doc.text(`Besoins spécifiques : ${besoin}`, leftMargin, y + lineHeight * 5);

    y += lineHeight * 7;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DÉTAIL DES PRESTATIONS", leftMargin, y);
    doc.line(leftMargin, y + 2, rightMargin, y + 2);
    y += 12;

    const prestations = [
      { desc: "Ingénierie + DOE", qte: "1", unit: "Forfait", prixUnit: "2000.00", total: "2000.00" },
      { desc: "Modules photovoltaïques 400Wc", qte: resultat.panneaux.toString(), unit: "U", prixUnit: "280.00", total: (resultat.panneaux * 280).toFixed(2) },
      { desc: "Onduleurs + protection DC", qte: Math.ceil(resultat.panneaux / 20).toString(), unit: "U", prixUnit: "1200.00", total: (Math.ceil(resultat.panneaux / 20) * 1200).toFixed(2) },
      { desc: "Structure de fixation", qte: resultat.panneaux.toString(), unit: "U", prixUnit: "45.00", total: (resultat.panneaux * 45).toFixed(2) },
      { desc: "Câblage DC et AC", qte: "1", unit: "Forfait", prixUnit: "800.00", total: "800.00" },
      { desc: "Coffrets et protections AC", qte: "1", unit: "Forfait", prixUnit: "1500.00", total: "1500.00" },
      { desc: "Main d'œuvre installation", qte: surface, unit: "m²", prixUnit: "35.00", total: (parseFloat(surface) * 35).toFixed(2) },
      { desc: "Monitoring et mise en service", qte: "1", unit: "Forfait", prixUnit: "800.00", total: "800.00" }
    ];

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("DÉSIGNATION", leftMargin, y);
    doc.text("QTÉ", leftMargin + 80, y);
    doc.text("UNITÉ", leftMargin + 100, y);
    doc.text("P.U. HT", leftMargin + 125, y);
    doc.text("TOTAL HT", leftMargin + 155, y);
    doc.line(leftMargin, y + 2, rightMargin, y + 2);
    y += 8;

    doc.setFont("helvetica", "normal");
    let sousTotal = 0;
    prestations.forEach(prestation => {
      doc.text(prestation.desc, leftMargin, y);
      doc.text(prestation.qte, leftMargin + 80, y);
      doc.text(prestation.unit, leftMargin + 100, y);
      doc.text(prestation.prixUnit + " €", leftMargin + 125, y);
      doc.text(prestation.total + " €", leftMargin + 155, y);
      sousTotal += parseFloat(prestation.total);
      y += 6;
    });

    y += 5;
    doc.line(leftMargin, y, rightMargin, y);
    y += 8;

    const tva = sousTotal * 0.10;
    const totalTTC = sousTotal + tva;

    doc.setFont("helvetica", "bold");
    doc.text(`Sous-total HT : ${sousTotal.toFixed(2)} €`, leftMargin + 100, y);
    y += 6;
    doc.text(`TVA 10% : ${tva.toFixed(2)} €`, leftMargin + 100, y);
    y += 6;
    doc.setFontSize(11);
    doc.text(`TOTAL TTC : ${totalTTC.toFixed(2)} €`, leftMargin + 100, y);
    y += 15;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RENTABILITÉ", leftMargin, y);
    doc.line(leftMargin, y + 2, rightMargin, y + 2);
    y += 10;

    const economieAnnuelle = resultat.production_kwh * 0.18;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Économie annuelle estimée : ${economieAnnuelle.toFixed(0)} €`, leftMargin, y);
    doc.text(`Retour sur investissement : ${resultat.roi} ans`, leftMargin, y + lineHeight);
    doc.text(`Gain sur 20 ans : ${(economieAnnuelle * 20 - totalTTC).toFixed(0)} €`, leftMargin, y + lineHeight * 2);
    y += lineHeight * 4;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("CONDITIONS :", leftMargin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text("• Devis valable 30 jours", leftMargin, y);
    doc.text("• Acompte de 30% à la commande", leftMargin, y + 4);
    doc.text("• Solde à la mise en service", leftMargin, y + 8);
    doc.text("• Garantie produit : 12 ans | Garantie performance : 25 ans", leftMargin, y + 12);

    const filename = `devis-solaire-${nom.replace(/\s+/g, '-')}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 shadow-lg rounded-lg bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-800 mb-2">Générateur de Devis Solaire</h1>
        <p className="text-gray-600">Créez un devis professionnel pour votre installation photovoltaïque</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Informations client */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Informations Client</h3>
          
          <input
            type="text"
            placeholder="Nom complet du client"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="border border-gray-300 p-3 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <input
            type="text"
            placeholder="Adresse complète"
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            className="border border-gray-300 p-3 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 p-3 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <input
            type="tel"
            placeholder="Téléphone"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className="border border-gray-300 p-3 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Caractéristiques du projet */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Caractéristiques du Projet</h3>
          
          <input
            type="number"
            placeholder="Surface du toit disponible (m²)"
            value={surface}
            onChange={(e) => setSurface(e.target.value)}
            className="border border-gray-300 p-3 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border border-gray-300 p-3 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="résidentiel">Résidentiel</option>
            <option value="agricole">Agricole</option>
            <option value="industriel">Industriel</option>
          </select>

          <textarea
            placeholder="Besoins spécifiques (éclairage, équipements, machines...)"
            value={besoin}
            onChange={(e) => setBesoin(e.target.value)}
            rows="3"
            className="border border-gray-300 p-3 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <button
        onClick={calculer}
        disabled={!surface || !nom}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-3 rounded-md w-full font-semibold text-lg transition-colors"
      >
        Calculer le Devis
      </button>

      {resultat && (
        <div className="mt-8 border border-gray-200 rounded-lg p-6 bg-gray-50">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Résultats de l'Estimation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{resultat.panneaux}</div>
              <div className="text-sm text-gray-600">Panneaux solaires</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">{(resultat.puissance / 1000).toFixed(1)} kWc</div>
              <div className="text-sm text-gray-600">Puissance installée</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-yellow-600">{resultat.production_kwh} kWh</div>
              <div className="text-sm text-gray-600">Production annuelle</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-red-600">{resultat.prix.toLocaleString()} €</div>
              <div className="text-sm text-gray-600">Prix estimé HT</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-purple-600">{resultat.roi} ans</div>
              <div className="text-sm text-gray-600">Retour sur investissement</div>
            </div>
          </div>

          <button
            onClick={exportPDF}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white p-3 rounded-md font-semibold w-full md:w-auto transition-colors"
          >
            📄 Exporter le Devis PDF Complet
          </button>
        </div>
      )}
    </div>
  );
}



// export default function App() {
//   const [surface, setSurface] = useState("");
//   const [type, setType] = useState("résidentiel");
//   const [besoin, setBesoin] = useState("");
//   const [nom, setNom] = useState("");
//   const [resultat, setResultat] = useState(null);

//   const calculer = async () => {
//     try {
//       const res = await axios.post(
//         "https://devis-solaire.onrender.com/api/estimation",
//         {
//           surface: parseFloat(surface),
//           type_installation: type,
//           besoin,
//         }
//       );
//       setResultat(res.data);
//     } catch (error) {
//       console.error("Erreur lors du calcul:", error);
//       alert("Erreur lors du calcul. Veuillez réessayer.");
//     }
//   };

//   const exportPDF = () => {
//     if (!resultat) return;

//     const doc = new jsPDF();
//     const lineHeight = 10;
//     const today = new Date();
//     const dateFormatted = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
//     let y = 20;

//     doc.setFontSize(18);
//     doc.text("FACTURE DEVIS INSTALLATION SOLAIRE", 20, y);
//     y += lineHeight;

//     doc.setFontSize(12);
//     doc.text(`Date : ${dateFormatted}`, 150, 20);


//     y += lineHeight * 2;

//     doc.setFont("helvetica", "bold");
//     doc.text("Informations client", 20, y);
//     y += lineHeight;

//     doc.setFont("helvetica", "normal");
//     doc.text(`Nom : ${nom}`, 20, y);
//     y += lineHeight;
//     doc.text(`Type d'installation : ${type}`, 20, y);
//     y += lineHeight;
//     doc.text(`Surface du toit : ${surface} m²`, 20, y);
//     y += lineHeight;
//     doc.text(`Besoins : ${besoin}`, 20, y);
//     y += lineHeight * 2;

//     doc.setFont("helvetica", "bold");
//     doc.text("Détails de l'installation", 20, y);
//     y += lineHeight;

//     doc.setFont("helvetica", "normal");
//     doc.text(`Nombre de panneaux : ${resultat.panneaux}`, 20, y);
//     y += lineHeight;
//     doc.text(`Puissance estimée : ${resultat.puissance} Wc`, 20, y);
//     y += lineHeight;

//     const prod = resultat.production_kwh !== undefined ? `${resultat.production_kwh} kWh` : "N/A";
//     const roi = resultat.roi !== undefined ? `${resultat.roi} ans` : "N/A";

//     doc.text(`Production annuelle estimée : ${prod}`, 20, y);
//     y += lineHeight;

//     doc.text(`Retour sur investissement : ${roi}`, 20, y);
//     y += lineHeight * 2;

//     doc.setFont("helvetica", "bold");
//     doc.text(`Total à payer : ${resultat.prix} €`, 20, y);

//     doc.save("devis-solaire.pdf");
//   };


//   return (
//     <div className="max-w-xl mx-auto mt-10 p-6 shadow rounded bg-white space-y-4">
//       <h1 className="text-2xl font-bold">Générateur de Devis Solaire</h1>

//       <input
//         type="text"
//         placeholder="Nom du client"
//         value={nom}
//         onChange={(e) => setNom(e.target.value)}
//         className="border p-2 w-full"
//       />

//       <input
//         type="number"
//         placeholder="Surface du toit (m²)"
//         value={surface}
//         onChange={(e) => setSurface(e.target.value)}
//         className="border p-2 w-full"
//       />

//       <select
//         value={type}
//         onChange={(e) => setType(e.target.value)}
//         className="border p-2 w-full"
//       >
//         <option value="résidentiel">Résidentiel</option>
//         <option value="agricole">Agricole</option>
//         <option value="industriel">Industriel</option>
//       </select>

//       <input
//         type="text"
//         placeholder="Besoins (éclairage, machines...)"
//         value={besoin}
//         onChange={(e) => setBesoin(e.target.value)}
//         className="border p-2 w-full"
//       />

//       <button
//         onClick={calculer}
//         className="bg-blue-500 text-white p-2 rounded w-full"
//       >
//         Calculer
//       </button>

//       {resultat && (
//         <div className="border p-4 mt-4 rounded bg-gray-50">
//           <p><strong>Panneaux :</strong> {resultat.panneaux}</p>
//           <p><strong>Puissance :</strong> {resultat.puissance} Wc</p>
//           <p><strong>Production annuelle :</strong> {resultat.production_kwh} kWh</p>
//           <p><strong>Prix estimé :</strong> {resultat.prix} €</p>
//           <p><strong>Retour sur investissement :</strong> {resultat.roi} ans</p>
//           <button
//             onClick={exportPDF}
//             className="mt-3 bg-green-600 text-white p-2 rounded"
//           >
//             Exporter en PDF
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }
// import { useState } from "react";

// Simulation d'axios pour la démo