/* The Science Lab ships as a pre-built bundle, so these two additions are
   layered on from outside it: a Back control standing in for Return, and
   the per-word hover treatment the lab already styles (.word-hover) but
   only applies to its own headings. Both are re-applied on mutation
   because React re-renders the dialog as the learner moves between
   senses. */
(() => {
  const WORD_TARGETS = [
    '.narrator-line',
    '.sense-progress',
    '.sense-info-panel h2',
    '.sense-info-panel p',
    '.organ-picture p',
    '.sequence-goal',
    '.explorer-guidance',
  ].join(', ');
  const SKIP = 'button, input, select, textarea, .sense-icon, .word-hover';

  function decorateWords(root) {
    root.querySelectorAll(WORD_TARGETS).forEach(element => {
      if (element.closest('button') || element.querySelector('.word-hover')) return;
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (node.parentElement?.closest(SKIP)) continue;
        if (/\S/.test(node.nodeValue)) textNodes.push(node);
      }
      textNodes.forEach(node => {
        const fragment = document.createDocumentFragment();
        node.nodeValue.split(/(\s+)/).forEach(part => {
          if (/\S/.test(part)) {
            const word = document.createElement('span');
            word.className = 'word-hover';
            word.textContent = part;
            fragment.append(word);
          } else if (part) {
            fragment.append(document.createTextNode(part));
          }
        });
        node.replaceWith(fragment);
      });
    });
  }

  function ensureBackButton() {
    const actions = document.querySelector('.explorer-actions');
    /* The bundle renders the explorer, completion and quiz action rows into one
       ternary slot, so React reuses the same <div> and only swaps its class and
       children. Our Back is prepended outside React's knowledge, so it survives
       that reconciliation and strands itself on the next screen. Drop any Back
       that is no longer in the explorer row: completion ships its own Return
       and Reset, and the quiz ships Exit. */
    document.querySelectorAll('.jv-back-button').forEach(button => {
      if (button.parentElement !== actions) button.remove();
    });
    if (!actions || actions.querySelector('.jv-back-button')) return;
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'jv-back-button activity-exit';
    back.textContent = 'Back';
    back.addEventListener('click', () => {
      // In the explorer this is the bundle's Return button, which the theme
      // hides (.explorer-actions .activity-return); a display:none button
      // still takes .click(), and its onClick is the only exit the bundle
      // exposes. history.back() covers the states that render no exit at all.
      const exit = [...document.querySelectorAll('.activity-exit')]
        .find(button => !button.classList.contains('jv-back-button'));
      if (exit) exit.click();
      else history.back();
    });
    actions.prepend(back);
  }

  let pending = 0;
  const apply = () => {
    try {
      decorateWords(document.body);
      ensureBackButton();
    } catch {
      /* A re-render raced us; the next mutation retries. */
    }
  };
  const schedule = () => {
    clearTimeout(pending);
    pending = setTimeout(apply, 60);
  };

  apply();
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
})();
