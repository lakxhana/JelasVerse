window.addEventListener('jelasverse-data-ready',()=>{
  const api=window.JelasVerseData;
  if(api?.getStudentCode?.())return;
  const gate=document.createElement('section');
  gate.id='studentGate';
  gate.innerHTML='<form class="student-gate-card"><p>JELASVERSE</p><h1>Welcome</h1><label>Student code<input inputmode="numeric" autocomplete="one-time-code" maxlength="4" placeholder="0000" aria-label="Student code" autofocus></label><button>Enter</button><output role="status"></output></form>';
  document.body.append(gate);
  const form=gate.querySelector('form'),input=gate.querySelector('input'),output=gate.querySelector('output');
  form.addEventListener('submit',async event=>{event.preventDefault();try{output.textContent='Opening…';await api.signInStudent(input.value);gate.remove();location.reload()}catch(error){output.textContent=error.message||'Please try again.'}});
  input.focus();
});
