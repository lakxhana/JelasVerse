(() => {
  // The phone controller lives in the parent game. Mirror its joystick as the
  // Maths Lab's normal WASD input, so the same controller works after landing.
  const remoteDirections={up:{code:'KeyW',key:'w'},down:{code:'KeyS',key:'s'},left:{code:'KeyA',key:'a'},right:{code:'KeyD',key:'d'}};
  const remoteHeld=new Set();
  let remoteActionDown=false;
  const remoteInputBlocked=()=>{
    try{
      const parent=window.parent;
      return parent!==window&&(parent.isOrbitSettingsOpen?.()||parent.isOrbitHomeConfirmationOpen?.());
    }catch{return false;}
  };
  const dispatchRemoteKey=(type,direction)=>{
    const key=remoteDirections[direction];
    window.dispatchEvent(new KeyboardEvent(type,{key:key.key,code:key.code,bubbles:true,cancelable:true}));
  };
  const releaseRemote=()=>{
    for(const direction of remoteHeld)dispatchRemoteKey('keyup',direction);
    remoteHeld.clear();
    remoteActionDown=false;
  };
  const dispatchRemoteAction=()=>{
    // The Maths Lab uses F as its nearby-station interaction key.  Match that
    // native control so Continue opens the Learning Booth or Quiz at the
    // station Maya is standing beside.
    const detail={key:'f',code:'KeyF',bubbles:true,cancelable:true};
    window.dispatchEvent(new KeyboardEvent('keydown',detail));
    window.dispatchEvent(new KeyboardEvent('keyup',detail));
  };
  const syncRemote=controls=>{
    const blocked=remoteInputBlocked();
    for(const direction of Object.keys(remoteDirections)){
      const shouldHold=!blocked&&controls?.[direction]===true;
      if(shouldHold&&!remoteHeld.has(direction)){remoteHeld.add(direction);dispatchRemoteKey('keydown',direction);}
      if(!shouldHold&&remoteHeld.has(direction)){remoteHeld.delete(direction);dispatchRemoteKey('keyup',direction);}
    }
    const action=!blocked&&controls?.action===true;
    if(action&&!remoteActionDown)dispatchRemoteAction();
    remoteActionDown=action;
  };
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin||event.source!==window.parent)return;
    if(event.data?.type==='orbit-runner-language'){applyLabLanguage(event.data.language);return;}
    if(event.data?.type==='orbit-runner-controller')syncRemote(event.data.controls);
  });
  // Once the lab fills the screen it can also read the local bridge directly.
  // This prevents a nested-frame timing gap from dropping joystick movement.
  let controllerPollBusy=false;
  const pollController=async()=>{
    if(controllerPollBusy)return;
    controllerPollBusy=true;
    try{
      const response=await fetch('http://127.0.0.1:4174/api/controller',{cache:'no-store'});
      if(response.ok)syncRemote(await response.json());
    }catch{releaseRemote();}
    finally{controllerPollBusy=false;}
  };
  const controllerPoll=window.setInterval(pollController,80);
  window.addEventListener('blur',releaseRemote);
  window.addEventListener('pagehide',()=>{window.clearInterval(controllerPoll);releaseRemote();});
  const excluded='script,style,textarea,option,code,.hover-word,[data-no-word-hover]';
  const canDecorate=node=>{
    const parent=node.parentElement;
    return !!(parent&&parent.closest('#root')&&!parent.closest(excluded)&&/\S/.test(node.nodeValue));
  };
  const decorateWords=root=>{
    const scope=root?.nodeType===Node.TEXT_NODE?root.parentElement:root;
    if(!scope)return;
    const walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT,{acceptNode:node=>canDecorate(node)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
    const nodes=[];
    for(let node=walker.nextNode();node;node=walker.nextNode())nodes.push(node);
    nodes.forEach(node=>{
      const fragment=document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(part=>{
        if(/\S/.test(part)){
          const word=document.createElement('span');
          word.className='hover-word';
          word.textContent=part;
          fragment.append(word);
        }else fragment.append(document.createTextNode(part));
      });
      node.replaceWith(fragment);
    });
  };
  let labLanguage=(()=>{try{return localStorage.getItem('orbit-runner-language')==='ms'?'ms':'en';}catch{return'en';}})();
  const labText={
    'LEARNING BOOTH':'RUANG BELAJAR',
    'QUIZ':'KUIZ',
    'HOME':'LAMAN UTAMA',
    'ALGEBRA · READY':'ALGEBRA · SEDIA',
    'COMPLETED':'SELESAI',
    'INTERACT':'INTERAKSI'
  };
  const translateLabTextNode=node=>{
    if(node.nodeType!==Node.TEXT_NODE)return;
    const raw=node.nodeValue;
    const parts=raw.match(/^(\s*)(.*?)(\s*)$/s);
    const core=parts?.[2]??raw;
    const translated=labLanguage==='ms'?labText[core]:Object.entries(labText).find(([,malay])=>malay===core)?.[0];
    if(translated&&translated!==core)node.nodeValue=(parts?.[1]??'')+translated+(parts?.[3]??'');
  };
  const translateLabTree=root=>{
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    for(let node=walker.nextNode();node;node=walker.nextNode())translateLabTextNode(node);
  };
  const simplifyCopy=()=>{
    const ms=labLanguage==='ms';
    const setCopy=(selector,copy)=>document.querySelectorAll(selector).forEach(element=>{
      if(element.textContent.trim()!==copy)element.textContent=copy;
    });
    setCopy('.caption strong',ms?'RUANG BELAJAR':'LEARNING BOOTH');
    setCopy('#challenge-launch',ms?'RUANG BELAJAR':'LEARNING BOOTH');
    setCopy('#match-launch',ms?'KUIZ':'QUIZ');
    setCopy('.artefact-prompt',ms?'KUIZ':'QUIZ');
    document.querySelectorAll('.caption > span,.direct-activity > span').forEach(element=>{
      element.textContent='';
      element.setAttribute('aria-hidden','true');
    });
    document.querySelector('.direct-activity')?.setAttribute('aria-label','Learning booth');
  };
  const applyLabLanguage=nextLanguage=>{
    labLanguage=nextLanguage==='ms'?'ms':'en';
    document.documentElement.lang=labLanguage==='ms'?'ms':'en';
    document.querySelectorAll('.hover-word').forEach(word=>word.replaceWith(document.createTextNode(word.textContent)));
    simplifyCopy();
    const home=document.getElementById('returnHome');
    if(home){home.textContent=labLanguage==='ms'?'LAMAN UTAMA':'HOME';home.setAttribute('aria-label',labLanguage==='ms'?'Kembali ke pilihan laluan':'Return to route selection');}
    translateLabTree(document.getElementById('root'));
  };
  const ensureHome=()=>{
    let home=document.getElementById('returnHome');
    if(home)return home;
    home=document.createElement('button');
    home.id='returnHome';
    home.type='button';
    home.textContent='HOME';
    home.setAttribute('aria-label','Return to route selection');
    home.dataset.noWordHover='true';
    home.addEventListener('click',()=>{
      window.parent?.postMessage({type:'orbit-runner-home'},window.location.origin);
    });
    document.body.append(home);
    return home;
  };
  const pointsKey='orbit-flight-points';
  const currentPoints=()=>{
    try{
      const points=Number.parseInt(sessionStorage.getItem(pointsKey)||'0',10);
      return Number.isFinite(points)&&points>0?points:0;
    }catch{return 0;}
  };
  const ensurePoints=()=>{
    let points=document.getElementById('classroomPoints');
    if(!points){
      points=document.createElement('div');
      points.id='classroomPoints';
      points.setAttribute('aria-live','polite');
      points.setAttribute('aria-label','Flight points');
      points.dataset.noWordHover='true';
      points.innerHTML='<span class="reward-star" aria-hidden="true">★</span><span class="points-value">0</span>';
      document.body.append(points);
    }
    const value=points.querySelector('.points-value');
    if(value)value.textContent=String(currentPoints());
    return points;
  };
  const root=document.getElementById('root');
  if(root){
    ensureHome();
    ensurePoints();
    applyLabLanguage(labLanguage);
    decorateWords(root);
    const observer=new MutationObserver(records=>{
      const roots=new Set();
      for(const record of records){
        if(record.type==='characterData')roots.add(record.target.parentElement);
        else for(const node of record.addedNodes)if(node.nodeType===Node.ELEMENT_NODE||node.nodeType===Node.TEXT_NODE)roots.add(node);
      }
      queueMicrotask(()=>{simplifyCopy();roots.forEach(decorateWords);});
    });
    observer.observe(root,{childList:true,characterData:true,subtree:true});
    window.addEventListener('load',simplifyCopy,{once:true});
  }
  window.addEventListener('storage',event=>{
    if(event.key===pointsKey)ensurePoints();
  });
})();
