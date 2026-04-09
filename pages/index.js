import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function Home() {
  const [mode, setMode] = useState("office");
  const [selectedPier, setSelectedPier] = useState("P1");

  const [productions, setProductions] = useState([]);
  const [steel, setSteel] = useState([]);
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState([]);

  const [productionName, setProductionName] = useState("");
  const [productionQty, setProductionQty] = useState("");

  const [steelName, setSteelName] = useState("");
  const [steelQty, setSteelQty] = useState("");
  const [steelType, setSteelType] = useState("giriş");

  const [logText, setLogText] = useState("");

  const [progressItem, setProgressItem] = useState("");
  const [progressTotal, setProgressTotal] = useState("");
  const [progressDone, setProgressDone] = useState("");

  async function loadData() {
    const { data: p1 } = await supabase.from("productions").select("*");
    const { data: p2 } = await supabase.from("steel_stock").select("*");
    const { data: p3 } = await supabase
      .from("daily_logs")
      .select("*")
      .order("created_at", { ascending: false });
    const { data: p4 } = await supabase.from("progress").select("*");

    setProductions(p1 || []);
    setSteel(p2 || []);
    setLogs(p3 || []);
    setProgress(p4 || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function addProduction() {
    if (!productionName || !productionQty) return;

    await supabase.from("productions").insert([
      {
        name: productionName,
        quantity: Number(productionQty),
        pier: selectedPier,
      },
    ]);

    setProductionName("");
    setProductionQty("");
    loadData();
  }

  async function addSteel() {
    if (!steelName || !steelQty) return;

    await supabase.from("steel_stock").insert([
      {
        name: steelName,
        quantity: Number(steelQty),
        type: steelType,
        pier: selectedPier,
      },
    ]);

    setSteelName("");
    setSteelQty("");
    setSteelType("giriş");
    loadData();
  }

  async function addLog() {
    if (!logText) return;

    await supabase.from("daily_logs").insert([
      {
        description: logText,
        pier: selectedPier,
      },
    ]);

    setLogText("");
    loadData();
  }

  async function addProgress() {
    if (!progressItem || !progressTotal || !progressDone) return;

    await supabase.from("progress").insert([
      {
        item: progressItem,
        total_quantity: Number(progressTotal),
        completed_quantity: Number(progressDone),
        pier: selectedPier,
      },
    ]);

    setProgressItem("");
    setProgressTotal("");
    setProgressDone("");
    loadData();
  }

  const filteredProductions = productions.filter(
    (item) => (item.pier || "P1") === selectedPier
  );

  const filteredSteel = steel.filter(
    (item) => (item.pier || "P1") === selectedPier
  );

  const filteredLogs = logs.filter(
    (item) => (item.pier || "P1") === selectedPier
  );

  const filteredProgress = progress.filter(
    (item) => (item.pier || "P1") === selectedPier
  );

  const totalProduction = filteredProductions.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const totalSteel = filteredSteel.reduce((sum, item) => {
    const qty = Number(item.quantity || 0);
    return item.type === "çıkış" ? sum - qty : sum + qty;
  }, 0);

  const avgProgress =
    filteredProgress.length > 0
      ? (
          filteredProgress.reduce((sum, item) => {
            const total = Number(item.total_quantity || 0);
            const done = Number(item.completed_quantity || 0);
            if (!total) return sum;
            return sum + (done / total) * 100;
          }, 0) / filteredProgress.length
        ).toFixed(1)
      : "0";

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto", fontFamily: "Arial" }}>
      <h1>Şantiye Takip Sistemi</h1>

      <div style={{ marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={() => setMode("office")}>Ofis Modu</button>
        <button onClick={() => setMode("chief")}>Şantiye Şefi Modu</button>

        <select
          value={selectedPier}
          onChange={(e) => setSelectedPier(e.target.value)}
        >
          <option value="P1">P1</option>
          <option value="P2">P2</option>
          <option value="P3">P3</option>
          <option value="P4">P4</option>
        </select>
      </div>

      <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
        <h2>Genel Durum - {selectedPier}</h2>
        <p>Toplam İmalat: {totalProduction}</p>
        <p>Toplam Demir Stok: {totalSteel}</p>
        <p>Ortalama Hakediş: %{avgProgress}</p>

        <div style={{ marginTop: 20 }}>
          <Chart
            options={{
              chart: { id: "imalat-grafigi", toolbar: { show: false } },
              xaxis: {
                categories: filteredProductions.map((p) => p.name),
              },
              dataLabels: {
                enabled: true,
              },
            }}
            series={[
              {
                name: `${selectedPier} İmalat`,
                data: filteredProductions.map((p) => Number(p.quantity || 0)),
              },
            ]}
            type="bar"
            width="100%"
            height={320}
          />
        </div>
      </div>

      {mode === "chief" ? (
        <>
          <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
            <h2>İmalat Girişi - {selectedPier}</h2>
            <input
              placeholder="İmalat adı"
              value={productionName}
              onChange={(e) => setProductionName(e.target.value)}
            />
            <input
              placeholder="Miktar"
              type="number"
              value={productionQty}
              onChange={(e) => setProductionQty(e.target.value)}
              style={{ marginLeft: 8 }}
            />
            <button onClick={addProduction} style={{ marginLeft: 8 }}>
              Kaydet
            </button>
          </div>

          <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
            <h2>Demir Stok Girişi - {selectedPier}</h2>
            <input
              placeholder="Malzeme adı"
              value={steelName}
              onChange={(e) => setSteelName(e.target.value)}
            />
            <input
              placeholder="Miktar"
              type="number"
              value={steelQty}
              onChange={(e) => setSteelQty(e.target.value)}
              style={{ marginLeft: 8 }}
            />
            <select
              value={steelType}
              onChange={(e) => setSteelType(e.target.value)}
              style={{ marginLeft: 8 }}
            >
              <option value="giriş">giriş</option>
              <option value="çıkış">çıkış</option>
            </select>
            <button onClick={addSteel} style={{ marginLeft: 8 }}>
              Kaydet
            </button>
          </div>

          <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
            <h2>Hakediş Girişi - {selectedPier}</h2>
            <input
              placeholder="İş kalemi"
              value={progressItem}
              onChange={(e) => setProgressItem(e.target.value)}
            />
            <input
              placeholder="Toplam miktar"
              type="number"
              value={progressTotal}
              onChange={(e) => setProgressTotal(e.target.value)}
              style={{ marginLeft: 8 }}
            />
            <input
              placeholder="Tamamlanan miktar"
              type="number"
              value={progressDone}
              onChange={(e) => setProgressDone(e.target.value)}
              style={{ marginLeft: 8 }}
            />
            <button onClick={addProgress} style={{ marginLeft: 8 }}>
              Kaydet
            </button>
          </div>

          <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
            <h2>Günlük Rapor - {selectedPier}</h2>
            <textarea
              rows={4}
              style={{ width: "100%" }}
              value={logText}
              onChange={(e) => setLogText(e.target.value)}
              placeholder="Bugün yapılan işleri yaz"
            />
            <button onClick={addLog} style={{ marginTop: 10 }}>
              Kaydet
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
            <h2>İmalatlar - {selectedPier}</h2>
            {filteredProductions.length === 0 ? (
              <p>Kayıt yok</p>
            ) : (
              filteredProductions.map((item) => (
                <div key={item.id}>
                  {item.name} - {item.quantity}
                </div>
              ))
            )}
          </div>

          <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
            <h2>Demir Stok - {selectedPier}</h2>
            {filteredSteel.length === 0 ? (
              <p>Kayıt yok</p>
            ) : (
              filteredSteel.map((item) => (
                <div key={item.id}>
                  {item.name} - {item.quantity} ({item.type})
                </div>
              ))
            )}
          </div>

          <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
            <h2>Hakediş - {selectedPier}</h2>
            {filteredProgress.length === 0 ? (
              <p>Kayıt yok</p>
            ) : (
              filteredProgress.map((item) => {
                const total = Number(item.total_quantity || 0);
                const done = Number(item.completed_quantity || 0);
                const percent = total ? ((done / total) * 100).toFixed(1) : "0";
                return (
                  <div key={item.id}>
                    {item.item} - %{percent}
                  </div>
                );
              })
            )}
          </div>

          <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
            <h2>Günlük Raporlar - {selectedPier}</h2>
            {filteredLogs.length === 0 ? (
              <p>Rapor yok</p>
            ) : (
              filteredLogs.map((item) => (
                <div key={item.id} style={{ marginBottom: 10 }}>
                  <strong>{item.created_at}</strong>
                  <div>{item.description}</div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
