import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Dashboard() {
  const [productions, setProductions] = useState([]);
  const [steel, setSteel] = useState([]);
  const [progress, setProgress] = useState([]);

  const getData = async () => {
    const { data: prod } = await supabase.from("productions").select("*");
    const { data: steelData } = await supabase.from("steel_stock").select("*");
    const { data: prog } = await supabase.from("progress").select("*");

    setProductions(prod || []);
    setSteel(steelData || []);
    setProgress(prog || []);
  };

  useEffect(() => {
    getData();
  }, []);

  // toplam imalat
  const totalProduction = productions.reduce((a, b) => a + Number(b.quantity || 0), 0);

  // toplam demir
  const totalSteel = steel.reduce((a, b) => {
    return b.type === "çıkış"
      ? a - Number(b.quantity || 0)
      : a + Number(b.quantity || 0);
  }, 0);

  // hakediş %
  const totalProgress = progress.reduce((acc, item) => {
    if (!item.total_quantity) return acc;
    return acc + (item.completed_quantity / item.total_quantity) * 100;
  }, 0);

  const avgProgress = progress.length ? (totalProgress / progress.length).toFixed(1) : 0;

  return (
    <div style={{ padding: 20 }}>
      <h1>🏗️ Şantiye Dashboard</h1>

      <h2>📊 Genel Durum</h2>
      <p>Toplam İmalat: {totalProduction}</p>
      <p>Demir Stok: {totalSteel}</p>
      <p>Hakediş: %{avgProgress}</p>

      <hr />

      <h2>🏗️ İmalatlar</h2>
      {productions.map((p, i) => (
        <div key={i}>
          {p.name} - {p.quantity}
        </div>
      ))}

      <hr />

      <h2>📦 Demir Stok</h2>
      {steel.map((s, i) => (
        <div key={i}>
          {s.name} - {s.quantity} ({s.type})
        </div>
      ))}

      <hr />

      <h2>💰 Hakediş Detay</h2>
      {progress.map((p, i) => (
        <div key={i}>
          {p.item} → %{((p.completed_quantity / p.total_quantity) * 100).toFixed(1)}
        </div>
      ))}
    </div>
  );
}
