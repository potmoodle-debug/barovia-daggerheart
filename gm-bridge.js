(() => {
  const url=String(window.BAROVIA_PUBLIC_FEED_URL||"").trim();
  const key=String(window.BAROVIA_PUBLIC_FEED_KEY||"").trim();
  if(!url||!key)return;

  function validArray(value){return Array.isArray(value)?value:undefined}

  fetch(url,{
    headers:{
      "Accept":"application/json",
      "apikey":key
    },
    cache:"no-store"
  })
    .then(r=>{if(!r.ok)throw new Error("Player snapshot request failed: "+r.status);return r.json();})
    .then(rows=>{
      const payload=Array.isArray(rows)?rows[0]?.payload:rows?.payload;
      if(!payload||typeof payload!=="object")return;
      const clean={
        state:payload&&typeof payload.state==="object"?payload.state:undefined,
        threads:validArray(payload.threads),
        discoveries:validArray(payload.discoveries),
        records:payload&&typeof payload.records==="object"?payload.records:undefined,
        categories:payload&&typeof payload.categories==="object"?payload.categories:undefined,
        edges:validArray(payload.edges),
        publishedAt:payload.publishedAt||null,
        revision:payload.revision||null
      };
      window.dispatchEvent(new CustomEvent("barovia:player-snapshot",{detail:clean}));
    })
    .catch(err=>{
      console.warn("Barovia is using its local player-safe snapshot.",err.message);
    });
})();