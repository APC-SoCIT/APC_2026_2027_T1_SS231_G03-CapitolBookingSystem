// Simple analytics dashboard demo with auto-update simulation.
// Replace simulateUpdate() and expose receiveData() to feed real data.

(function(){
  const ctxPie = document.getElementById('ordersPie').getContext('2d');
  const ctxBar = document.getElementById('stackedBar').getContext('2d');
  const ctxInquiry = document.getElementById('inquiryLine').getContext('2d');

  // Application state (can be replaced by real API responses)
  const state = {
    facebook: 25,
    website: 40,
    other: 10,
    types: {
      functionRoom: {facebook: 8, website: 12},
      delivery: {facebook: 6, website: 18},
      catering: {facebook: 11, website: 10}
    },
    inquiries: { new: 4, resolved: 2, history: [] }
  };

  function totalOrders(){
    return state.facebook + state.website + state.other;
  }

  // Pie chart (facebook vs website vs other)
  const pie = new Chart(ctxPie, {
    type: 'pie',
    data: {
      labels: ['Facebook','Website','Other'],
      datasets: [{
        data: [state.facebook, state.website, state.other],
        backgroundColor: ['#3b82f6','#10b981','#9ca3af']
      }]
    },
    options: {
      responsive:true,
      plugins:{legend:{position:'bottom'}}
    }
  });

  // Stacked bar (types by source)
  const stacked = new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels: ['Function Room','Delivery','Catering'],
      datasets: [
        { label: 'Facebook', backgroundColor: '#3b82f6', data: [state.types.functionRoom.facebook, state.types.delivery.facebook, state.types.catering.facebook] },
        { label: 'Website', backgroundColor: '#10b981', data: [state.types.functionRoom.website, state.types.delivery.website, state.types.catering.website] }
      ]
    },
    options: {
      responsive:true,
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true }
      },
      plugins:{legend:{position:'bottom'}}
    }
  });

  // Inquiry line chart (history of new inquiries)
  const inquiryChart = new Chart(ctxInquiry, {
    type: 'line',
    data: { labels: [], datasets:[{ label: 'New inquiries', data: [], borderColor:'#f97316', backgroundColor:'rgba(249,115,22,0.15)', fill:true }] },
    options: { responsive:true, plugins:{legend:{display:false}}, scales:{x:{display:false}} }
  });

  // DOM elements
  const totalEl = document.getElementById('totalOrdersDisplay');
  const inNewEl = document.getElementById('inquiryNew');
  const inResEl = document.getElementById('inquiryResolved');

  function refreshDOM(){
    totalEl.textContent = `Total: ${totalOrders()}`;
    inNewEl.textContent = state.inquiries.new;
    inResEl.textContent = state.inquiries.resolved;
  }

  function updateCharts(){
    // pie
    pie.data.datasets[0].data = [state.facebook, state.website, state.other];
    pie.update();

    // stacked
    stacked.data.datasets[0].data = [state.types.functionRoom.facebook, state.types.delivery.facebook, state.types.catering.facebook];
    stacked.data.datasets[1].data = [state.types.functionRoom.website, state.types.delivery.website, state.types.catering.website];
    stacked.update();

    // inquiries history
    const ts = new Date().toLocaleTimeString();
    inquiryChart.data.labels.push(ts);
    inquiryChart.data.datasets[0].data.push(state.inquiries.new);
    if(inquiryChart.data.labels.length>20){ inquiryChart.data.labels.shift(); inquiryChart.data.datasets[0].data.shift(); }
    inquiryChart.update();

    refreshDOM();
  }

  // Simulate incoming data updates (for demo). Replace this with fetch() to your backend.
  function simulateUpdate(){
    // random increments for facebook/website
    const fbInc = Math.random() < 0.6 ? Math.floor(Math.random()*3) : 0;
    const webInc = Math.random() < 0.7 ? Math.floor(Math.random()*3) : 0;
    const otherInc = Math.random() < 0.2 ? Math.floor(Math.random()*2) : 0;
    state.facebook += fbInc;
    state.website += webInc;
    state.other += otherInc;

    // distribute type increments proportionally to sources
    const types = ['functionRoom','delivery','catering'];
    types.forEach(t => {
      const addFb = Math.random() < 0.4 ? Math.floor(Math.random()*2) : 0;
      const addWeb = Math.random() < 0.5 ? Math.floor(Math.random()*2) : 0;
      state.types[t].facebook += addFb;
      state.types[t].website += addWeb;
    });

    // inquiries
    const newIn = Math.random() < 0.5 ? Math.floor(Math.random()*2) : 0;
    const resolved = Math.random() < 0.3 ? Math.floor(Math.random()*2) : 0;
    state.inquiries.new += newIn;
    state.inquiries.resolved += resolved;
    state.inquiries.history.push({t:Date.now(), newIn, resolved});

    // Ensure totals consistent-ish: other = max(0, total - facebook - website)
    if(state.other < 0) state.other = 0;

    updateCharts();
  }

  // Expose a function to receive real data from outside. The expected shape:
  // { facebook: n, website: n, other: n, types: { functionRoom:{facebook,n website:n}, ... }, inquiries: { new:n, resolved:n } }
  window.receiveAnalytics = function(payload){
    try{
      if(typeof payload.facebook === 'number') state.facebook = payload.facebook;
      if(typeof payload.website === 'number') state.website = payload.website;
      if(typeof payload.other === 'number') state.other = payload.other;
      if(payload.types) Object.keys(payload.types).forEach(k=>{ if(state.types[k]) Object.assign(state.types[k], payload.types[k]); });
      if(payload.inquiries) Object.assign(state.inquiries, payload.inquiries);
      updateCharts();
    }catch(e){ console.error('receiveAnalytics error', e); }
  };

  // Start simulation and initial render
  updateCharts();
  setInterval(simulateUpdate, 5000);

  // --- Polling / API wiring helpers ---
  // These helpers let you configure polling for real analytics endpoints.
  // They are NOT started automatically. Call `analyticsPolling.start()` to begin.
  let _pollTimer = null;
  let _pollConfig = { url: './mock_data.json', interval: 10000, fetchOptions: {} };

  async function fetchAndApply(url){
    try{
      const res = await fetch(url, _pollConfig.fetchOptions);
      if(!res.ok) throw new Error('Network response was not ok');
      const payload = await res.json();
      // Apply payload using the existing receiveAnalytics hook
      if(window.receiveAnalytics) window.receiveAnalytics(payload);
      return payload;
    }catch(err){
      console.warn('analytics fetch failed', err);
      return null;
    }
  }

  function startPolling(){
    if(_pollTimer) return; // already running
    // run once immediately then every interval
    fetchAndApply(_pollConfig.url);
    _pollTimer = setInterval(()=> fetchAndApply(_pollConfig.url), _pollConfig.interval);
    console.info('analytics polling started', _pollConfig);
  }

  function stopPolling(){
    if(!_pollTimer) return;
    clearInterval(_pollTimer);
    _pollTimer = null;
    console.info('analytics polling stopped');
  }

  function configurePolling(opts){
    if(typeof opts !== 'object') return;
    if(opts.url) _pollConfig.url = opts.url;
    if(typeof opts.interval === 'number') _pollConfig.interval = opts.interval;
    if(opts.fetchOptions) _pollConfig.fetchOptions = opts.fetchOptions;
  }

  // Expose polling API on window for easy use from the host page.
  window.analyticsPolling = {
    configure: configurePolling,
    start: startPolling,
    stop: stopPolling,
    fetchOnce: fetchAndApply,
    getConfig: () => ({..._pollConfig})
  };

})();
