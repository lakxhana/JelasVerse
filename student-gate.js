window.addEventListener('jelasverse-data-ready',()=>{
  const api=window.JelasVerseData;
  // Every refresh is a new anonymous learner for this classroom demo.
  // There is no student sign-in screen and no name is collected.
  void api?.startAnonymousStudent?.({fresh:true});
});
