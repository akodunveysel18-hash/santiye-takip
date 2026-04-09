import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Home() {
  const [data, setData] = useState([]);

  const getData = async () => {
    const { data } = await supabase.from("productions").select("*");
    setData(data || []);
  };

  const addData = async () => {
    await supabase.from("productions").insert([
      { name: "Beton", quantity: Math.floor(Math.random() * 100) }
    ]);
    getData();
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Şantiye Takip Sistemi</h1>
      <button onClick={addData}>Rastgele İmalat Ekle</button>

      {data.map((item, i) => (
        <div key={i}>
          {item.name} - {item.quantity}
        </div>
      ))}
    </div>
  );
}
